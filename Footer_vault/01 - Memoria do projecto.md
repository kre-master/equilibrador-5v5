# Memoria do projecto

## Identidade

O projecto chama-se Footer. E uma app/site para gerir futebol entre amigos: convocatorias, geracao equilibrada de equipas, historico de jogos, ratings, forma, MVP, pagamentos, perfis de jogadores e cartas estilo FIFA.

A app foi renomeada para Footer e usa uma identidade visual associada a bola/chama.

## Produto

Footer comecou como uma app estatica para gerar equipas equilibradas de futebol 5v5, guardar historico e exportar PNG. Evoluiu para uma app de grupo privado com contas, associacao de perfis, admin, Supabase, convocatorias, pagamentos, MVP, forma/rating actual, premios e cartas de jogador.

O foco actual e manter a experiencia simples para jogadores e forte para admins:

- Jogadores respondem a convocatorias e consultam perfis, forma, historico e cartas.
- Admin gere jogadores, ratings, fotos, convocatorias, jogos, historico, pagamentos e resultados.
- A geracao de equipas tenta equilibrar qualidade, forma e distribuicao dos jogadores.

## Arquitectura geral

A versao base/web vive na raiz do projecto:

- `index.html`
- `app.js`
- `styles.css`
- `app-config.js`
- `assets/`

A pasta `www/` recebe o bundle/copia para Capacitor/mobile:

- `www/index.html`
- `www/app.js`
- `www/styles.css`
- `www/assets/`

Android e iOS existem como shells Capacitor, mas a regra combinada e trabalhar primeiro na web/base. Mobile so deve ser preparado ou alterado quando for pedido explicitamente.

## Dados e persistencia

Sem Supabase configurado, a app usa `localStorage`. Online, usa Supabase para contas, perfis, jogadores, convocatorias, respostas, jogos, pagamentos, MVP e dados relacionados.

O primeiro utilizador autenticado depois de aplicar o schema pode ficar como admin inicial. O admin aprova associacoes entre contas e perfis de jogador.

## Memoria importante

Este vault deve funcionar como apoio de continuidade entre chats. Sempre que houver trabalho relevante, actualizar as notas em vez de confiar apenas na memoria do chat.
