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

## Como funciona online

- Visitantes podem ver jogadores, selecionar presencas, adicionar convidados temporarios, gerar sugestoes e exportar PNG.
- Admin pode editar jogadores/fotos, confirmar jogos, editar resultados e historico.
- O botao `Admin` faz login com email/password do Supabase.

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
