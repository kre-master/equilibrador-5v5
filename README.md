# Equilibrador 5v5

App estatica para gerar equipas equilibradas de futebol 5v5, guardar historico e exportar PNG.

## Usar localmente

Abre `index.html` no browser. Sem Supabase configurado, a app usa `localStorage`.

## Configurar Supabase

1. Cria um projeto no Supabase.
2. Vai a `SQL Editor`.
3. Executa o ficheiro `supabase/schema.sql`.
4. Vai a `Authentication > Users` e cria o teu utilizador admin com email/password.
5. Vai a `Project Settings > API`.
6. Copia `Project URL` e `anon public key`.
7. Edita `app-config.js`:

```js
window.FIVE5_CONFIG = {
  supabaseUrl: "https://o-teu-projeto.supabase.co",
  supabaseAnonKey: "a-tua-anon-key",
};
```

### Configurar SMTP para emails de conta

O email interno do Supabase serve apenas para testes e tem um limite muito baixo. Para criar contas, confirmar emails e recuperar passwords sem bater no erro `email rate limit exceeded`, configura um SMTP externo.

Opcao simples para comecar:

1. Cria conta num provider com plano gratis, por exemplo Resend ou Brevo.
2. No provider, cria/valida o remetente ou dominio.
3. Copia os dados SMTP: host, port, username, password e remetente.
4. No Supabase, abre `Authentication > Settings > SMTP`.
5. Ativa `Enable Custom SMTP`.
6. Preenche:
   - `Sender email`: email remetente validado no provider.
   - `Sender name`: `Equilibrador 5v5`.
   - `Host`: host SMTP do provider.
   - `Port`: normalmente `587`.
   - `Username`: utilizador SMTP/API key indicado pelo provider.
   - `Password`: password/token SMTP indicado pelo provider.
7. Guarda e testa criar uma conta nova.

Enquanto a app ainda esta em testes, tambem podes desligar temporariamente a confirmacao por email em `Authentication > Providers > Email > Confirm email`. Para uso real com jogadores, e melhor manter a confirmacao ligada e usar SMTP.

## Como funciona online

- Visitantes podem ver a app e criar conta.
- Jogadores criam conta por email/password, escolhem username e depois reclamam o perfil de jogador que ja existe.
- O login aceita email ou username.
- No separador `Conta`, os utilizadores podem definir username, mudar password e pedir recuperacao de password por email.
- Admin aprova pedidos de associacao entre conta e perfil.
- Admin lanca convocatorias com data, hora, local e limite de jogadores.
- Jogadores com perfil associado respondem `Vou`, `Talvez` ou `Nao vou`.
- Admin pode carregar os confirmados da convocatoria para o gerador de equipas.
- Admin pode editar jogadores/fotos, confirmar jogos, editar resultados e historico.
- O primeiro utilizador autenticado criado depois de aplicar o schema fica como admin inicial.
- O botao `Entrar` faz login com email/password do Supabase.

## Publicar com GitHub Pages

1. Cria um repositorio no GitHub.
2. Envia estes ficheiros para o repositorio.
3. Em `Settings > Pages`, escolhe deploy a partir da branch principal.
4. Abre o URL publicado.

## Publicar com Netlify

1. Cria um site novo no Netlify a partir do repositorio GitHub.
2. Build command: vazio.
3. Publish directory: `/`.
4. Faz deploy.

## Nota sobre fotos

As fotos ficam guardadas como base64 na tabela `players.photo_data_url`. Para este grupo e poucas fotos, isto chega no plano gratuito. Mais tarde pode ser migrado para Supabase Storage se quiseres ficheiros separados.
