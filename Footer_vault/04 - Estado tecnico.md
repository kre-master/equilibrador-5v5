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

## Auditoria de seguranca 2026-06-15

Pontos revistos:

- Chave exposta no frontend e `sb_publishable`, esperada para Supabase frontend.
- Nao foi encontrada `service_role` nem chave secreta de API no frontend.
- `npm audit --audit-level=moderate` passou com `0 vulnerabilities`.

Alteracoes decididas:

- Votos MVP devem deixar de ser lidos crus por todos os utilizadores autenticados.
- `game_mvp_votes` passa a permitir select apenas do voto do proprio jogador.
- `mvp_vote_counts()` devolve apenas contagens agregadas por jogo/candidato.
- Voto MVP passa a usar `insert`, nao `upsert`, para nao permitir alteracao posterior.
- Login/recuperacao passam a usar email; username deixa de servir para lookup de email.
- `email_for_login` voltou a ter grant para `anon`/`authenticated` por decisao posterior de aceitar login por username no grupo fechado.

Acao manual necessaria:

- Reexecutar `supabase/schema.sql` no SQL Editor do Supabase para aplicar policies/funcoes.
- Confirmar no dashboard: `Authentication > Providers > Email > Confirm email` ligado.
- Mais tarde, rever `Authentication > Rate Limits`/captcha se a app sair do uso local entre amigos.

## Conta criada sem aparecer em Pedidos/Contas

Sintoma:

- Utilizador consegue criar conta no Supabase Auth, mas o admin nao a ve em `Pedidos`/lista de contas.

Causa provavel:

- `loadAccountState` usava o numero de profiles visiveis para decidir se a conta era o primeiro admin.
- Como um jogador normal so ve o proprio profile por RLS, uma conta nova sem profile via `profiles.length === 0` e tentava criar role `admin`.
- A policy `profiles insert self` bloqueia esse segundo admin, logo a conta ficava no Auth sem linha em `profiles`.

Correcao:

- A app passa a chamar `has_any_profile()` para saber se ja existe algum profile real.
- Se ja existir algum profile, a nova conta cria role `player`.
- `has_any_profile()` precisa de `grant execute ... to authenticated`.
- Depois de aplicar o schema mais recente, pedir ao utilizador afetado para entrar novamente para a app criar/reparar o profile.

Nota de login:

- Por decisao de produto para o grupo fechado, login e recuperacao voltam a aceitar email ou username.
- Username login chama `email_for_login(username)` para resolver o email antes de usar Supabase Auth.
- `email_for_login` tem `grant execute` para `anon` e `authenticated`; rever rate limit/captcha se a app sair do uso local.

## Edicao de equipas em jogo historico

Regra:

- Admin pode corrigir equipas de um jogo finalizado no detalhe do historico.
- Mover jogador entre Equipa A/B altera automaticamente historico individual, forma e cartas, porque esses dados sao derivados de `game.teamA/teamB`.
- Pagamentos continuam a usar participantes de `getGamePlayerIds(game)`.
- Se houver overrides manuais de presenca, existe botao para limpar overrides desse jogo e recalcular pagamentos a partir das equipas atuais.

Implementacao:

- `renderHistoryRosterEditor(game)` desenha o editor admin no detalhe historico.
- `movePlayerInHistoryGame`, `addPlayerToHistoryGame` e `removePlayerFromHistoryGame` alteram `teamA/teamB/benchA/benchB`.
- `resetAttendanceOverridesForGame(gameId)` remove overrides de presenca apenas desse jogo.
- `mutateHistoryGame` aplica rollback se `persistState()` falhar.
- Cache-buster actualizado para `20260706-history-edit1`.

## Regras de cartas de forma/vitorias

Regra:

- `4 em 5` e `5 em 5` usam apenas os ultimos jogos em que o jogador participou.
- Uma ausencia entre jogos da equipa nao invalida `4 em 5`/`5 em 5`, desde que o jogador tenha vencido 4 ou 5 das ultimas 5 participacoes.
- `vitorias seguidas` exige jogos consecutivos da equipa sem ausencia pelo meio.
- Se o jogador falhar um jogo da equipa, a sequencia de `vitorias seguidas` fica quebrada.

Implementacao:

- `getPlayerForm` calcula `winStreak` com `countConsecutiveTeamOutcomeStreak`.
- `getPlayerAwardShowcase` conta `win_*x` percorrendo todos os jogos finalizados da equipa, resetando em ausencia ou nao-vitoria.
- As cartas `form_4w_5` e `form_5w_5` continuam baseadas em janelas das participacoes do jogador.

## 2026-07-06 - Historico alargado e revelacao de cartas

- Perfil do jogador passa a mostrar `Ult. 20 equipa` e `Ult. 20 jogador`.
- Adicionada auditoria de cartas com sequencia atual, melhor sequencia valida sem faltas e melhor janela de 5 participacoes.
- Montra de premios para `vitorias seguidas` passa a depender da melhor sequencia historica valida, sem ausencia entre jogos da equipa.
- `4 em 5` e `5 em 5` continuam a contar apenas jogos em que o jogador participou.
- Adicionada revelacao local de cartas desbloqueadas apos o voto MVP do ultimo jogo finalizado em que o jogador participou.
- Revelacoes ficam marcadas por `playerId:gameId:awardKey` no dispositivo; ha fallback em memoria se `localStorage` falhar.
- Cache-buster actualizado para `20260706-awardreveal1`.

## 2026-07-07 - Melhorias na revelacao de cartas

- Modal de carta desbloqueada passa a mostrar o nome e a descricao da carta abaixo da carta visual.
- Quando ha varias cartas desbloqueadas, mostra o total de cartas e usa uma faixa horizontal arrastavel com `scroll-snap`.
- Adicionada verificacao local `scripts/check-award-reveal-ui.mjs` para garantir contador, nome/descricao e carrossel.
- Validacoes: `node scripts/check-award-reveal-ui.mjs`, `node --check app.js`, `npm.cmd run build:web`, `node --check www\app.js`.

## 2026-07-09 - MVP historico e popup de eleito MVP

- Corrigida a base real Supabase: a funcao `public.mvp_vote_counts()` estava em falta apesar de existirem votos em `game_mvp_votes`.
- Confirmacao na base: 57 votos MVP em 7 jogos; 6 jogos ja tinham minimo de 5 votos.
- O painel MVP volta a usar contagens agregadas sem expor quem votou em quem.
- Adicionado popup `Foste eleito MVP` quando os votos do ultimo jogo finalizado do jogador estao fechados e o jogador e MVP oficial.
- O popup de MVP oficial aparece antes das cartas desbloqueadas e fica marcado localmente por `playerId:gameId:official_mvp`.
- Cache-buster actualizado para `20260709-mvpreveal1`.

## 2026-07-09 - Stats e Primeira vitoria

- Adicionado separador `Stats` com Hall of Fame agregado.
- Rankings incluidos: mais vitorias, melhor win rate, mais presencas, mais MVPs, maior sequencia de vitorias, maior caloteiro atual, melhor dupla e historico de MVPs.
- Ranking `anti-amuleto` ficou de fora por decisao do utilizador.
- Melhor dupla exige pelo menos 2 jogos juntos.
- Melhor win rate usa minimo de 5 presencas quando existir historico suficiente.
- Carta `1 vitoria seguida` passa a chamar-se `Primeira vitoria`.
- `Primeira vitoria` e premio unico de montra, desbloqueado apenas na primeira vitoria historica do jogador.
- `Primeira vitoria` deixou de ser carta ativa por sequencia atual de 1 vitoria.
- Cache-buster actualizado para `20260709-stats1`.

## 2026-07-09 - UI Stats

- UI do separador `Stats` ficou mais vibrante: cabecalho `Quadro de honra`, cartoes de destaque com acentos visuais e rankings com efeito de podium.
- Cada titulo principal/ranking de Stats passa a ter emoji decorativo.
- Mantida a mesma logica de calculo; alteracao e apenas visual.
- Cache-buster actualizado para `20260709-statsui1`.

## 2026-07-09 - Consistencia do maior caloteiro

- Corrigida inconsistencia em que admin e conta pessoal podiam ver jogadores diferentes no ranking `Maior caloteiro atual`.
- Causa: contas nao-admin nao carregam dados financeiros completos do Supabase (`payments`, overrides e settings), mas o painel Stats calculava o ranking mesmo assim com dados vazios/cache local.
- Decisao: o ranking financeiro continua visivel para admins; contas nao-admin veem cartao explicativo em vez de ranking possivelmente errado.
- Adicionada verificacao local `scripts/check-stats-finance-visibility.mjs`.
- Cache-buster actualizado para `20260709-statsfinance1`.
- Validacoes: `node scripts/check-stats-finance-visibility.mjs`, `node --check app.js`, `npm.cmd run build:web`, `node --check www\app.js`.

## 2026-07-23 - Rankings de Stats

Implementacao:

- Adicionado o modulo puro `stats-calculations.js`, compativel com global de browser e CommonJS, com testes automatizados.
- `app.js` integra os resumos de duplas, triplas e medias de golos por jogador.
- A sequencia de vitorias em Stats ignora jogos com placar invalido; ausencias, empates e derrotas validos continuam a interrompe-la.
- `scripts/build-web.mjs` copia `stats-calculations.js` e valida todos os scripts locais referenciados pelo `index.html` gerado.
- `www/` esta sincronizado com a origem e usa o cache-buster `20260723-statsrankings1`.
- As linhas de combinacoes sao responsivas, os links dos jogadores nas combinacoes tem altura minima de 44 px e os separadores nao ficam orfaos no fim da linha.

Validacao completa:

- `npm.cmd run test:stats`: passou, 14 testes, 14 aprovados, 0 falhas.
- `node --check app.js`: passou.
- `node --check stats-calculations.js`: passou.
- `npm.cmd run build:web`: passou sem alterar `www/app-config.js`.
- `node --check www/app.js`: passou.
- `www/stats-calculations.js`: existe.
- Hashes SHA-256 de `app.js`, `styles.css`, `index.html` e `stats-calculations.js`: cada ficheiro de origem corresponde exactamente ao equivalente em `www/`.
- Smoke test local: `index.html` devolveu HTTP 200, o cache-buster `20260723-statsrankings1` estava presente e `stats-calculations.js` devolveu HTTP 200.
- `git diff --check`: passou.

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
