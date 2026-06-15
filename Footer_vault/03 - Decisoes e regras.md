# Decisoes e regras

## Regra principal de trabalho

Alteracoes futuras devem ser feitas primeiro na versao base/web.

Ficheiros principais:

- `app.js`
- `index.html`
- `styles.css`

So mexer em Android/iOS quando for pedido explicitamente.

Quando for preciso actualizar a copia web/mobile, usar build/sync apropriado e rever os ficheiros alterados antes de commit.

## Git e workspace

- Nao usar `git reset --hard`.
- Nao usar `git add .`.
- Ha varios assets nao rastreados; rever sempre antes de adicionar ficheiros.
- Nao desfazer alteracoes locais do utilizador.
- Se `www/app-config.js` aparecer modificado depois de build, verificar e provavelmente restaurar com `git restore www/app-config.js`.
- Actualizar cache-buster em `index.html` quando alterar JS/CSS para evitar cache no telemovel.

## Convocatorias

- A convocatoria tem limite de jogadores, normalmente 12.
- Ao atingir o limite, nao deve permitir mais respostas `Vou`.
- `Gerar com confirmados` deve passar directamente para sugestoes/preview.
- A data do jogo confirmado deve vir da convocatoria.
- Admin pode alterar a data/hora de uma convocatoria depois de lancada.
- Se a convocatoria ja tiver originado um jogo, alterar a data/hora da convocatoria deve sincronizar tambem a data/hora desse jogo.
- Admin pode cancelar/apagar convocatorias quando necessario.

## Equipas

- Nao deve haver suplentes visuais quando ha 12 confirmados.
- Com 12 confirmados, todos entram no campo/equipa, contando 6 por equipa para equilibrio.
- O equilibrio deve considerar rating e forma sem sacrificar completamente a coerencia das equipas.

## Ratings e forma

- Rating publico visivel deve aparecer como overall/form.
- Rating actual/privado e edicao devem ficar restritos a admins.
- Overall pode ser recalculado automaticamente a partir dos parciais.
- Forma/rating actual e interno ao grupo e nao deve ser confundido com futuro rating publico/social.

## MVP

- Voto deve ser confidencial.
- Jogador nao pode alterar voto depois de votar.
- Admin pode ver contagem de votos sem ver quem votou em quem.
- A app nao deve ler votos MVP crus de outros utilizadores; deve usar contagens agregadas.
- Pode haver empate.
- MVP vale apenas para o jogo seguinte se o jogador participar.

## Seguranca e contas

- Login e recuperacao de password devem usar email, nao username.
- Username serve para identificacao dentro da app, mas nao deve permitir descobrir o email associado.
- Em producao, confirmacao de email deve ficar ligada no dashboard Supabase.
- Rate limiting/captcha para criacao de conta e acoes repetiveis fica como melhoria futura enquanto a app estiver limitada ao grupo local de amigos.

## Historico

- Jogos finalizados abrem uma pagina propria de historico.
- Clicar num jogo finalizado dentro do perfil deve abrir `history-game`.
- O historico nao deve redireccionar indevidamente para `today/Gerar`.
- Cartas no campo do historico devem poder abrir a pagina do jogador.
- Admin pode alterar a data/hora de um jogo confirmado ou historico.
- Se o jogo tiver convocatoria associada, alterar a data/hora do jogo deve sincronizar tambem a convocatoria.

## Pagamentos

- Relatorios mensais de pagamentos seguem sempre `game.date`.
- Se a data/hora de um jogo mudar para outro mes, o jogo deve passar automaticamente para o relatorio desse novo mes.
- Presencas manuais e ajustes financeiros ficam ligados ao `game.id`; mudar a data nao deve perder esses overrides.
- Para ajustes, admin pode adicionar uma divida a um jogador alem de registar pagamentos.
- Dividas aumentam o saldo a pagar do jogador, mas nao contam como caixa recebida.
- Por compatibilidade com Supabase, dividas sao guardadas como movimentos positivos marcados internamente com `[DIVIDA]`; os calculos tratam esses movimentos como ajuste negativo.

## Cartas e premios

- A pagina de jogador deve comecar pela carta.
- Templates novos vivem em `assets/new cards template`.
- Cartas podem variar por contexto: base, forma, vitorias, MVP, premios e outros.
- Montra de premios deve mostrar progresso desbloqueadas x/y.

## Campeoes de estacao

- Datas oficiais:
  - Primavera: 20 marco ate antes de 21 junho.
  - Verao: 21 junho ate antes de 22 setembro.
  - Outono: 22 setembro ate antes de 21 dezembro.
  - Inverno: 21 dezembro ate antes de 20 marco.
- Uma estacao so pode atribuir campeao depois do seu fim real.
- Apenas um jogador ganha por estacao.
- O desempate fica por vitorias, win rate, jogos jogados e nome.
- A carta sazonal ativa aparece apenas no primeiro jogo do campeao depois do fim da estacao.
- A carta sazonal nao deve ficar ativa indefinidamente no perfil/listas.
- Cartas de campeao de estacao nao entram na montra permanente de premios.
- No historico individual, o resultado deve ser mostrado da perspectiva da equipa do jogador.
- Na lista de jogadores, `ULT. 5` deve representar jogos em que o jogador participou.
- Os pontos `ULT. 5` devem aparecer do mais antigo para o mais recente, deixando o jogo mais recente a direita.
- Historico de jogos deve mostrar o nome do jogo/convocatoria quando existir associacao ao evento.
- O detalhe de jogo historico nao deve ter botao `Voltar` no topo.
- Probabilidades do radar ficam inline junto ao nome de cada equipa no historico, mas continuam separadas no jogo atual.

## MVP do mes

- MVP do mes so pode ser atribuido apos o mes estar fechado e todos os jogos registados desse mes estarem finalizados.
- Desempates:
  - mais MVPs oficiais no mes;
  - mais vitorias nos jogos em que participou nesse mes;
  - melhor win rate nesse mes.
- Se continuar empatado apos os tres criterios, a carta pode ser atribuida aos jogadores empatados.
- A carta de MVP do mes e temporaria de campo e aparece apenas no primeiro jogo elegivel do mes seguinte em que o jogador participe.
- MVP do mes entra na montra permanente de premios quando conquistado.

## Testes preferidos

O browser integrado/Codex browser pode falhar com sandbox no Windows. Preferir testes por terminal quando possivel:

- `node --check app.js`
- `npm.cmd run build:web`
- `node --check www\app.js`
- smoke test com `Invoke-WebRequest http://127.0.0.1:5173/`
