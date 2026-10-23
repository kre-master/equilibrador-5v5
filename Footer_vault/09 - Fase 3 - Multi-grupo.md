# Fase 3 - Multi-grupo

Estado: em desenho (brainstorming iniciado a 2026-10-22). Ainda nada implementado.

## Fases do projecto

1. Site funcional para jogos - feito.
2. Tracker com video + comunidade - feito, em melhoria continua.
3. Abertura a outros grupos de amigos com perfis e convocatorias privadas; onboarding facil para jogadores e admin; criar o grupo "Futeboleiros" - a iniciar.
4. Jogos publicos, mais grupos, outra infraestrutura e precos - a pensar.

## Ponto de partida tecnico

O schema Supabase e de um grupo so: `profiles.role` e global (`is_admin()`), qualquer autenticado le jogadores/jogos/convocatorias e nenhuma tabela tem `group_id`.

## Decisoes tomadas (2026-10-23)

- **Identidade**: uma conta por pessoa que pode jogar em varios grupos. Ratings, forma e stats sao por grupo (confirmado 2026-10-23); o rating publico fica para a fase 4.
- **Criacao de grupos**: so com aprovacao do dono da app durante a fase 3.
- **Ratings iniciais**: admin do grupo da nota de 1 a 100 a cada jogador; opcao "nao sei" = todos comecam iguais e a forma ajusta. A nota de jogadores novos/convidados ja passou a 1-100 (antes 0-10).
- **Tracker com video**: fora da fase 3, mas e para incluir mais tarde.
- **Grupo piloto**: grupo que joga a mesma hora no campo ao lado; falta falar com eles.

## Proposta de estrutura

- Tabelas `groups` e `group_members (group_id, user_id, role: owner/admin/player)`; `group_id` em todas as tabelas de dominio; RLS com `is_group_member(group_id)` / `is_group_admin(group_id)`; storage em `/{group_id}/...`.
- Migracao: criar "Futeboleiros", preencher `group_id` nos dados existentes, dono da app como `owner`. Sem mudanca visivel.
- `groups.visibility` (`private` por agora) para preparar os jogos publicos da fase 4.

## Onboarding

- Admin: nome/local/dia/hora/nr de jogadores/preco -> colar lista de nomes (perfis sem conta) -> ratings iniciais -> link de convite para WhatsApp -> checklist ate ao primeiro jogo.
- Jogador: link de convite -> conta -> "qual destes es tu?" (claim existente) -> admin aprova -> cai na convocatoria aberta.

## Roadmap

1. 3.0 Fundacoes invisiveis (group_id, Futeboleiros, RLS por grupo).
2. 3.1 App com nocao de grupo (grupo ativo, papeis, notificacoes/stats por grupo).
3. 3.2 Convites e onboarding do jogador.
4. 3.3 Criar grupo com aprovacao + wizard do admin.
5. 3.4 Piloto de 4 a 6 semanas.

## Passo 3.0 - estado

- Migracao escrita em `supabase/groups-migration.sql` (idempotente, numa transacao). Ensaio sem gravar em `supabase/groups-migration-dryrun.sql` (versao completa gerada em `output/groups-migration-dryrun-full.sql`).
- Ensaio corrido em producao a 2026-10-23 dentro de uma transacao anulada (nada ficou gravado): dono e admin veem tudo; jogador ve dados do grupo mas nao pagamentos/financas, so o proprio perfil e os proprios votos; nao consegue promover-se nem alterar votos; conta de fora nao ve nada.
- **Aplicada em producao a 2026-10-23** (migracao Supabase `groups_foundation_phase_3_0`). Verificado: grupo Futeboleiros com 22 membros (owner=1, admin=1, player=20), nenhum jogador/jogo/evento/pagamento sem grupo, votos MVP so com "read own" e "delete admin". Advisors de seguranca sem tabelas desprotegidas; avisos restantes sao funcoes abertas de proposito (`email_for_login`, `has_any_profile`, `is_admin`, `mvp_vote_counts`) e a protecao de passwords vazadas desligada no Auth.
- Modelo: `groups` + `group_members (owner/admin/player)`; `group_id` em players, games, events, payments, finance_settings; tabelas filhas herdam o grupo pelo jogo/jogador/evento (funcoes `private.game_group`, `player_group`, `event_group`). RLS com `private.is_group_member` / `private.is_group_admin`.
- Dados atuais e todas as contas ficam nos Futeboleiros; conta `admin` = owner.
- Transitorio ate a 3.1: default de `group_id` = Futeboleiros; `profiles.role` sincronizado com `group_members`; contas novas entram nos Futeboleiros.
- Para a 3.1: `submit_postgame_checkin` exige um unico jogador ligado a conta - tem de escolher o jogador do grupo do jogo; triggers de coerencia (jogador e jogo do mesmo grupo); `finance_settings` deixa de usar id `main`.

## Visibilidade dos jogos (decidido 2026-10-23, para a 3.1)

- Grupo privado (como os Futeboleiros): tudo o que e do grupo so e visivel para membros.
- Um jogo/convocatoria pode ser marcado **publico**, mesmo num grupo privado (ex.: falta um jogador). Qualquer jogador da comunidade ve esse jogo e pode dizer que esta disponivel; o admin do grupo/jogo aceita ou recusa.
- Desenho proposto: `events.visibility` (`group` | `public`); tabela de pedidos (`event_join_requests`: evento, conta, estado pendente/aceite/recusado); ao aceitar, a pessoa entra como convidado nesse jogo (perfil de jogador no grupo + resposta "Vou") e ve so esse jogo, nao o resto do grupo.
- Pre-requisito: o perfil publico da comunidade (fase 4) - na 3.1 basta conta Footer.

## Falhas de seguranca encontradas em producao (2026-10-23)

- `profiles`: a politica de update deixava qualquer conta mudar o proprio `role` para `admin`. Corrigido na 3.0 com trigger (so admin do grupo muda roles).
- `game_mvp_votes`: em producao estavam ativas politicas antigas que deixavam qualquer conta ler todos os votos (quem votou em quem) e alterar o seu voto; `anon` tinha privilegios de tabela. Corrigido na 3.0: "ler so o proprio voto", sem update.

## Pre-requisito ja feito

- 2026-10-23: convocatoria/`Fazer equipas` simplificado para o admin (ver [[03 - Decisoes e regras]], seccao Equipas).

## Riscos

- Login por username, rate limit/captcha e confirmacao de email antes de abrir a outros grupos.
- Custo de storage de videos por grupo.
- "Visto" das notificacoes passa a ser por grupo.
- Sair/apagar grupo e RGPD.
