# Resumo Mensal do Jogador Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a aba `O teu mes`, com abertura automatica unica, historico, mensagens com humor, cartas, calorias e grafico anual pessoal.

**Architecture:** Concentrar calculos mensais, energia, mensagens, series anuais e eventos de cartas num modulo puro testavel. Persistir apenas dados fonte, historico privado de peso, eventos idempotentes de cartas e marcadores de abertura; `app.js` orquestra Supabase, navegacao e DOM.

**Tech Stack:** JavaScript sem framework, SVG acessivel, HTML/CSS, Node `node:test`, Supabase Postgres/RLS, build web existente.

---

## Dependencia

Executar primeiro `docs/superpowers/plans/2026-09-10-questionario-pos-jogo.md`. O resumo aceita jogos historicos sem feedback, mas a abertura automatica espera todos os check-ins obrigatorios do mes.

## Estrutura de ficheiros

- Criar `monthly-recap.js`: funcoes puras de resumo, energia, copy, series e cartas.
- Criar `tests/monthly-recap.test.mjs`: testes de calculo e casos-limite.
- Criar via CLI `supabase/migrations/*_monthly_player_recap.sql`: pesos privados, cartas e aberturas.
- Modificar `supabase/schema.sql`: schema consolidado.
- Modificar `app.js`: dados, aba, perfil, gate e grafico.
- Modificar `index.html`: nova aba/view e modulo.
- Modificar `styles.css`: layout responsivo e grafico.
- Modificar `scripts/build-web.mjs` e `package.json`.

### Task 1: Implementar calculos puros por TDD

**Files:**
- Create: `monthly-recap.js`
- Create: `tests/monthly-recap.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Testar minutos, MET e calorias**

```js
assert.equal(activeMinutesForSquad(5), 50);
assert.equal(activeMinutesForSquad(6), 50 * 5 / 6);
assert.equal(activeMinutesForSquad(7), 50 * 5 / 7);
assert.equal(metForIntensity(1), 5);
assert.equal(metForIntensity(10), 10);
assert.equal(metForIntensity(null), 7);
assert.equal(estimateCalories({ weightKg: 75, minutes: 50, met: 7 }), 438);
```

- [ ] **Step 2: Testar agregacao mensal dos dois lados**

Criar jogos A/B com vitoria, empate e derrota. Confirmar participacoes, V-E-D, win rate, golos da equipa e adversarios, MVPs, minutos, calorias, intensidade e forma percebida. Um jogo sem feedback usa 7 MET e nao entra nas medias percebidas.

- [ ] **Step 3: Testar ano e ausencias**

Confirmar que a serie comeca no primeiro mes com jogo do grupo, omite meses futuros, usa `null` para desempenho em ausencia e usa zero apenas na serie de presencas.

- [ ] **Step 4: Testar mensagens deterministicas**

Para cada cenario da prioridade aprovada, confirmar a chave escolhida. Repetir a chamada com jogador/mes iguais e confirmar texto igual; mudar o mes e confirmar que a selecao pode variar sem deixar o conjunto do cenario.

- [ ] **Step 5: Testar eventos de cartas**

Confirmar primeira ocorrencia `isFirstEver: true`, repeticao, agrupamento mensal, varias fontes e deduplicacao pela chave `(playerId, awardKey, sourceType, sourceId)`.

- [ ] **Step 6: Executar testes em falha**

Run: `node --test tests/monthly-recap.test.mjs`

Expected: FAIL porque o modulo nao existe.

- [ ] **Step 7: Implementar o modulo UMD**

Expor:

```js
activeMinutesForSquad(squadSize)
metForIntensity(score)
estimateCalories({ weightKg, minutes, met })
buildMonthlyPlayerSummary({ playerId, monthId, games, feedback, mvpWinnerIdsByGame, weights })
buildYearSeries({ playerId, year, games, feedback, mvpWinnerIdsByGame })
selectMonthlyMessage(summary)
derivePlayerCardAwardEvents({ playerId, games, mvpWinnerIdsByGame })
groupMonthlyAwardEvents(events, monthId)
```

Todas as datas usam `YYYY-MM` derivado da data local do jogo, sem depender do timezone do browser para deslocar o dia.

- [ ] **Step 8: Adicionar e executar script**

Em `package.json`:

```json
"test:monthly": "node --test tests/monthly-recap.test.mjs"
```

Run: `npm.cmd run test:monthly`

Expected: todos os testes passam.

- [ ] **Step 9: Commit**

```bash
git add monthly-recap.js tests/monthly-recap.test.mjs package.json
git commit -m "Add tested monthly recap calculations"
```

### Task 2: Criar armazenamento privado e eventos idempotentes

**Files:**
- Create: `supabase/migrations/*_monthly_player_recap.sql` via `npx supabase migration new monthly_player_recap`
- Modify: `supabase/schema.sql`

- [ ] **Step 1: Criar a migracao pelo CLI**

Run: `npx supabase migration new monthly_player_recap`

Expected: ficheiro SQL criado pelo CLI em `supabase/migrations/`.

- [ ] **Step 2: Criar `player_private_metrics`**

Adicionar UUID PK, `player_id`, `user_id`, `weight_kg numeric(5,2)` com check razoavel `30..250`, `effective_from date` e `created_at`. Indexar `(user_id, effective_from desc)` e `(player_id, effective_from desc)`.

Dar `select, insert` a `authenticated`, sem update/delete. Politicas permitem apenas `user_id = (select auth.uid())` e exigem que o jogador esteja associado a essa conta. Nao incluir `is_admin()`.

- [ ] **Step 3: Criar `player_card_awards`**

Adicionar jogador, chave, tipo/fonte, data e `metadata jsonb default '{}'`. Criar unique `(player_id, award_key, source_type, source_id)`, FK index e indice `(player_id, awarded_at desc)`.

Dar leitura ao proprio jogador ou admin. Permitir insercao apenas ao admin para backfill/reconciliacao; o jogador nunca escreve premios derivados diretamente. Nao dar update/delete ao cliente.

- [ ] **Step 4: Criar `monthly_recap_views`**

Adicionar `player_id`, `user_id`, `month_id`, `first_opened_at` e unique `(player_id, month_id)`. Dar `select, insert` apenas ao proprio utilizador, com RLS. Usar `on conflict do nothing` no cliente.

- [ ] **Step 5: Espelhar em `schema.sql` e verificar**

Copiar schema, grants e policies consolidados. Confirmar que admin recebe zero linhas ao selecionar `player_private_metrics`, mesmo conhecendo o `player_id`; confirmar que terceiro jogador nao ve pesos, cartas ou views alheios.

- [ ] **Step 6: Advisors e commit**

Run: `npx supabase db advisors`

Expected: sem novas falhas de seguranca ou FKs sem indice.

```bash
git add supabase/migrations supabase/schema.sql
git commit -m "Add secure monthly recap storage"
```

### Task 3: Integrar peso privado e dados do resumo

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Carregar apenas o peso proprio**

Quando existe jogador associado, consultar `player_private_metrics` por `user_id` e ordenar por `effective_from`. Admin nao executa consulta para outros jogadores. Em modo local, manter lista vazia e usar 75 kg.

- [ ] **Step 2: Guardar nova medicao**

No perfil proprio, inserir novo registo com `effective_from` escolhida pelo jogador. Nunca atualizar historico. Validar 30-250 kg no cliente e na base de dados.

- [ ] **Step 3: Carregar cartas e views**

Carregar eventos de cartas do proprio jogador ou todos para admin. Carregar `monthly_recap_views` apenas do proprio jogador.

- [ ] **Step 4: Reconciliar eventos de cartas**

Derivar eventos deterministicamente com `FooterMonthly.derivePlayerCardAwardEvents`. O admin faz upsert em lote com `onConflict: "player_id,award_key,source_type,source_id"` para backfill global. Para o proprio jogador, a renderizacao usa a uniao deduplicada entre eventos derivados localmente e eventos persistidos, por isso nao depende de um admin ter aberto a app e nao permite fabricar premios na base de dados.

- [ ] **Step 5: Construir view-models**

Criar `getMonthlyRecap(monthId)` e `getYearRecapSeries(year)` que passam apenas os dados do jogador associado ao modulo puro. Nao guardar resumos calculados.

- [ ] **Step 6: Testar e commit**

Run: `node --check app.js`

Run: `npm.cmd run test:monthly`

```bash
git add app.js
git commit -m "Connect private weight and recap data"
```

### Task 4: Construir a aba `O teu mes`

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `styles.css`

- [ ] **Step 1: Adicionar navegacao e view**

Adicionar tab `data-view="monthly"` apenas para utilizadores com perfil associado e uma view com `#monthly-recap-panel`. Manter navegacao horizontal atual sem esconder tabs essenciais; em ecras pequenos permitir scroll da barra existente.

- [ ] **Step 2: Renderizar cabecalho e numeros**

Implementar seletor de mes com botoes anterior/seguinte e label clicavel. Renderizar mensagem, jogos, V-E-D, golos, MVPs, minutos e calorias com indicador de estimativa/peso de referencia.

- [ ] **Step 3: Renderizar forma percebida**

Mostrar medias 1-10, melhor/pior jogo e comparacao mensal. Sem feedback, mostrar `Ainda nao respondeste a estas perguntas neste mes`, nao zeros.

- [ ] **Step 4: Renderizar cartas**

Agrupar por tipo, mostrar preview existente, `NOVA` ou multiplicador mensal e abrir `showAwardDetail` no toque/Enter/Espaco.

- [ ] **Step 5: Estilizar responsivamente**

Usar grelha de 4/8 px, cartoes coerentes com Stats, alvos de 44 px, texto base legivel, sem scroll horizontal a 375 px e suporte de texto ampliado.

- [ ] **Step 6: Validar estados**

Testar: nenhum jogo no ano, mes sem participacao, um jogo, todos os jogos, sem feedback, sem cartas, peso de referencia e erro remoto com retry.

- [ ] **Step 7: Commit**

```bash
git add index.html app.js styles.css
git commit -m "Build personal monthly recap tab"
```

### Task 5: Criar grafico anual acessivel

**Files:**
- Modify: `app.js`
- Modify: `styles.css`

- [ ] **Step 1: Implementar seletor de metrica**

Disponibilizar win rate, golos/jogo, presencas, MVPs, intensidade e forma percebida. Apenas `Forma percebida` permite sobrepor intensidade, porque partilham escala 1-10.

- [ ] **Step 2: Renderizar SVG responsivo**

Calcular pontos a partir do viewBox, desenhar grelha subtil, linha, marcadores focaveis e labels de mes horizontais. Pontos usam `button`/controlos associados para toque e teclado, com valor exato no label.

- [ ] **Step 3: Adicionar resumo e tabela alternativa**

Gerar frase de maior subida/descida e tabela mensal recolhivel com cabecalhos e valores. Ausencias aparecem como `Nao jogou`.

- [ ] **Step 4: Movimento reduzido**

Animar apenas opacidade/transform durante 150-300 ms; remover transicoes com `prefers-reduced-motion`.

- [ ] **Step 5: Verificar e commit**

Testar teclado, leitor de ecra, 375 px, landscape e serie de um unico ponto.

```bash
git add app.js styles.css
git commit -m "Add accessible yearly player trends"
```

### Task 6: Abrir uma vez e integrar a sequencia de gates

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Determinar o resumo pendente**

Criar `getPendingMonthlyRecap()` para o mes civil anterior. Exigir participacao, MVPs fechados, check-ins obrigatorios concluidos e ausencia de view. Se houver varios meses, escolher apenas o elegivel mais recente.

- [ ] **Step 2: Marcar abertura de forma idempotente**

Ao mostrar o resumo, inserir `(player_id, user_id, month_id)` com `onConflict` e `ignoreDuplicates: true`. Se falhar, mostrar na mesma e nao atualizar memoria como persistido.

- [ ] **Step 3: Integrar a ordem**

Depois de check-ins, revelacao de MVP e revelacao de cartas, abrir a view mensal em modo destaque com botao `Continuar`. Fechar regressa a view anterior; a aba fica sempre disponivel.

- [ ] **Step 4: Foco e history**

Mover foco para o `h2`, preservar a view anterior e garantir back previsivel sem abrir novamente o resumo.

- [ ] **Step 5: Testar e commit**

Testar primeira abertura, segunda sessao, nenhum jogo, varios meses, MVP pendente, check-in pendente e falha ao gravar a view.

```bash
git add app.js
git commit -m "Open eligible monthly recap once"
```

### Task 7: Sincronizar bundle, documentar e validar

**Files:**
- Modify: `scripts/build-web.mjs`
- Modify: `index.html`
- Modify: `Footer_vault/03 - Decisoes e regras.md`
- Modify: `Footer_vault/04 - Estado tecnico.md`
- Generate: `www/monthly-recap.js`
- Generate: `www/app.js`
- Generate: `www/index.html`
- Generate: `www/styles.css`

- [ ] **Step 1: Incluir modulo e cache-buster**

Adicionar `monthly-recap.js` a build e carregar antes de `app.js`. Aplicar um identificador igual a todos os assets alterados.

- [ ] **Step 2: Atualizar memoria tecnica**

Registar regras de abertura, ano, cartas, peso privado, MET, minutos 5/6+, forma percebida e tabelas/RLS.

- [ ] **Step 3: Executar verificacao completa**

Run: `npm.cmd run test:postgame`

Run: `npm.cmd run test:monthly`

Run: `node --check app.js`

Run: `npm.cmd run build:web`

Run: `node --check www/app.js`

Run: `git diff --check`

Expected: tudo passa.

- [ ] **Step 4: Smoke test visual**

Verificar jogador/admin, peso invisivel ao admin, abertura unica, historico, cartas, grafico, dados anteriores ao questionario, 375 px e landscape.

- [ ] **Step 5: Commit**

```bash
git add scripts/build-web.mjs index.html "Footer_vault/03 - Decisoes e regras.md" "Footer_vault/04 - Estado tecnico.md" www/monthly-recap.js www/app.js www/index.html www/styles.css
git commit -m "Sync and document monthly player recap"
```
