# Spec - Historico alargado e revelacao de cartas

Data: 2026-07-06

## Objetivo

Corrigir e tornar auditavel a atribuicao de cartas de vitorias seguidas, especialmente em casos como o Cunha, e melhorar a pagina do jogador para mostrar um historico mais alargado. Depois de cada jogo, quando um jogador entra, a app deve pedir voto MVP se aplicavel e revelar de forma simples as cartas novas desbloqueadas por esse jogo.

## Problema a resolver

O jogador pode ver cartas como `4 vitorias seguidas` ou `5+ vitorias seguidas` na montra, mas a pagina so mostra os ultimos 5 jogos. Isto dificulta perceber se a carta foi mesmo merecida historicamente.

A regra atual e:

- `4 em 5` e `5 em 5` contam os ultimos jogos em que o jogador participou; ausencias pelo meio nao invalidam.
- `vitorias seguidas` exige jogos consecutivos da equipa, sem ausencia do jogador pelo meio.

## Regras de produto

- A pagina do jogador passa a mostrar `Ult. 20 equipa` e `Ult. 20 jogador`.
- `Ult. 20 equipa` inclui jogos finalizados da equipa/grupo, marcando ausencia com `-`.
- `Ult. 20 jogador` inclui apenas jogos finalizados em que o jogador participou.
- As cartas `4 em 5` e `5 em 5` continuam a ser calculadas sobre participacoes do jogador.
- As cartas `4 vitorias seguidas` e `5+ vitorias seguidas` so podem existir na montra se houver uma sequencia historica valida sem ausencias.
- A app deve calcular explicitamente:
  - sequencia atual de vitorias sem faltas;
  - melhor sequencia historica valida sem faltas;
  - melhor janela historica de `4 em 5` / `5 em 5`.
- A montra deve refletir o recalculo com estas regras. Se uma carta antiga nao for justificavel pelos jogos atuais, deixa de aparecer.

## Perfil do jogador

Adicionar uma zona simples de auditoria junto da montra ou imediatamente antes dela:

- `Sequencia atual`: numero de vitorias consecutivas da equipa com presenca do jogador.
- `Melhor sequencia valida`: melhor serie historica sem faltas.
- `Forma por participacoes`: melhor resultado em janelas de 5 jogos jogados.
- Opcionalmente mostrar uma linha compacta por jogo com data, resultado, presenca/ausencia e equipa.

O objetivo nao e transformar a pagina num relatorio complexo, mas dar provas suficientes para perceber por que uma carta aparece.

## Fluxo apos jogo

Quando um jogador entra depois de um jogo finalizado em que participou:

1. Se ainda nao votou MVP nesse jogo, aparece primeiro o pedido de voto MVP.
2. Depois de votar, ou se ja tiver votado, a app verifica se esse jogo desbloqueou cartas novas para esse jogador.
3. Se houver cartas novas, aparece uma revelacao simples:
   - fundo/modal curto;
   - titulo `Carta desbloqueada`;
   - uma ou mais cartas em sequencia;
   - botao `Continuar`.
4. A revelacao aparece apenas uma vez por jogador/jogo no mesmo dispositivo.
5. Se nao houver cartas novas, nao aparece nada.

## Dados e persistencia

Primeira versao:

- Guardar no `localStorage` quais revelacoes ja foram vistas por `playerId`, `gameId` e `awardKey`.
- Nao criar ainda tabela Supabase.
- Isto e suficiente para evitar repetir a animacao no mesmo telemovel.

Melhoria futura:

- Criar uma tabela Supabase para sincronizar revelacoes entre dispositivos.

## Implementacao prevista

- Criar helpers para calcular auditoria de premios do jogador:
  - historico dos ultimos 20 jogos da equipa;
  - historico dos ultimos 20 jogos do jogador;
  - melhor sequencia valida de vitorias seguidas;
  - premios desbloqueados por jogo.
- Atualizar `renderPlayerProfile` para usar 20 resultados e mostrar auditoria.
- Ajustar `getPlayerAwardShowcase` para depender dos novos helpers auditaveis.
- Integrar revelacao de cartas depois do gate de MVP existente.
- Atualizar `index.html` com novo cache-buster.
- Correr `node --check app.js`, `npm.cmd run build:web` e `node --check www\app.js`.

## Fora de ambito nesta fase

- Alterar Android/iOS nativo.
- Criar tabelas Supabase para revelacoes.
- Redesenhar visualmente toda a pagina de jogador.
- Mudar a regra permanente da montra para outros tipos de cartas.
