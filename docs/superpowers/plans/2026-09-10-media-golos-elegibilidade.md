# Media de Golos e Elegibilidade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar os rankings de medias de golos e excluir jogadores com menos de 5 jogos ou seis ausencias consecutivas recentes.

**Architecture:** Criar funcoes puras para resumir golos e determinar elegibilidade a partir dos jogos finalizados. `app.js` transforma o historico em participacoes, aplica ordenacao deterministica e reutiliza os cartoes de ranking existentes.

**Tech Stack:** JavaScript sem framework, Node `node:test`, HTML/CSS, build web existente.

---

## Estrutura de ficheiros

- Criar `stats-calculations.js`: medias, ausencias e elegibilidade.
- Criar `tests/stats-calculations.test.mjs`: regressao das regras.
- Modificar `app.js`: integrar e renderizar rankings.
- Modificar `styles.css`: responsividade das novas linhas.
- Modificar `index.html`, `scripts/build-web.mjs` e `package.json`.

### Task 1: Criar calculos e testes

**Files:**
- Create: `stats-calculations.js`
- Create: `tests/stats-calculations.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Escrever testes que falham para medias**

```js
const row = summarizePlayerGoals([
  { goalsFor: 10, goalsAgainst: 7 },
  { goalsFor: 8, goalsAgainst: 3 },
]);
assert.deepEqual(row, {
  appearances: 2,
  goalsFor: 18,
  goalsAgainst: 10,
  goalsForAverage: 9,
  goalsAgainstAverage: 5,
});
```

Adicionar um caso `5 / 3` para provar que a ordenacao conserva precisao e a apresentacao pode arredondar depois.

- [ ] **Step 2: Escrever testes de elegibilidade**

```js
assert.equal(isGoalAverageEligible({ appearances: 4, recentAbsences: 0 }), false);
assert.equal(isGoalAverageEligible({ appearances: 5, recentAbsences: 5 }), true);
assert.equal(isGoalAverageEligible({ appearances: 5, recentAbsences: 6 }), false);
assert.equal(countLeadingAbsences(["absent", "absent", "win"]), 2);
assert.equal(countLeadingAbsences(["win", "absent", "absent"]), 0);
```

Confirmar que jogos abertos nao entram na sequencia fornecida a funcao.

- [ ] **Step 3: Executar e confirmar falha**

Run: `node --test tests/stats-calculations.test.mjs`

Expected: FAIL porque `stats-calculations.js` nao existe.

- [ ] **Step 4: Implementar modulo UMD**

Expor:

```js
summarizePlayerGoals(performances)
countLeadingAbsences(recentTeamRecord)
isGoalAverageEligible({ appearances, recentAbsences, minimumGames = 5, maximumAbsences = 5 })
sortGoalsForAverage(a, b, getName)
sortGoalsAgainstAverage(a, b, getName)
```

Ordenacao de marcados: maior media, maior total, mais jogos, nome. Ordenacao de sofridos: menor media, menor total, mais jogos, nome.

- [ ] **Step 5: Adicionar script e executar**

```json
"test:stats": "node --test tests/stats-calculations.test.mjs"
```

Run: `npm.cmd run test:stats`

Expected: todos os testes passam.

- [ ] **Step 6: Commit**

```bash
git add stats-calculations.js tests/stats-calculations.test.mjs package.json
git commit -m "Add tested goal average eligibility"
```

### Task 2: Integrar no historico dos jogadores

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Somar golos pela perspetiva do jogador**

Em `getPlayerHistoryStatsRows()`, para cada participacao finalizada:

```js
const goalsFor = participation.side === "A" ? Number(game.scoreA) : Number(game.scoreB);
const goalsAgainst = participation.side === "A" ? Number(game.scoreB) : Number(game.scoreA);
```

Passar as atuacoes a `FooterStats.summarizePlayerGoals`.

- [ ] **Step 2: Contar ausencias consecutivas**

Usar `getPlayerTeamRecord(playerId, Number.MAX_SAFE_INTEGER)`, que ja vem do jogo mais recente para o mais antigo, mapear `outcome` e aplicar `countLeadingAbsences`. Apenas jogos finalizados entram nessa lista.

- [ ] **Step 3: Guardar campos no row**

Adicionar `goalsFor`, `goalsAgainst`, `goalsForAverage`, `goalsAgainstAverage`, `recentAbsences` e `goalAverageEligible`.

- [ ] **Step 4: Testar sintaxe e unidade**

Run: `node --check app.js`

Run: `npm.cmd run test:stats`

Expected: ambos passam.

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "Calculate player goal averages and absences"
```

### Task 3: Renderizar os dois rankings

**Files:**
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `index.html`

- [ ] **Step 1: Preparar rankings elegiveis**

Em `renderStatsPanel()`:

```js
const eligibleGoalRows = activeRows.filter((row) => row.goalAverageEligible);
const goalsForRows = eligibleGoalRows.slice()
  .sort((a, b) => FooterStats.sortGoalsForAverage(a, b, row => row.player.name))
  .slice(0, 5);
const goalsAgainstRows = eligibleGoalRows.slice()
  .sort((a, b) => FooterStats.sortGoalsAgainstAverage(a, b, row => row.player.name))
  .slice(0, 5);
```

- [ ] **Step 2: Formatar a duas casas**

```js
function formatStatsAverage(value) {
  return new Intl.NumberFormat("pt-PT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}
```

- [ ] **Step 3: Permitir empty state especifico**

Alterar `renderStatsRanking(title, rows, valueRenderer, emptyMessage = "Sem dados.")` e usar:

```text
E preciso ter 5 jogos e nao estar ausente ha mais de 5 jogos.
```

- [ ] **Step 4: Adicionar cartoes**

Renderizar `Melhor media de golos marcados` com `X,XX golos/jogo` e `Menos golos sofridos` com o mesmo formato. O nome continua a abrir o perfil; nao mostrar publicamente a razao de exclusao de cada jogador.

- [ ] **Step 5: Responsividade e cache**

Garantir linha legivel a 375 px, alvo de 44 px para o nome e ausencia de scroll horizontal. Carregar `stats-calculations.js` antes de `app.js` e atualizar cache-busters.

- [ ] **Step 6: Verificar e commit**

Run: `node --check app.js`

Run: `npm.cmd run test:stats`

Run: `git diff --check`

```bash
git add app.js styles.css index.html
git commit -m "Show eligible goal average rankings"
```

### Task 4: Sincronizar bundle e documentacao

**Files:**
- Modify: `scripts/build-web.mjs`
- Modify: `Footer_vault/03 - Decisoes e regras.md`
- Modify: `Footer_vault/04 - Estado tecnico.md`
- Generate: `www/stats-calculations.js`
- Generate: `www/app.js`
- Generate: `www/index.html`
- Generate: `www/styles.css`

- [ ] **Step 1: Incluir modulo na build**

Adicionar `stats-calculations.js` ao array de ficheiros copiados.

- [ ] **Step 2: Registar regra**

Documentar minimo 5 jogos, exclusao na sexta ausencia consecutiva, reentrada imediata no regresso e medias calculadas sobre todo o historico de participacoes.

- [ ] **Step 3: Suite e build**

Run: `npm.cmd run test:stats`

Run: `node --check app.js`

Run: `npm.cmd run build:web`

Run: `node --check www/app.js`

Expected: tudo passa e `www/stats-calculations.js` existe.

- [ ] **Step 4: Smoke test e commit**

Testar manualmente 4/5 jogos, 5/6 ausencias, regresso, jogador de A/B e ecrã pequeno.

```bash
git add scripts/build-web.mjs "Footer_vault/03 - Decisoes e regras.md" "Footer_vault/04 - Estado tecnico.md" www/stats-calculations.js www/app.js www/index.html www/styles.css
git commit -m "Sync and document goal average rules"
```
