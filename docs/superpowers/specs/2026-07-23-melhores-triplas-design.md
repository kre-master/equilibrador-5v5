# Novos rankings nos Stats

## Objetivo

Acrescentar ao Quadro de Honra:

- "Melhores triplas", para identificar as combinações de três jogadores com melhor desempenho histórico quando jogam na mesma equipa.
- "Melhor média de golos marcados", para destacar os jogadores cujas equipas marcam mais quando participam.
- "Menos golos sofridos", para destacar os jogadores cujas equipas sofrem menos quando participam.

## Melhores triplas

### Regras

- Considerar apenas jogos finalizados.
- Em cada equipa, gerar todas as combinações possíveis de três jogadores.
- Uma tripla só entra no ranking quando tiver pelo menos 3 jogos realizados em conjunto.
- Mostrar as 5 melhores triplas.
- Apresentar a percentagem de vitórias, o número de vitórias e o número de jogos em conjunto.
- Permitir abrir o perfil de cada jogador através do respetivo nome.

### Ordenação

Usar a mesma lógica competitiva aplicada ao ranking de duplas:

1. Pontuação composta por vitórias, diferença de golos nas vitórias, jogos em conjunto e percentagem de vitórias.
2. Em caso de igualdade, mais vitórias.
3. Depois, maior diferença de golos acumulada nas vitórias.
4. Depois, mais jogos realizados em conjunto.
5. Por fim, ordem alfabética dos nomes.

### Interface

- Adicionar um cartão "🤝 Melhores triplas" à grelha atual de rankings.
- Manter a linguagem visual, hierarquia e comportamento responsivo dos restantes cartões.
- Cada linha mostra posição, os três nomes e o resumo no formato `75% (3V/4J)`.
- Quando não existirem dados suficientes, mostrar: "Ainda nao ha triplas com 3 jogos."

## Médias de golos

### Regras

- Calcular as médias individualmente para cada jogador.
- Considerar apenas jogos finalizados em que o jogador participou.
- Exigir pelo menos 5 jogos realizados para entrar nestes rankings.
- Mostrar os 5 melhores jogadores em cada ranking.
- Na média de golos marcados, somar os golos da equipa do jogador e dividir pelo número de jogos em que participou.
- Na média de golos sofridos, somar os golos da equipa adversária e dividir pelo número de jogos em que participou.
- Arredondar a apresentação a duas casas decimais sem alterar a precisão usada na ordenação.

### Ordenação

- "Melhor média de golos marcados": maior média, depois maior total de golos marcados, mais jogos e ordem alfabética.
- "Menos golos sofridos": menor média, depois menor total de golos sofridos, mais jogos e ordem alfabética.

### Interface

- Adicionar os cartões "⚽ Melhor média de golos marcados" e "🛡️ Menos golos sofridos".
- Cada linha mostra a posição, o nome do jogador e a média no formato `8,25 golos/jogo`.
- O nome do jogador abre o respetivo perfil.
- Quando não existirem jogadores com 5 jogos, mostrar: "Ainda nao ha jogadores com 5 jogos."

## Implementação

- Generalizar ou complementar o cálculo atual de duplas sem alterar os resultados existentes desse ranking.
- Reutilizar a estrutura de apresentação das duplas, adaptando-a para três nomes.
- Alargar as estatísticas históricas de cada jogador com golos marcados e sofridos pela sua equipa.
- Reutilizar o componente visual dos restantes rankings individuais para as médias de golos.
- Atualizar primeiro a versão base/web.
- Executar a build web para sincronizar `www/`.
- Atualizar o cache-buster e a memória do projeto no `Footer_vault`.

## Verificação

- Confirmar que uma combinação com 2 jogos não aparece.
- Confirmar que uma combinação passa a aparecer ao atingir 3 jogos.
- Confirmar vitórias, jogos e percentagem.
- Confirmar ordenação e desempates.
- Confirmar que os três nomes abrem os perfis corretos.
- Confirmar que jogadores com menos de 5 jogos não entram nos rankings de médias.
- Confirmar o cálculo de golos marcados e sofridos para jogadores das equipas A e B.
- Confirmar que a apresentação usa duas casas decimais e a ordenação usa o valor exato.
- Confirmar os desempates dos dois rankings de médias.
- Confirmar que os nomes nos rankings de médias abrem os perfis corretos.
- Confirmar o layout em ecrã pequeno sem scroll horizontal.
