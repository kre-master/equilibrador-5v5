# Mobile Test Parallel Track Design

## Objetivo

Criar uma app de teste para Android e, mais tarde, iPhone, sem comprometer a app web atual que ja esta a ser usada pelo grupo de futebol. A app atual continua publicada no GitHub Pages a partir da branch `main`; a app mobile evolui numa branch separada, `codex-mobile-test`.

## Decisoes

- A app atual em producao continua intacta em `main`.
- A app mobile teste comeca como wrapper da app web atual usando Capacitor.
- Android vem primeiro porque pode ser compilado/testado em Windows com Android Studio.
- iOS fica preparado no projeto, mas o build real precisa de Mac/Xcode ou servico cloud.
- A primeira app mobile pode usar o mesmo Supabase quando estiver estavel, porque assim nao ha migracao complexa de dados.
- Durante desenvolvimento pesado, pode ser criado um Supabase de teste, mas isso nao e obrigatorio para a primeira prova.
- Mudancas de base de dados devem ser aditivas: adicionar tabelas/colunas sem apagar/renomear campos usados pela app atual.
- A app mobile deve manter compatibilidade com os dados atuais: jogadores, contas, convocatorias, jogos, pagamentos e historico.

## Estado Atual

O projeto atual e uma app estatica composta por:

- `index.html`
- `styles.css`
- `app.js`
- `app-config.js`
- `supabase/schema.sql`
- `server.mjs`

A persistencia online usa Supabase Auth e Postgres. A publicacao atual usa GitHub Pages.

## Estrategia Tecnica

A primeira fase deve transformar o projeto numa app web instalavel e embrulhavel, sem mudar a experiencia principal:

1. Adicionar estrutura Node minima (`package.json`).
2. Servir/buildar a app estatica de forma previsivel.
3. Adicionar manifest PWA e icones base.
4. Adicionar Capacitor.
5. Criar projeto Android.
6. Sincronizar os ficheiros web para Android.
7. Testar login, convocatorias, pagamentos e exportacoes dentro do WebView.

Nao se deve reescrever em React/Flutter/React Native nesta fase. Essa decisao fica para uma versao profissional se o produto validar.

## Dados E Migracao

Na estrategia recomendada, nao existe migracao de dados entre app web e app mobile. Ambas apontam para o mesmo Supabase quando a app mobile estiver pronta para teste real.

Se for preciso um ambiente isolado:

- criar segundo projeto Supabase;
- executar `supabase/schema.sql`;
- copiar apenas dados de exemplo ou uma exportacao controlada;
- apontar `app-config.js` da branch mobile para esse ambiente.

Quando a mobile estiver aprovada, basta apontar para o Supabase real ou fazer merge das mudancas seguras para `main`.

## Riscos

- O ficheiro `app.js` esta grande e pode dificultar crescimento. A refatoracao deve ser gradual e orientada por necessidade.
- Fotos em base64 funcionam para o grupo atual, mas podem pesar numa app com muitos jogadores. Mais tarde deve migrar para Supabase Storage.
- iOS exige infraestrutura diferente de Android.
- Notificacoes push nativas nao devem entrar na primeira fase; devem ser fase 2 ou 3.
- App Store/Google Play exigem politicas, privacidade, icones, screenshots e fluxos de conta mais robustos.

## Criterios De Aceitacao Da Primeira App Teste

- A branch mobile nao altera a app em producao.
- Android abre a app com icon/splash.
- Login Supabase funciona.
- Convocatorias carregam e permitem responder.
- Admin consegue abrir pagamentos.
- A app usa dados atuais quando configurada com o Supabase real.
- O projeto fica documentado para repetir build/sync.

