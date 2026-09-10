# Elegibilidade da media de golos por jogo

## Objetivo

Impedir que os rankings de media de golos sejam liderados por jogadores com uma amostra pequena ou que estejam ausentes ha demasiado tempo.

## Regra

Um jogador entra nos rankings de media de golos marcados e de golos sofridos apenas quando cumpre simultaneamente:

1. participou em pelo menos 5 jogos finalizados no historico;
2. nao faltou aos 6 jogos finalizados mais recentes do grupo de forma consecutiva.

Em termos equivalentes, o jogador e excluido quando `ausencias_consecutivas_recentes > 5`.

Assim que voltar a participar num jogo finalizado, a contagem regressa a zero e o jogador volta a ser elegivel, desde que mantenha as 5 participacoes historicas.

## Calculo e apresentacao

As medias continuam a usar todos os jogos finalizados em que o jogador participou. A ausencia recente afeta apenas a elegibilidade, nao apaga jogos nem altera a media.

O estado vazio do ranking explica as duas condicoes: `E preciso ter 5 jogos e nao estar ausente ha mais de 5 jogos.`

A interface nao identifica publicamente qual condicao excluiu cada jogador.

## Verificacao

Os testes cobrem:

- 4 e 5 participacoes historicas;
- 5 ausencias recentes, ainda elegivel;
- 6 ausencias recentes, excluido;
- regresso no jogo mais recente;
- jogos abertos ignorados;
- medias historicas inalteradas pela regra;
- jogadores removidos tratados sem quebrar o calculo;
- estado vazio e ordenacao existente.
