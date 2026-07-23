# Melhores triplas nos Stats

## Objetivo

Acrescentar ao Quadro de Honra uma categoria "Melhores triplas" que identifique as combinações de três jogadores com melhor desempenho histórico quando jogam na mesma equipa.

## Regras

- Considerar apenas jogos finalizados.
- Em cada equipa, gerar todas as combinações possíveis de três jogadores.
- Uma tripla só entra no ranking quando tiver pelo menos 3 jogos realizados em conjunto.
- Mostrar as 5 melhores triplas.
- Apresentar a percentagem de vitórias, o número de vitórias e o número de jogos em conjunto.
- Permitir abrir o perfil de cada jogador através do respetivo nome.

## Ordenação

Usar a mesma lógica competitiva aplicada ao ranking de duplas:

1. Pontuação composta por vitórias, diferença de golos nas vitórias, jogos em conjunto e percentagem de vitórias.
2. Em caso de igualdade, mais vitórias.
3. Depois, maior diferença de golos acumulada nas vitórias.
4. Depois, mais jogos realizados em conjunto.
5. Por fim, ordem alfabética dos nomes.

## Interface

- Adicionar um cartão "🤝 Melhores triplas" à grelha atual de rankings.
- Manter a linguagem visual, hierarquia e comportamento responsivo dos restantes cartões.
- Cada linha mostra posição, os três nomes e o resumo no formato `75% (3V/4J)`.
- Quando não existirem dados suficientes, mostrar: "Ainda nao ha triplas com 3 jogos."

## Implementação

- Generalizar ou complementar o cálculo atual de duplas sem alterar os resultados existentes desse ranking.
- Reutilizar a estrutura de apresentação das duplas, adaptando-a para três nomes.
- Atualizar primeiro a versão base/web.
- Executar a build web para sincronizar `www/`.
- Atualizar o cache-buster e a memória do projeto no `Footer_vault`.

## Verificação

- Confirmar que uma combinação com 2 jogos não aparece.
- Confirmar que uma combinação passa a aparecer ao atingir 3 jogos.
- Confirmar vitórias, jogos e percentagem.
- Confirmar ordenação e desempates.
- Confirmar que os três nomes abrem os perfis corretos.
- Confirmar o layout em ecrã pequeno sem scroll horizontal.
