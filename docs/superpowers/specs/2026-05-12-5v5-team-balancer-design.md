# 5v5 Team Balancer Design

## Objetivo

Criar uma app local no browser para organizar jogos de futebol 5v5 entre amigos. A app deve selecionar os jogadores presentes, gerar equipas equilibradas, evitar repetir combinacoes com demasiada frequencia, confirmar jogos, gerar uma imagem partilhavel para WhatsApp e manter historico com resultados editaveis.

## Escopo Da Primeira Versao

A primeira versao deve funcionar sem depender de OCR. O fluxo principal sera selecionar jogadores numa lista, adicionar convidados quando necessario e gerar equipas para 10 a 13 jogadores.

Inclui:

- Base de jogadores com nome, ratings FIFA e overall.
- Selecao manual dos jogadores presentes.
- Adicao de convidados com nota rapida de 0 a 10, convertida para rating temporario de 0 a 100.
- Geracao de equipas para 10, 11, 12 ou 13 jogadores.
- Titulares 5v5 e suplentes quando existirem mais de 10 jogadores.
- Confirmacao de jogo a partir de uma sugestao.
- Vista visual em campo com bolinhas, nomes e ratings.
- Rating total e medio de cada equipa.
- Exportacao de uma imagem/cartao do jogo para enviar no WhatsApp.
- Historico local de jogos.
- Edicao posterior de resultado, jogadores, equipas e convidados.

Fica para fase 2:

- Colar ou carregar prints do WhatsApp.
- OCR para pre-selecionar automaticamente jogadores reconhecidos.
- Revisao de nomes detetados pelo OCR antes de confirmar presencas.

## Fluxo Principal

1. O utilizador abre a app local.
2. Vai ao ecra "Quem vem hoje?".
3. Seleciona jogadores da lista, com pesquisa e filtros simples.
4. Adiciona convidados, se necessario, com nome e nota de 0 a 10.
5. Clica em "Gerar equipas".
6. A app mostra uma ou mais sugestoes ordenadas por equilibrio.
7. O utilizador escolhe uma sugestao e clica em "Confirmar jogo".
8. A app cria um jogo no historico com estado "em aberto".
9. A app mostra o campo visual e permite exportar uma imagem para WhatsApp.
10. Depois do jogo, o utilizador abre o jogo e edita o resultado ou ajusta jogadores/equipas se houve alteracoes.

## Modelo De Dados

### Jogador

- `id`
- `name`
- `pace`
- `shooting`
- `passing`
- `dribbling`
- `defending`
- `physical`
- `overall`
- `isGuest`
- `guestScore0To10`, apenas para convidados

O `overall` dos jogadores fixos vem da tabela de ratings. Para convidados, a nota rapida sera convertida de forma simples: `score * 10`. Exemplo: `7.5` passa a `75`.

### Jogo

- `id`
- `date`
- `status`: `open` ou `finished`
- `teamA`
- `teamB`
- `bench`
- `teamAStats`
- `teamBStats`
- `scoreA`
- `scoreB`
- `notes`

Cada equipa guarda os ids dos jogadores titulares. O banco guarda os suplentes. Se um jogo for editado, a app recalcula ratings, vencedor e imagem.

## Algoritmo De Equipas

Para 10 jogadores:

- Gerar combinacoes possiveis de 5 contra 5.
- Calcular rating total e medio de cada equipa.
- Penalizar diferencas grandes entre equipas.
- Penalizar combinacoes repetidas com base no historico.
- Ordenar sugestoes pela menor pontuacao de desequilibrio.

Para 11 a 13 jogadores:

- Escolher duas equipas titulares de 5.
- Colocar os restantes no banco.
- Tentar equilibrar tambem o impacto do banco, evitando que os melhores ou piores fiquem sempre suplentes.
- Penalizar jogadores que ficaram no banco recentemente, quando houver historico suficiente.

Pontuacao recomendada:

- Diferenca de overall total entre equipas.
- Diferenca de atributos chave, sobretudo defesa, passe e fisico.
- Repeticao de pares de jogadores na mesma equipa.
- Repeticao de uma equipa igual ou quase igual.
- Justica de banco em jogos recentes.

## Interface

### Navegacao

A app tera quatro areas principais:

- `Jogadores`
- `Quem vem hoje?`
- `Jogos`
- `Historico`

### Jogadores

Mostra a base de jogadores, ratings e overall. Permite editar jogadores fixos, preencher os tres jogadores em falta e remover ou corrigir dados.

### Quem Vem Hoje?

Mostra uma lista pesquisavel com checkboxes. Deve ser rapida de usar no telemovel e no computador. Tambem inclui o botao "Adicionar convidado".

### Geracao E Confirmacao

Depois de selecionar 10 a 13 jogadores, a app mostra sugestoes de equipas. Cada sugestao mostra:

- Equipa A e Equipa B.
- Suplentes.
- Overall total e medio.
- Diferenca entre equipas.
- Indicacao simples de repeticao historica.

O botao "Confirmar jogo" cria o registo definitivo do jogo.

### Campo Visual

O jogo confirmado mostra um campo 5v5. Cada jogador aparece como uma bolinha com:

- Nome curto.
- Rating.
- Cor da equipa.

A vista mostra tambem:

- Nome das equipas.
- Rating total/medio.
- Suplentes.
- Data.
- Resultado, quando existir.

A app deve permitir exportar esta vista como imagem PNG para partilha no WhatsApp.

### Edicao Do Jogo

Num jogo guardado, o utilizador pode:

- Editar resultado.
- Trocar jogadores entre equipas.
- Mover jogador para/do banco.
- Adicionar ou remover convidado.
- Regenerar a imagem atualizada.

## Armazenamento

A primeira versao pode guardar tudo localmente no browser com `localStorage` ou `IndexedDB`. Como os dados sao pequenos, `localStorage` e suficiente para MVP, desde que haja exportacao/importacao JSON para backup.

Dados guardados:

- Base de jogadores.
- Jogos confirmados.
- Resultados.
- Historico de combinacoes.

## Tratamento De Erros

- Se forem selecionados menos de 10 jogadores, mostrar aviso claro.
- Se forem selecionados mais de 13 jogadores, bloquear geracao na primeira versao.
- Se faltar rating num jogador fixo, pedir para completar antes de gerar.
- Se a exportacao da imagem falhar, manter o jogo criado e mostrar instrucao para tentar novamente.
- Se dados locais estiverem corrompidos, oferecer reset e importacao de backup JSON.

## Testes E Validacao

Testes manuais essenciais:

- Gerar equipas com exatamente 10 jogadores.
- Gerar equipas com 11, 12 e 13 jogadores.
- Confirmar jogo e verificar que aparece no historico.
- Editar resultado e confirmar que vencedor/rating visual atualiza.
- Trocar jogadores entre equipas e banco.
- Exportar imagem PNG.
- Fechar e reabrir a app, confirmando persistencia local.

Testes automaticos recomendados:

- Calculo de overall de convidados.
- Geracao sem jogadores repetidos.
- Equipas titulares sempre com 5 jogadores.
- Banco com tamanho correto.
- Penalizacao de repeticao historica.
- Recalculo de stats apos edicao do jogo.
