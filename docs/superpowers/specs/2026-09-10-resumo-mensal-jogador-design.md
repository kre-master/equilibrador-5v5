# Resumo mensal pessoal do jogador

## Objetivo

Criar uma nova aba pessoal, `O teu mes`, que transforma os jogos do jogador numa retrospectiva mensal com humor, desempenho, esforco estimado, cartas recebidas e evolucao anual.

O resumo do mes anterior abre automaticamente uma vez quando o jogador entra na aplicacao. Depois permanece consultavel na nova aba, juntamente com os meses anteriores.

## Ambito

O primeiro lancamento inclui:

- abertura automatica do ultimo resumo elegivel;
- historico mensal dentro do ano civil;
- mensagens pessoais com humor;
- jogos, resultados, golos, MVPs e presencas;
- minutos ativos e calorias estimadas;
- intensidade media dos jogos e forma fisica percebida;
- cartas recebidas no mes, incluindo repeticoes;
- grafico anual com uma metrica de cada vez;
- peso opcional e privado no perfil do proprio jogador;
- consulta administrativa das respostas pos-jogo, sem acesso ao peso.

Nao inclui partilha de resumos, comparacoes publicas entre jogadores, diagnosticos de saude ou notificacoes push.

## Elegibilidade e abertura automatica

O resumo automatico refere-se ao mes civil anterior. Abre quando todas estas condicoes se verificam:

1. existe uma conta autenticada com perfil de jogador associado;
2. o jogador participou em pelo menos um jogo finalizado no mes anterior;
3. todos os processos de MVP relativos a essas participacoes estao fechados;
4. o jogador concluiu os check-ins pos-jogo obrigatorios desse mes;
5. ainda nao existe um registo de abertura automatica desse jogador e mes.

Se o jogador nao participou em nenhum jogo do mes anterior, nada abre. Se regressar depois de varios meses, abre apenas o resumo elegivel mais recente; os restantes ficam disponiveis no historico.

O registo de abertura impede apenas a repeticao automatica. O conteudo da aba e recalculado quando um administrador corrige legitimamente um jogo.

## Ano e navegacao temporal

O ano apresentado e o ano civil do mes selecionado. A linha temporal comeca no mes do primeiro jogo finalizado do grupo nesse ano, e nao mostra meses vazios anteriores.

No grafico pessoal:

- um mes em que houve jogos do grupo mas o jogador nao participou aparece como ausencia;
- ausencia nao e desenhada como zero nas metricas de desempenho;
- presencas podem mostrar zero, porque zero e um valor real nessa metrica;
- meses futuros nao aparecem;
- o seletor do mes permite abrir qualquer resumo historico disponivel.

## Estrutura da pagina

### Mensagem de abertura

O topo mostra `Olha como foi o teu ultimo mes` e uma mensagem curta escolhida por regras deterministicas. As frases variam para evitar repeticao, mas nunca insultam o jogador nem fazem afirmacoes medicas.

Prioridade dos cenarios, do mais especifico para o mais geral:

1. participou em todos os jogos e venceu todos;
2. venceu todos os jogos em que participou;
3. perdeu todos os jogos em que participou;
4. participou em apenas um jogo;
5. participou em todos os jogos do grupo;
6. regressou depois de seis ou mais ausencias consecutivas;
7. recebeu um ou mais MVPs;
8. teve melhoria ou quebra mensal relevante;
9. mensagem neutra de balanco.

Cada cenario tem varias frases. A escolha usa jogador, mes e cenario como semente para permanecer estavel entre aberturas e mudar entre meses.

### Numeros do mes

Mostrar jogos, vitorias, empates, derrotas, percentagem de vitorias, golos marcados e sofridos pela equipa do jogador, MVPs oficiais, minutos ativos e calorias estimadas.

### Esforco percebido

Para jogos com check-in, mostrar:

- media de `Intensidade do jogo: Velhinhos ou Champions?`;
- media de `Morreste ou jogavas mais meia hora?`, apresentada como `Forma fisica percebida`;
- melhor e pior resposta fisica do mes;
- comparacao com o mes anterior quando ambos tiverem dados.

A forma fisica percebida e uma autoavaliacao, nao uma medicao clinica. A interface deve dizer isso de forma discreta e clara.

### Cartas recebidas

Mostrar todas as ocorrencias de cartas especiais recebidas durante o mes.

- `NOVA` significa que foi a primeira ocorrencia historica daquele tipo para o jogador;
- repeticoes sao agrupadas por tipo e mostram `x2`, `x3`, etc. para o total recebido nesse mes;
- tocar numa carta abre o detalhe e a descricao ja usados na montra do perfil;
- cada fonte pode criar no maximo uma ocorrencia do mesmo tipo por jogador;
- cartas base e variantes apenas visuais de campo nao contam como premio mensal.

As fontes podem ser um jogo, o fecho de um MVP, o fecho do mes ou o fecho de uma epoca. Cada ocorrencia tem uma chave idempotente para impedir duplicados.

### Grafico anual

Usar um grafico de linha com seletor de metrica. Mostrar uma metrica de cada vez para nao misturar escalas:

- win rate;
- golos marcados pela equipa por jogo;
- presencas;
- MVPs;
- forma fisica percebida;
- intensidade percebida.

Ao selecionar `Forma percebida`, permitir sobrepor a intensidade media dos jogos. As duas series usam a mesma escala de 1 a 10 e rotulos diretos. A diferenca entre as linhas fornece contexto sem criar um indice opaco.

Cada ponto e acessivel por toque, teclado e leitor de ecra. Abaixo do grafico existe um resumo textual da tendencia e uma tabela compacta como alternativa acessivel.

## Calorias e minutos ativos

Assumir 50 minutos de jogo e cinco lugares ativos por equipa:

```text
minutos_ativos = 50 * min(1, 5 / numero_de_jogadores_da_equipa)
```

Consequencias:

- 5 jogadores: 50 minutos por jogador;
- 6 jogadores: 41 minutos e 40 segundos por jogador;
- mais de 6 jogadores: a mesma distribuicao proporcional;
- menos de 5 jogadores: nunca ultrapassa 50 minutos.

O numero da equipa inclui titulares e suplentes associados ao mesmo lado no registo final do jogo.

Para jogos com resposta, converter a escala de intensidade linearmente entre 5 e 10 MET:

```text
MET = 5 + ((intensidade - 1) * 5 / 9)
kcal_estimadas = MET * peso_kg * minutos_ativos / 60
```

Isto ancora `Velhinhos` em 5 MET e `Champions` em 10 MET. O intervalo e coerente com as referencias do Compendium para futebol recreativo, cerca de 7 MET, e competitivo, cerca de 10 MET:

- https://pmc.ncbi.nlm.nih.gov/articles/PMC10818145/
- https://www.frontiersin.org/journals/public-health/articles/10.3389/fpubh.2024.1406878/full

Para jogos historicos sem resposta, usar 7 MET e marcar o resultado como `estimativa-base`.

Usar o peso privado registado no momento do calculo. Sem peso, usar 75 kg e mostrar `estimativa com peso de referencia`. A interface usa sempre o simbolo `~` ou a palavra `estimadas` e arredonda ao inteiro mais proximo.

A segunda resposta nao altera calorias. Ela mede a energia restante e serve para contextualizar a resposta fisica perante a intensidade percebida.

## Dados e arquitetura

O resumo e calculado a partir dos dados fonte, sem guardar uma copia mensal congelada.

### `player_private_metrics`

- `id`;
- `player_id`;
- `user_id`;
- `weight_kg`;
- `effective_from`;
- `created_at`.

Politicas RLS permitem `select`, `insert` e `update` apenas quando `user_id = auth.uid()` e o utilizador esta associado ao `player_id`. Nao existe excecao para administradores.

Cada alteracao de peso cria uma nova medicao em vez de substituir a anterior. Para um jogo, usar a medicao mais recente cuja `effective_from` nao seja posterior a data do jogo. Sem uma medicao aplicavel, usar 75 kg. Assim, recalcular um mes antigo nao aplica acidentalmente o peso atual a todo o historico.

### `player_card_awards`

- `id`;
- `player_id`;
- `award_key`;
- `source_type` (`game`, `mvp`, `month`, `season`);
- `source_id`;
- `awarded_at`;
- `metadata`.

Uma restricao unica em `(player_id, award_key, source_type, source_id)` garante idempotencia. O historico existente e reconstruido deterministicamente numa migracao ou sincronizacao administrativa.

### `monthly_recap_views`

- `player_id`;
- `month_id`, no formato `YYYY-MM`;
- `first_opened_at`.

Uma restricao unica em `(player_id, month_id)` impede varias aberturas automaticas. O jogador pode ler apenas os seus registos; o administrador nao precisa de os consultar.

As respostas pos-jogo sao definidas na especificacao propria e entram no agregador mensal por `player_id`, `game_id` e data do jogo.

## Modo local e indisponibilidade

- Em modo local nao e guardado peso pessoal; os calculos usam 75 kg.
- Sem respostas pos-jogo, mostrar calorias com 7 MET e esconder tendencias de forma percebida.
- Se o carregamento remoto falhar, a aba mostra uma mensagem de erro com acao para tentar novamente.
- Se a marcacao de abertura falhar, o resumo continua acessivel, mas nao se assume que ficou visto.
- Dados insuficientes nunca produzem zero artificial; mostram `Sem dados neste mes`.

## Acessibilidade

- controlos de mes e metricas com alvo minimo de 44 por 44 px;
- grafico sem dependencia exclusiva da cor;
- valores formatados em `pt-PT`;
- suporte para texto ampliado e ecras de 375 px sem scroll horizontal;
- animacoes breves e desativadas com `prefers-reduced-motion`;
- foco no titulo quando o resumo abre automaticamente;
- botao claro para fechar e regressar a aba anterior.

## Verificacao

Os testes cobrem elegibilidade e abertura unica, ausencia no mes, regresso tardio, mensagens, limites do ano, equipas A/B, MVPs fechados, minutos para equipas de 5/6/7, MET, calorias, privacidade do peso, historico das respostas, cartas novas e repetidas, idempotencia, acessibilidade, falhas remotas e modo local.
