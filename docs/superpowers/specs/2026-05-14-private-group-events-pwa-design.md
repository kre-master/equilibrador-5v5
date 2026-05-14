# Private Group Events PWA Design

## Objetivo

Evoluir o equilibrador 5v5 de uma ferramenta local de gerar equipas para uma PWA de organizacao de jogos amadores por grupos privados. A primeira versao deve servir o grupo atual sem custos de App Store/Google Play, mas com uma base de produto que permita crescer para Android/iOS e monetizacao mais tarde.

O ciclo principal passa a ser: criar evento, recolher presencas durante a semana, completar vagas com jogadores ocasionais se necessario, gerar equipas equilibradas, partilhar a imagem no WhatsApp e guardar resultado/historico.

## Decisoes Aprovadas

- A primeira versao sera uma PWA, publicada na web e instalavel no telemovel.
- O login inicial sera por email e password usando Supabase Auth.
- Cada jogador tera uma conta propria, mas as contas ficam separadas dos perfis de jogador.
- Os perfis de jogador existentes continuam a guardar nome, foto, ratings e historico.
- Um jogador pode existir sem conta, criado por admin, para jogadores ocasionais ou antigos.
- Quando alguem cria conta, pode reclamar um perfil existente, por exemplo "Sou o Ramos".
- O admin aprova ou rejeita pedidos de associacao entre conta e perfil.
- Eventos pertencem a um grupo privado.
- O admin lanca eventos com data, hora, local e configuracao de jogadores.
- Jogadores autenticados respondem ao evento como o seu proprio perfil: vou, talvez ou nao vou.
- O gerador de equipas atual sera reaproveitado, mas alimentado pelas presencas do evento.

## Escopo Do MVP

Inclui:

- PWA com estrutura mobile-first.
- Autenticacao por email/password.
- Estados de acesso: visitante, jogador autenticado, admin.
- Perfis de jogador separados das contas.
- Fluxo para reclamar perfil existente.
- Painel admin para aprovar pedidos de associacao.
- Grupos privados, inicialmente com um grupo principal.
- Criacao e edicao de eventos pelo admin.
- Resposta de presenca por jogador autenticado.
- Adicao de jogadores ocasionais ao evento pelo admin.
- Geracao de equipas a partir dos confirmados.
- Confirmacao de jogo e exportacao PNG com a composicao.
- Historico com resultado editavel.

Fica fora deste MVP:

- Publicacao nativa na App Store e Google Play.
- Pagamentos/subscricoes.
- Login por SMS.
- Marketplace de jogos publicos.
- Multi-desporto completo. O modelo deve permitir desporto no futuro, mas a interface inicial sera focada em futsal/5v5.
- Chat interno. O WhatsApp continua a ser o canal de comunicacao.

## Papeis

### Visitante

Pode abrir a app publica, ver informacao basica e criar conta. Nao consegue responder a eventos enquanto nao estiver autenticado e associado a um perfil aprovado.

### Jogador

Tem conta Supabase Auth ligada a um perfil de jogador aprovado. Pode ver eventos do grupo, responder presenca, ver equipas quando publicadas e consultar historico relevante.

### Admin

Pode gerir jogadores, ratings, fotos, pedidos de associacao, eventos, presencas manuais, convidados/ocasionais, equipas, resultados e exportacoes.

## Fluxo De Conta E Perfil

1. O jogador cria conta com email/password.
2. Se ainda nao tiver perfil associado, a app mostra uma lista pesquisavel de perfis disponiveis.
3. O jogador escolhe o perfil que corresponde a si.
4. A app cria um pedido de associacao com estado `pending`.
5. O admin ve o pedido no painel.
6. O admin aprova ou rejeita.
7. Quando aprovado, a conta passa a ficar ligada ao perfil.
8. O jogador passa a responder a eventos com esse perfil.

Se um jogador novo ainda nao existir, o admin pode criar o perfil primeiro e depois o jogador reclama esse perfil. Jogadores ocasionais podem continuar sem conta.

## Fluxo De Evento

1. Admin cria evento com:
   - titulo
   - desporto inicial: futsal
   - data e hora
   - local
   - limite de titulares, inicialmente 10
   - limite total com suplentes, inicialmente ate 13
   - estado: draft, open, locked, completed ou cancelled
2. Admin lanca o evento.
3. Jogadores autenticados respondem:
   - `going`
   - `maybe`
   - `not_going`
4. Admin acompanha contadores e lista de respostas.
5. Se faltar gente, admin adiciona jogadores ocasionais ou convida jogadores sem conta.
6. Quando houver entre 10 e 13 disponiveis, admin gera sugestoes.
7. Admin pre-visualiza a sugestao no campo.
8. Admin confirma o jogo.
9. A app cria/atualiza o jogo no historico e permite exportar PNG.
10. Depois do jogo, admin regista resultado.

## Modelo De Dados Proposto

### `profiles`

Representa a conta de utilizador.

- `id`: auth user id
- `email`
- `display_name`
- `role`: player ou admin
- `created_at`
- `updated_at`

### `players`

Representa o perfil desportivo.

- `id`
- `name`
- `pace`
- `shooting`
- `passing`
- `dribbling`
- `defending`
- `physical`
- `overall`
- `photo_data_url`
- `linked_user_id`: opcional
- `is_guest`
- `created_at`
- `updated_at`

### `player_claims`

Pedidos para ligar conta a jogador.

- `id`
- `user_id`
- `player_id`
- `status`: pending, approved, rejected
- `created_at`
- `reviewed_at`
- `reviewed_by`

### `groups`

Grupo privado de organizacao.

- `id`
- `name`
- `sport_default`
- `created_by`
- `created_at`

### `group_members`

Liga perfis/jogadores ao grupo.

- `id`
- `group_id`
- `player_id`
- `role`: player ou admin
- `status`: active ou inactive

### `events`

Evento antes do jogo ser fechado.

- `id`
- `group_id`
- `title`
- `sport`
- `starts_at`
- `location`
- `min_players`
- `max_players`
- `status`
- `created_by`
- `created_at`
- `updated_at`

### `event_responses`

Resposta de presenca.

- `id`
- `event_id`
- `player_id`
- `user_id`: opcional para rastrear quem respondeu
- `status`: going, maybe, not_going
- `updated_at`

### `games`

Jogo confirmado, reaproveitando a estrutura atual e ligando ao evento.

- `id`
- `event_id`
- `date`
- `status`
- `team_a`
- `team_b`
- `bench_a`
- `bench_b`
- `score_a`
- `score_b`
- `notes`
- `updated_at`

## Alteracoes Na App Atual

### Navegacao

A interface atual tem "Hoje", "Jogadores" e "Historico". A evolucao deve passar para:

- "Eventos": lista e detalhe do proximo jogo.
- "Gerar": dentro do evento, para admin.
- "Jogadores": perfis, ratings, fotos e associacoes.
- "Pedidos": pedidos de associacao de perfil, visivel para admin.
- "Historico": jogos terminados e resultados.

No mobile, a navegacao deve ser simples e no fundo do ecra ou como tabs compactas.

### Gerador

O gerador atual deve deixar de comecar por selecao manual solta. A fonte principal passa a ser o evento:

- Confirmados `going` entram automaticamente.
- `maybe` aparecem como candidatos.
- `not_going` ficam fora.
- Admin pode adicionar/remover manualmente jogadores do evento.
- Convidados/ocasionais continuam possiveis, com nota rapida 0-10.

### PNG

O PNG continua a ser uma peca central para WhatsApp. Deve incluir:

- nome do evento ou "Jogo 5v5"
- data/hora
- Equipa A e Equipa B
- cartas dos titulares
- suplentes fora do campo
- resultado apenas se ja existir

## Permissoes E Seguranca

Supabase RLS deve permitir:

- leitura publica limitada apenas onde fizer sentido para o MVP publicado
- jogadores autenticados lerem eventos/grupo onde pertencem
- jogadores autenticados criarem/atualizarem a sua propria resposta de presenca
- jogadores autenticados criarem pedido de associacao para si
- admins gerirem jogadores, eventos, pedidos, jogos e resultados

Como primeira iteracao tecnica, pode manter-se um unico grupo privado e policies simples. O desenho das tabelas deve evitar bloquear o crescimento para varios grupos.

## Estados E Erros

- Conta sem perfil aprovado: mostrar chamada para reclamar perfil e bloquear respostas a eventos.
- Pedido pendente: mostrar estado "a aguardar aprovacao".
- Evento sem jogadores suficientes: mostrar quantos faltam para gerar equipas.
- Evento com jogadores a mais: admin escolhe titulares/suplentes ou deixa o algoritmo selecionar dentro do limite.
- Supabase indisponivel: app deve mostrar erro claro e evitar prometer que guardou dados.
- Visitante nao autenticado: pode criar conta ou entrar, mas nao responde como jogador.

## Plano De Implementacao Em Fases

### Fase 1: Base de contas e perfis

- Introduzir tabelas `profiles`, `player_claims`, `groups`, `group_members`, `events` e `event_responses`.
- Adaptar `players` para suportar `linked_user_id`.
- Criar UI de login/criacao de conta.
- Criar UI para reclamar perfil.
- Criar painel admin de aprovacao.

### Fase 2: Eventos e presencas

- Criar lista de eventos.
- Criar detalhe do evento.
- Permitir admin criar/lancar evento.
- Permitir jogador responder presenca.
- Mostrar contadores e listas por estado.

### Fase 3: Gerador ligado ao evento

- Reaproveitar algoritmo atual com os jogadores `going`.
- Permitir incluir `maybe` e ocasionais.
- Confirmar jogo a partir do evento.
- Guardar historico com `event_id`.

### Fase 4: PWA e polimento mobile

- Adicionar manifest, iconografia e configuracao PWA.
- Melhorar layout mobile.
- Rever fluxo de partilha PNG no telemovel.
- Preparar o site para uso regular a partir do ecra inicial.

## Validacao

Antes de publicar cada fase:

- testar login admin
- testar criacao de conta jogador
- testar reclamacao e aprovacao de perfil
- testar resposta a evento como jogador
- testar geracao de equipas a partir de evento
- testar exportacao PNG em desktop e mobile
- testar push para GitHub e deploy no GitHub Pages

## Riscos

- Migrar dados existentes sem perder fotos/ratings: deve haver cuidado ao alterar schema.
- RLS pode bloquear escritas se as policies forem demasiado restritivas.
- A app atual esta concentrada em `app.js`; durante a implementacao, pode justificar separar modulos para auth, dados, eventos e gerador.
- Fotos em base64 funcionam para MVP, mas podem ficar pesadas. Supabase Storage fica como melhoria posterior.

## Criterio De Sucesso

O MVP esta bem sucedido quando um grupo consegue organizar uma semana inteira sem folhas externas:

1. Admin lanca jogo.
2. Jogadores entram com conta e respondem.
3. Admin ve quem vai.
4. Admin completa vagas se necessario.
5. App gera equipas equilibradas.
6. PNG e partilhado no WhatsApp.
7. Resultado fica no historico.
