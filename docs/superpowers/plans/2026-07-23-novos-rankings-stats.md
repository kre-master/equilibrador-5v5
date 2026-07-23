# Novos Rankings dos Stats Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar ao Quadro de Honra as cinco melhores triplas, a melhor média de golos marcados e a menor média de golos sofridos.

**Architecture:** Extrair os cálculos combinatórios e as médias para um módulo JavaScript pequeno, utilizável pelo browser e pelos testes Node. O `app.js` continua responsável por transformar os jogos da aplicação em participações, associar jogadores e renderizar os rankings com os componentes visuais existentes.

**Tech Stack:** JavaScript sem framework, HTML/CSS, `node:test`, build web existente.

---

## Estrutura de ficheiros

- Criar `stats-calculations.js`: funções puras para combinações e médias.
- Criar `tests/stats-calculations.test.mjs`: regressões automatizadas dos cálculos.
- Modificar `app.js`: preparar dados, ordenar e renderizar os três rankings.
- Modificar `index.html`: carregar o módulo antes de `app.js` e atualizar cache-buster.
- Modificar `styles.css`: adaptar linhas com três nomes em ecrãs pequenos.
- Modificar `scripts/build-web.mjs`: copiar o novo módulo para `www/`.
- Modificar `package.json`: adicionar o comando de teste dos Stats.
- Modificar `Footer_vault/03 - Decisoes e regras.md` e `Footer_vault/04 - Estado tecnico.md`: guardar regras e implementação.
- Gerar `www/` através de `npm.cmd run build:web`.

### Task 1: Criar cálculos puros e testes

**Files:**
- Create: `stats-calculations.js`
- Create: `tests/stats-calculations.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Escrever testes que falham para triplas e médias**

Criar testes com `node:test` que confirmem:

```js
assert.equal(buildCombinationRanking(twoGames, 3, 3, 5).length, 0);
assert.deepEqual(
  buildCombinationRanking(threeGames, 3, 3, 5)[0].playerIds,
  ["a", "b", "c"]
);
assert.equal(trio.gamesTogether, 3);
assert.equal(trio.wins, 2);
assert.equal(trio.winRate, 67);

assert.deepEqual(summarizePlayerGoals([
  { playerId: "a", goalsFor: 10, goalsAgainst: 7 },
  { playerId: "a", goalsFor: 8, goalsAgainst: 3 },
]), {
  playerId: "a",
  appearances: 2,
  goalsFor: 18,
  goalsAgainst: 10,
  goalsForAverage: 9,
  goalsAgainstAverage: 5,
});
```

Adicionar três rankings controlados e confirmar explicitamente:

```js
assert.equal(rankingByWins[0].playerIds.join("::"), "a::b::c");
assert.equal(rankingByMargin[0].winMarginTotal, 6);
assert.equal(rankingByGames[0].gamesTogether, 4);
assert.equal(rankingByName[0].playerIds.join("::"), "a::b::c");
assert.equal(goalSummary.goalsForAverage, 5 / 3);
```

Os dados dos testes devem isolar um desempate de cada vez, mantendo iguais os critérios anteriores.

- [ ] **Step 2: Executar os testes e confirmar a falha inicial**

Run: `node --test tests/stats-calculations.test.mjs`

Expected: FAIL porque `stats-calculations.js` ainda não existe.

- [ ] **Step 3: Implementar o módulo compatível com browser e Node**

Expor estas funções:

```js
buildCombinationRanking(teamPerformances, groupSize, minimumGames, limit, getPlayerName)
summarizePlayerGoals(playerPerformances)
```

`teamPerformances` terá este contrato:

```js
{
  playerIds: ["a", "b", "c"],
  outcome: "win",
  winMargin: 4
}
```

O módulo deve:

- gerar combinações únicas com IDs ordenados;
- contar jogos, vitórias, empates, derrotas e margem nas vitórias;
- calcular `winRate` apenas para apresentação;
- manter a fórmula existente das duplas:

```js
score = wins * 12
  + winMarginTotal * 2
  + gamesTogether
  + wins / gamesTogether;
```

- filtrar pelo mínimo de jogos antes de ordenar;
- resumir golos por jogador com médias exatas.

- [ ] **Step 4: Adicionar o comando de teste**

Em `package.json`:

```json
"test:stats": "node --test tests/stats-calculations.test.mjs"
```

- [ ] **Step 5: Executar os testes**

Run: `npm.cmd run test:stats`

Expected: todos os testes passam.

- [ ] **Step 6: Commit**

```bash
git add stats-calculations.js tests/stats-calculations.test.mjs package.json
git commit -m "Add tested stats calculations"
```

### Task 2: Integrar os cálculos no histórico dos jogadores

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Preparar as atuações de cada equipa**

Adicionar uma função que transforma cada jogo finalizado em duas entradas:

```js
function getFinishedTeamPerformances() {
  return getFinishedGames().flatMap((game) => ["A", "B"].map((side) => ({
    playerIds: getGameSidePlayerIds(game, side).filter((id) => findPlayer(id)).sort(),
    outcome: getPlayerOutcome(game, side),
    winMargin: getPlayerOutcome(game, side) === "win"
      ? Math.max(0, getTeamGoalDiff(game, side))
      : 0,
  })));
}
```

- [ ] **Step 2: Manter as duplas e acrescentar as triplas**

Substituir o cálculo interno de `getBestPairStats()` pela função pura, mantendo mínimo 2. Criar:

```js
function getBestTrioStats(limit = 5) {
  return FooterStats.buildCombinationRanking(
    getFinishedTeamPerformances(),
    3,
    3,
    limit,
    (id) => findPlayer(id)?.name || ""
  ).map((stats) => ({
    ...stats,
    players: stats.playerIds.map(findPlayer).filter(Boolean),
  })).filter((stats) => stats.players.length === 3);
}
```

- [ ] **Step 3: Calcular golos marcados e sofridos por jogador**

Em `getPlayerHistoryStatsRows()`, para cada participação finalizada, usar:

```js
const goalsFor = participation.side === "A"
  ? Number(item.game.scoreA)
  : Number(item.game.scoreB);
const goalsAgainst = participation.side === "A"
  ? Number(item.game.scoreB)
  : Number(item.game.scoreA);
```

Passar as participações a `FooterStats.summarizePlayerGoals()` e guardar em cada linha:

```js
goalsFor,
goalsAgainst,
goalsForAverage,
goalsAgainstAverage
```

- [ ] **Step 4: Criar ordenadores determinísticos**

```js
function sortByGoalsForAverage(a, b) {
  return b.goalsForAverage - a.goalsForAverage
    || b.goalsFor - a.goalsFor
    || b.appearances - a.appearances
    || a.player.name.localeCompare(b.player.name);
}

function sortByGoalsAgainstAverage(a, b) {
  return a.goalsAgainstAverage - b.goalsAgainstAverage
    || a.goalsAgainst - b.goalsAgainst
    || b.appearances - a.appearances
    || a.player.name.localeCompare(b.player.name);
}
```

- [ ] **Step 5: Executar validações**

Run: `node --check app.js`

Expected: sem erros de sintaxe.

Run: `npm.cmd run test:stats`

Expected: todos os testes passam e o ranking de duplas mantém a regra anterior.

- [ ] **Step 6: Commit**

```bash
git add app.js
git commit -m "Calculate trio and goal rankings"
```

### Task 3: Renderizar os novos rankings

**Files:**
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `index.html`

- [ ] **Step 1: Preparar os rankings no painel**

Em `renderStatsPanel()`:

```js
const trioRows = getBestTrioStats(5);
const goalEligibleRows = activeRows.filter((row) => row.appearances >= 5);
const goalsForRows = goalEligibleRows.slice().sort(sortByGoalsForAverage).slice(0, 5);
const goalsAgainstRows = goalEligibleRows.slice().sort(sortByGoalsAgainstAverage).slice(0, 5);
```

- [ ] **Step 2: Permitir mensagem vazia específica**

Alterar a assinatura para:

```js
function renderStatsRanking(title, rows, valueRenderer, emptyMessage = "Sem dados.")
```

Usar `emptyMessage` no estado vazio.

- [ ] **Step 3: Renderizar as triplas**

Criar `renderTrioRanking(rows)` com a mesma estrutura acessível de `renderPairRanking()`, três botões de jogador e:

```html
<h3>🤝 Melhores triplas</h3>
```

O valor será:

```js
`${row.winRate}% (${row.wins}V/${row.gamesTogether}J)`
```

O estado vazio será: `Ainda nao ha triplas com 3 jogos.`

- [ ] **Step 4: Renderizar as médias**

Adicionar à grelha:

```js
renderStatsRanking(
  "⚽ Melhor media de golos marcados",
  goalsForRows,
  (row) => `${formatStatsAverage(row.goalsForAverage)} golos/jogo`,
  "Ainda nao ha jogadores com 5 jogos."
)

renderStatsRanking(
  "🛡️ Menos golos sofridos",
  goalsAgainstRows,
  (row) => `${formatStatsAverage(row.goalsAgainstAverage)} golos/jogo`,
  "Ainda nao ha jogadores com 5 jogos."
)
```

Formatar com:

```js
function formatStatsAverage(value) {
  return new Intl.NumberFormat("pt-PT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}
```

- [ ] **Step 5: Ajustar o layout responsivo**

Reutilizar a classe estrutural das duplas para as triplas e garantir que, no breakpoint móvel existente, posição, nomes e valor passam para linhas legíveis sem scroll horizontal.

- [ ] **Step 6: Atualizar cache-buster**

Em `index.html`, aplicar um novo identificador igual a `styles.css`, `app-config.js`, `stats-calculations.js` e `app.js`, carregando `stats-calculations.js` imediatamente antes de `app.js`.

- [ ] **Step 7: Validar**

Run: `node --check app.js`

Expected: sem erros.

Run: `git diff --check`

Expected: sem erros de whitespace.

- [ ] **Step 8: Commit**

```bash
git add app.js styles.css index.html
git commit -m "Show trio and goal stats rankings"
```

### Task 4: Sincronizar a web, documentar e verificar

**Files:**
- Modify: `scripts/build-web.mjs`
- Modify: `Footer_vault/03 - Decisoes e regras.md`
- Modify: `Footer_vault/04 - Estado tecnico.md`
- Generate: `www/stats-calculations.js`
- Generate: `www/app.js`
- Generate: `www/index.html`
- Generate: `www/styles.css`

- [ ] **Step 1: Incluir o módulo na build**

Adicionar `"stats-calculations.js"` ao array `files` de `scripts/build-web.mjs`.

- [ ] **Step 2: Atualizar o vault**

Registar:

- triplas: top 5, mínimo 3 jogos em conjunto e critérios iguais às duplas;
- médias: top 5, mínimo 5 presenças;
- golos marcados e sofridos são sempre vistos pela perspetiva da equipa do jogador;
- apresentação com duas casas decimais e ordenação com precisão total.

- [ ] **Step 3: Executar testes e build**

Run: `npm.cmd run test:stats`

Expected: todos os testes passam.

Run: `node --check app.js`

Expected: sem erros.

Run: `npm.cmd run build:web`

Expected: build concluída e `www/stats-calculations.js` criado.

Run: `node --check www/app.js`

Expected: sem erros.

- [ ] **Step 4: Smoke test local**

Iniciar o servidor local e confirmar:

- resposta HTTP 200;
- novo cache-buster presente;
- `stats-calculations.js` responde HTTP 200;
- títulos das três categorias presentes no HTML produzido pelo painel;
- ausência de erros no carregamento inicial.

- [ ] **Step 5: Revisão final**

Run: `git diff --check`

Expected: sem erros.

Run: `git status --short`

Expected: apenas os ficheiros desta alteração.

- [ ] **Step 6: Commit final**

```bash
git add scripts/build-web.mjs "Footer_vault/03 - Decisoes e regras.md" "Footer_vault/04 - Estado tecnico.md" www/app.js www/index.html www/styles.css www/stats-calculations.js
git commit -m "Sync new stats rankings"
git push
```
