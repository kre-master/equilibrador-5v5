# Estado tecnico

## Estrutura relevante

Raiz web/base:

- `app.js`
- `index.html`
- `styles.css`
- `app-config.js`
- `assets/`

Bundle/copia web para Capacitor:

- `www/app.js`
- `www/index.html`
- `www/styles.css`
- `www/app-config.js`
- `www/assets/`

Mobile:

- `android/`
- `ios/`
- `capacitor.config.json`

Docs/plans antigos:

- `docs/superpowers/specs/`
- `docs/superpowers/plans/`

Vault:

- `Footer_vault/`

## Commits recentes conhecidos

- `f048acf - Fix history render after radar odds`
- `e2bd3a4 - Revise team generation and radar odds`
- `6c5aefd - Tune photo fade for small cards`
- `37d5422 - Add award unlock progress and soften card photos`
- `bc72c99 - Polish history radar and cache bust cards`
- `167715f - Tighten player card photo layout`
- `ed14771 - Refine mobile player profile layout`
- `97d6027 - Refine awards field layout and payments`

## Assets relevantes nao rastreados

Ha varios assets relevantes ainda nao rastreados. Nao usar `git add .`.

Exemplos conhecidos:

- `Footer v1.png`
- `Footer.png`
- `assets/+1.png`
- `assets/+1X.png`
- `assets/-1.jpg`
- `assets/-1X.jpeg`
- `assets/0.jpg`
- `assets/1.png`
- `assets/MVP.png`
- `assets/exemplo.png`
- `assets/exemplo proporcoes.png`
- `assets/novo 1.png`
- `assets/novo alterado.png`
- `assets/new cards template/...`
- equivalentes em `www/assets/...`

## Bug recente corrigido

Sintoma:

- Historico ficou vazio depois de alteracoes no radar/odds.
- Clicar no historico do jogador abria o Gerar/today com erro amarelo.

Causa:

- Foram usadas chamadas a `clamp(...)`, mas a funcao existente no projecto e `clampNumber(...)`.

Correcao:

- Corrigido em `app.js` e `www/app.js`.
- Clicar num jogo finalizado dentro do perfil passou a abrir `history-game`.

Validacao:

- `node --check app.js` passou.
- `npm.cmd run build:web` passou.
- `node --check www\app.js` passou.
- Smoke test local devolveu HTTP 200 e cache-buster ok.

## Correcao sazonal de 2026-06-04

Sintoma:

- Cartas de campeao de verao apareciam antes do verao.
- Conquista de campeao de primavera aparecia antes de a primavera terminar.

Causa:

- `getSeasonInfo` usava meses inteiros.
- `isSeasonComplete` podia fechar a estacao cedo se todos os jogos registados ja estivessem no passado.
- `getSeasonChampionIds` podia devolver varios jogadores em empate.
- `getActivePlayerCardAward` deixava a carta sazonal ativa fora do jogo seguinte.

Correcao:

- Adicionado `SEASON_DEFINITIONS` com datas reais.
- `isSeasonComplete` passou a depender do fim real da estacao.
- `getSeasonChampionIds` passou a devolver so o melhor jogador.
- Adicionados `getSeasonChampionCardKeyForGame` e `isFirstPlayerGameAfterSeason`.
- Adicionado `FIELD_ONLY_CARD_KEYS` para retirar campeoes de estacao da montra permanente.
- Adicionados `getGameResultText` e `getPlayerResultText` para alinhar historico individual com a perspectiva do jogador.
- `renderPlayersTable` passou a usar `form.recentRecord` em vez de `getPlayerTeamRecentRecord`.
- `renderRecordDots` ganhou opcao cronologica para mostrar o jogo mais recente a direita.
- `renderGamesList` e `renderHistoryGameDetail` passaram a mostrar `getGameTitle(game)`.
- `findEventForGame` associa jogo e convocatoria por data e jogadores confirmados para obter o titulo.
- `renderTeamRadarChart` ganhou opcao `inlineOdds` para o historico.
- `mvp_month` nao fica em `FIELD_ONLY_CARD_KEYS`, para poder aparecer na montra permanente.
- `getMonthlyMvpRows` calcula desempates por MVPs oficiais, vitorias e win rate.
- `getMonthMvpCardKeyForGame` e `isFirstPlayerGameAfterMonth` limitam a carta ao primeiro jogo elegivel do mes seguinte.
- `isMonthComplete` passou a depender do fim real do mes, alem de jogos finalizados.
- Cache-buster actualizado para `20260604-mvpmonth2`.

Validacao:

- `node --check app.js` passou.
- `npm.cmd run build:web` passou.
- `node --check www\app.js` passou.
- Smoke test local em `http://127.0.0.1:5173/` devolveu `STATUS=200` e `CACHE_BUSTER=ok`.

Nota Git:

- `Footer_vault/` nao esta no `.gitignore`.
- Aparece como `?? Footer_vault/` porque ainda nao foi adicionado ao Git.
- Para versionar o vault, adicionar explicitamente so a pasta do vault, sem usar `git add .`.

## Alteracao de data/hora de jogos

Regra:

- A data/hora pode ser alterada por admin na convocatoria depois de lancada.
- A data/hora pode ser alterada por admin no jogo confirmado e no detalhe do historico.
- Quando uma convocatoria ja tem jogo associado, a alteracao sincroniza `event.startsAt` e `game.date`.
- Quando um jogo tem convocatoria associada, a alteracao sincroniza `game.date` e `event.startsAt`.
- Pagamentos seguem automaticamente o mes de `game.date`; overrides de presenca e ajustes financeiros continuam ligados ao `game.id`.

Implementacao:

- `saveEventDateFromList` le o input da convocatoria.
- `updateEventDate` actualiza a convocatoria e, se existir, o jogo associado.
- `updateGameDate` actualiza o jogo e, se existir, a convocatoria associada.
- `findGameForEventData` associa convocatoria e jogo pela data antiga e jogadores confirmados.
- `updatePreviewGameDate` continua a actualizar previews, mas tambem grava a data de jogos ja confirmados quando o input dispara `change`.
- Cache-buster actualizado para `20260615-game-date1`.

Validacao:

- `node --check app.js` passou.
- `npm.cmd run build:web` passou.
- `node --check www\app.js` passou.
- Smoke test local devolveu `STATUS=200` e `CACHE_BUSTER=ok`.

## Dividas de ajuste em pagamentos

Regra:

- Admin pode registar pagamentos e tambem adicionar dividas manuais a jogadores.
- A divida aumenta o saldo actual do jogador, sem alterar presencas nem jogos.
- A divida nao deve contar como caixa recebida nem reduzir a diferenca de caixa do mes.

Implementacao:

- `DEBT_NOTE_PREFIX` marca movimentos de divida com `[DIVIDA]` na nota.
- `isDebtAdjustment` identifica esses movimentos.
- `getPaymentSignedAmount` faz pagamentos contarem positivo e dividas contarem negativo no saldo do jogador.
- `renderPaymentsPanel` tem botoes separados para `Registar pagamento` e `Adicionar divida`.
- `renderPaymentsHistory` mostra cada movimento como `Pagamento` ou `Divida`.
- `buildMonthlyPaymentReport` usa o valor assinado para saldos, mas `totalPaidMonth` conta apenas pagamentos reais para a caixa.
- Cache-buster actualizado para `20260615-payment-debt1`.

Validacao:

- `node --check app.js` passou.
- `npm.cmd run build:web` passou.
- `node --check www\app.js` passou.
- Smoke test local devolveu `STATUS=200` e `CACHE_BUSTER=ok`.

## Comandos uteis

Ver estado:

```powershell
git status --short
```

Validar JS base:

```powershell
node --check app.js
```

Build web:

```powershell
npm.cmd run build:web
```

Validar bundle:

```powershell
node --check www\app.js
```

Smoke local, com servidor ja activo:

```powershell
Invoke-WebRequest http://127.0.0.1:5173/
```

## Nota sobre Supabase

Quando forem adicionadas novas tabelas ou politicas, rever `supabase/schema.sql` e aplicar o schema no SQL Editor do Supabase. O README indica que pagamentos precisam de `payments`, `attendance_overrides` e `finance_settings`.
