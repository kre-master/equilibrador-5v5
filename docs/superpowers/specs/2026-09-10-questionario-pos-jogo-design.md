# Questionario pos-jogo integrado com MVP

## Objetivo

Alargar o ecra obrigatorio de voto MVP com duas perguntas rapidas de 1 a 10. As respostas permitem acompanhar a intensidade percebida dos jogos e a forma fisica percebida do jogador ao longo do mes e do ano.

## Perguntas

### Intensidade do jogo: Velhinhos ou Champions?

Escala numerada de 1 a 10:

- 1: `Velhinhos`;
- 5: `Bom ritmo`;
- 10: `Champions`.

Mede o ritmo e a exigencia geral percebidos. A explicacao afasta qualquer interpretacao de agressividade ou contacto fisico.

### Morreste ou jogavas mais meia hora?

Escala numerada de 1 a 10:

- 1: `Morri`;
- 5: `Ainda dava uns minutos`;
- 10: `Mais meia hora facil`.

Mede a energia que o jogador sentiu ter no final. Na analise mensal e anual aparece como `Forma fisica percebida`.

Usar circulos ou botoes numerados, nao estrelas, porque estrelas sugerem uma avaliacao de qualidade.

## Fluxo

O gate pos-jogo e mostrado apenas a uma conta autenticada cujo jogador associado participou num jogo finalizado sem resposta obrigatoria.

Cada passo contem:

1. data e resultado do jogo;
2. escolha confidencial do MVP, sem permitir voto no proprio jogador;
3. escala de intensidade;
4. escala de energia restante;
5. botao `Guardar e continuar`.

As tres respostas sao obrigatorias. O botao fica desativado ate estarem completas.

Se existirem varios jogos pendentes abrangidos pela funcionalidade, sao mostrados do mais antigo para o mais recente, com progresso `1 de N`. Depois do ultimo envio, a aplicacao continua para revelacoes de MVP, cartas e resumo mensal, por esta ordem.

Uma resposta submetida nao pode ser alterada pelo jogador nem pelo administrador. Esta regra preserva a leitura espontanea do pos-jogo.

## Regra de transicao no lancamento

O jogo finalizado mais recente no momento da atualizacao e incluido imediatamente:

- participantes que ainda nao votaram no MVP recebem o formulario completo com voto e duas perguntas;
- participantes que ja votaram mantem o voto e nao sao obrigados retroativamente a responder;
- jogos finalizados anteriores a esse jogo nao entram na fila;
- a partir do jogo finalizado seguinte, todos os participantes devem preencher o formulario completo.

Guardar uma data de ativacao e o ID do jogo de transicao na configuracao de dados para que a regra seja estavel em todos os dispositivos.

## Operacao atomica

Criar uma funcao SQL/RPC `submit_postgame_checkin` que recebe:

- `game_id`;
- `candidate_player_id`;
- `game_intensity`, inteiro de 1 a 10;
- `remaining_energy`, inteiro de 1 a 10.

A funcao determina o jogador a partir de `auth.uid()` e valida:

- associacao entre conta e jogador;
- participacao no jogo;
- jogo finalizado;
- candidato participante e diferente do votante;
- ausencia de voto ou feedback anterior;
- intervalo das duas escalas.

Na mesma transacao, insere o voto em `game_mvp_votes` e a resposta em `game_feedback`. Se qualquer validacao ou escrita falhar, nao guarda nenhum dos dois.

O voto MVP continua acessivel apenas ao proprio votante e as contagens agregadas continuam a ser obtidas pela funcao atual. O novo RPC nao devolve a escolha depois do envio.

## Dados

Criar `game_feedback` com:

- `id`;
- `game_id`;
- `player_id`;
- `user_id`;
- `game_intensity`, de 1 a 10;
- `remaining_energy`, de 1 a 10;
- `calculation_version`, inicialmente `1`;
- `created_at`.

Restricao unica em `(game_id, player_id)`. Os registos sao a fonte original e nao sao atualizados. Inferencias e resumos sao calculados sem destruir ou substituir as respostas originais.

## Privacidade

- O proprio jogador pode ler as suas respostas.
- Administradores podem ler respostas de todos os jogadores.
- Outros jogadores nao podem ler respostas individuais nem agregadas nesta fase.
- Apenas o proprio jogador pode inserir a sua resposta atraves do RPC.
- Ninguem pode atualizar ou apagar respostas pela aplicacao.
- As politicas e funcoes nunca juntam a resposta ao candidato escolhido no voto MVP em resultados visiveis.
- O peso pertence a outra tabela, sem acesso administrativo, e nunca e copiado para `game_feedback`.

## Consulta administrativa

No detalhe administrativo de um jogo, mostrar media de intensidade, media de energia restante, numero de respostas e uma tabela por jogador com as duas pontuacoes.

Na analise anual administrativa, permitir selecionar um jogador e ver as duas linhas mensais. Esta interface nao mostra peso nem calorias calculadas com peso real.

## Inferencias futuras

Preservar IDs e timestamps para permitir comparar intensidade percebida com equilibrio previsto, diferenca de golos, energia restante, presencas, resultados, golos e MVPs. Agregados de grupo ou classificacoes publicas so podem ser adicionados depois de aprovacao explicita.

Nao criar agora diagnosticos de saude ou recomendacoes de treino.

## Erros e estados especiais

- Falha de rede: manter as escolhas e permitir tentar novamente.
- Duplicado por envio repetido: tratar como concluido e recarregar os dados.
- Jogo corrigido de finalizado para aberto: nao pedir nem aceitar resposta.
- Sem candidato MVP valido: mostrar instrucao ao administrador para corrigir o plantel.
- Jogos fora da regra de transicao: aparecem nos resumos como sem feedback.
- Modo local: guardar voto e feedback juntos no estado local, sem prometer privacidade entre pessoas que partilhem o dispositivo.

## Acessibilidade

- botoes 1 a 10 com alvo minimo de 44 por 44 px;
- valor selecionado distinguido por cor, contorno e texto;
- labels e extremos anunciados por leitor de ecra;
- navegacao completa por teclado;
- feedback de envio e foco no primeiro campo incompleto;
- layout sem scroll horizontal em 375 px.

## Verificacao

Os testes cobrem visibilidade por participacao, regra de transicao do jogo atual, ordem de pendentes, obrigatoriedade, limites 1-10, voto invalido, atomicidade, idempotencia, imutabilidade, RLS dos tres papeis, confidencialidade MVP, consulta administrativa, jogos reabertos, modo local, teclado, foco e ecrã pequeno.
