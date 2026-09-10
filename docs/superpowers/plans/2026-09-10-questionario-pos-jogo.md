# Questionario Pos-Jogo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar duas escalas obrigatorias de 1 a 10 no voto MVP, com escrita atomica, rollout no jogo atual e consulta administrativa.

**Architecture:** Guardar feedback imutavel numa tabela protegida por RLS e submeter voto mais feedback por uma unica funcao Postgres. Isolar regras de rollout e validacao num modulo JavaScript puro, deixando `app.js` responsavel por dados remotos e renderizacao.

**Tech Stack:** JavaScript sem framework, HTML/CSS, Node `node:test`, Supabase Postgres/RLS/RPC, build web existente.

---

## Estrutura de ficheiros

- Criar `postgame-feedback.js`: regras puras de elegibilidade, pendentes e escalas.
- Criar `tests/postgame-feedback.test.mjs`: testes unitarios do rollout e validacao.
- Criar via Supabase CLI `supabase/migrations/*_postgame_feedback.sql`: tabela, rollout, indices, RLS e RPC.
- Modificar `supabase/schema.sql`: espelhar o schema de producao.
- Modificar `app.js`: carregar, normalizar, submeter e apresentar feedback.
- Modificar `index.html`: carregar o modulo e atualizar o cache-buster.
- Modificar `styles.css`: gate, escalas e consulta administrativa.
- Modificar `scripts/build-web.mjs`: copiar o modulo.
- Modificar `package.json`: comando de teste.

### Task 1: Fixar as regras puras com testes

**Files:**
- Create: `postgame-feedback.js`
- Create: `tests/postgame-feedback.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Escrever testes que falham**

Testar estes contratos:

```js
assert.equal(isScaleValue(1), true);
assert.equal(isScaleValue(10), true);
assert.equal(isScaleValue(0), false);
assert.equal(isScaleValue(4.5), false);

assert.equal(isCheckinRequired({
  gameId: "current", hasVote: false, hasFeedback: false,
  isTransitionGame: true, isAfterRollout: false,
}), true);
assert.equal(isCheckinRequired({
  gameId: "current", hasVote: true, hasFeedback: false,
  isTransitionGame: true, isAfterRollout: false,
}), false);
assert.equal(isCheckinRequired({
  gameId: "next", hasVote: false, hasFeedback: false,
  isTransitionGame: false, isAfterRollout: true,
}), true);

assert.deepEqual(
  sortPendingCheckins([{ id: "b", date: "2026-09-08" }, { id: "a", date: "2026-09-01" }]).map(x => x.id),
  ["a", "b"]
);
```

- [ ] **Step 2: Executar e confirmar a falha**

Run: `node --test tests/postgame-feedback.test.mjs`

Expected: FAIL porque `postgame-feedback.js` ainda nao existe.

- [ ] **Step 3: Implementar o modulo UMD**

Expor `isScaleValue`, `isCheckinRequired`, `sortPendingCheckins` e os labels das duas escalas atraves de `window.FooterPostgame` e `module.exports`. `isCheckinRequired` deve devolver `false` quando ja existe feedback, quando o jogo de transicao ja tem voto ou quando o jogo e anterior ao rollout.

- [ ] **Step 4: Adicionar o script de teste**

Em `package.json`:

```json
"test:postgame": "node --test tests/postgame-feedback.test.mjs"
```

- [ ] **Step 5: Executar os testes**

Run: `npm.cmd run test:postgame`

Expected: todos os testes passam.

- [ ] **Step 6: Commit**

```bash
git add postgame-feedback.js tests/postgame-feedback.test.mjs package.json
git commit -m "Add tested postgame feedback rules"
```

### Task 2: Criar schema, rollout e RPC atomico

**Files:**
- Create: `supabase/migrations/*_postgame_feedback.sql` via `npx supabase migration new postgame_feedback`
- Modify: `supabase/schema.sql`

- [ ] **Step 1: Consultar a ajuda e criar a migracao pelo CLI**

Run: `npx supabase --help`

Run: `npx supabase migration new postgame_feedback`

Expected: novo ficheiro SQL em `supabase/migrations/` criado pelo CLI.

- [ ] **Step 2: Criar as tabelas e indices**

Adicionar `game_feedback` com `game_id`, `player_id`, `user_id`, duas escalas inteiras, `calculation_version default 1`, `created_at`, `unique(game_id, player_id)` e checks 1-10. Adicionar indices em `user_id`, `(player_id, created_at desc)` e `game_id`.

Adicionar `feature_rollouts` com chave primaria textual, `activated_at` e `transition_game_id`. Inserir `postgame_feedback` com `transition_game_id` selecionado como o jogo finalizado mais recente no momento em que a migracao corre, usando `on conflict do nothing`.

- [ ] **Step 3: Aplicar privilegios minimos e RLS**

Revogar tudo a `anon`. Dar a `authenticated` apenas `select` em `game_feedback` e `feature_rollouts`; a escrita de feedback acontece exclusivamente pelo RPC.

Politica de leitura de `game_feedback`:

```sql
using (
  user_id = (select auth.uid())
  or (select public.is_admin())
)
```

Nao criar politicas de update ou delete. Em `feature_rollouts`, permitir apenas leitura autenticada.

- [ ] **Step 4: Implementar `submit_postgame_checkin`**

Criar a logica privilegiada em `private.submit_postgame_checkin_internal` com `security definer set search_path = ''`, nomes totalmente qualificados e verificacao explicita de `(select auth.uid())`. Criar `public.submit_postgame_checkin` como wrapper `security invoker` para exposicao RPC. A funcao interna valida conta associada, jogo finalizado, participacao, candidato, escalas e regra de rollout antes de inserir voto e feedback na mesma transacao.

Revogar execucao das duas funcoes a `public` e `anon`; conceder apenas o minimo necessario a `authenticated`. Nao devolver `candidate_player_id`; devolver somente `game_id`, `player_id` e `created_at` do feedback.

- [ ] **Step 5: Espelhar SQL no schema completo**

Copiar as definicoes finais para `supabase/schema.sql`, mantendo a ordem: tabelas, indices, grants, RLS, policies e funcoes.

- [ ] **Step 6: Verificar seguranca**

Testar como jogador proprio, terceiro jogador e admin:

```sql
select * from public.game_feedback;
select public.submit_postgame_checkin('game-id', 'candidate-id', 8, 4);
```

Expected: proprio ve apenas as suas respostas; admin ve todas; terceiro nao ve; `anon` nao executa; um erro na segunda escrita nao deixa voto isolado.

- [ ] **Step 7: Executar advisors e commit**

Run: `npx supabase db advisors --help`

Run: `npx supabase db advisors`

Expected: nenhuma falha de seguranca nova.

```bash
git add supabase/migrations supabase/schema.sql
git commit -m "Add secure postgame feedback storage"
```

### Task 3: Integrar dados e submissao no cliente

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Normalizar e carregar feedback**

Adicionar `gameFeedback` e `featureRollouts` ao estado local. No carregamento remoto, admins consultam todas as respostas; jogadores consultam `.eq("user_id", currentSession.user.id)`. Tratar falta temporaria da tabela como aviso de schema sem quebrar o resto da app.

- [ ] **Step 2: Substituir a deteccao do voto pendente**

Trocar `getPendingMvpVoteRequirement()` por `getPendingPostgameCheckins()`, filtrando jogos finalizados em que o jogador participou e aplicando `FooterPostgame.isCheckinRequired`. Ordenar do mais antigo para o mais recente.

- [ ] **Step 3: Submeter remotamente por RPC**

Criar:

```js
async function submitPostgameCheckin(game, candidateId, gameIntensity, remainingEnergy) {
  const { data, error } = await supabaseClient.rpc("submit_postgame_checkin", {
    p_game_id: game.id,
    p_candidate_player_id: candidateId,
    p_game_intensity: gameIntensity,
    p_remaining_energy: remainingEnergy,
  });
  if (error) throw error;
  return data;
}
```

No modo local, validar tudo primeiro e depois atualizar voto e feedback no mesmo bloco sincrono antes de `saveState()`.

- [ ] **Step 4: Manter compatibilidade**

O painel MVP dentro do jogo continua a mostrar o estado, mas qualquer nova submissao usa o check-in completo. Nao alterar contagens agregadas nem revelacao oficial.

- [ ] **Step 5: Validar**

Run: `node --check app.js`

Run: `npm.cmd run test:postgame`

Expected: ambos passam.

- [ ] **Step 6: Commit**

```bash
git add app.js
git commit -m "Integrate atomic postgame checkins"
```

### Task 4: Construir o gate acessivel

**Files:**
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `index.html`

- [ ] **Step 1: Renderizar MVP e duas escalas**

No gate, mostrar resultado, progresso `N de total`, select MVP e dois grupos de botoes 1-10. Cada grupo usa `role="radiogroup"`; cada botao usa `role="radio"`, `aria-checked` e label que inclui o extremo semantico.

- [ ] **Step 2: Controlar validacao e foco**

Desativar `Guardar e continuar` ate os tres valores existirem. Depois de tentativa invalida, focar o primeiro campo incompleto. Durante envio, desativar controlos e mostrar `A guardar...`; em erro, restaurar as escolhas e apresentar retry.

- [ ] **Step 3: Estilizar para toque e ecrã pequeno**

Usar alvos de 44 px, quebra 5+5 em largura pequena, foco visivel, selecao por preenchimento e contorno, e `prefers-reduced-motion`.

- [ ] **Step 4: Atualizar ordem dos gates**

Depois do ultimo check-in: revelacao MVP oficial, revelacao de cartas e resumo mensal. Garantir que apenas um gate esta visivel.

- [ ] **Step 5: Carregar modulo e cache-buster**

Carregar `postgame-feedback.js` antes de `app.js` e aplicar o mesmo novo cache-buster a CSS, configuracao e scripts.

- [ ] **Step 6: Verificacao manual**

Confirmar no jogo de transicao: nao votante ve formulario completo; votante anterior nao ve. Confirmar dois pendentes, duplo toque, falha de rede, teclado e 375 px.

- [ ] **Step 7: Commit**

```bash
git add app.js styles.css index.html
git commit -m "Build accessible postgame checkin gate"
```

### Task 5: Mostrar respostas aos administradores e sincronizar web

**Files:**
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `scripts/build-web.mjs`
- Generate: `www/postgame-feedback.js`
- Generate: `www/app.js`
- Generate: `www/index.html`
- Generate: `www/styles.css`

- [ ] **Step 1: Adicionar consulta ao detalhe do jogo**

Para admin, renderizar media de intensidade, media de energia, numero de respostas e linhas por jogador. Para nao-admin, nao inserir esta secao no DOM.

- [ ] **Step 2: Copiar o modulo na build**

Adicionar `postgame-feedback.js` ao array de `scripts/build-web.mjs`.

- [ ] **Step 3: Executar suite e build**

Run: `npm.cmd run test:postgame`

Run: `node --check app.js`

Run: `npm.cmd run build:web`

Run: `node --check www/app.js`

Expected: tudo passa e `www/postgame-feedback.js` existe.

- [ ] **Step 4: Smoke test local**

Iniciar `npm.cmd run dev`, abrir a app como admin e jogador, confirmar HTTP 200, ausencia de erros, privacidade e fluxo do jogo atual.

- [ ] **Step 5: Revisao e commit**

Run: `git diff --check`

```bash
git add scripts/build-web.mjs www/postgame-feedback.js www/app.js www/index.html www/styles.css
git commit -m "Expose admin postgame insights and sync web"
```
