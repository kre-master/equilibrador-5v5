# Footer — instruções para agentes

## Fonte de verdade e contexto

- O código atual e o estado Git são a fonte de verdade técnica.
- Antes de alterar código, ler `Footer_vault/00 - Indice.md` e apenas as notas ligadas à tarefa.
- Para regras de produto, consultar `Footer_vault/03 - Decisoes e regras.md`.
- Para estrutura, comandos e limitações conhecidas, consultar `Footer_vault/04 - Estado tecnico.md`.
- Documentação antiga pode estar desatualizada; confirmar sempre no código.
- Não ler notas técnicas extensas na íntegra por defeito. Usar `rg -n` com termos da funcionalidade e abrir apenas os excertos relevantes.
- Usar primeiro este ficheiro e `package.json`; explorar mais documentação apenas quando o pedido o justificar.

## Regras de trabalho

- Confirmar `git status --short --branch` antes de editar.
- Não desfazer alterações locais do utilizador.
- Não usar `git reset --hard`, `git add .`, commit ou push sem pedido explícito.
- Alterar primeiro a versão web/base: `app.js`, `index.html`, `styles.css` e módulos da raiz.
- Não editar `www/` manualmente. Atualizá-lo com `npm.cmd run build:web` quando aplicável.
- Só alterar Android ou iOS quando isso for pedido explicitamente.
- Rever o cache-buster de `index.html` após alterações de JavaScript ou CSS.
- Não colocar segredos, credenciais administrativas, `service_role` ou dados pessoais em código ou documentação.
- Alterações Supabase devem preservar RLS, confidencialidade dos votos MVP e contratos existentes.

## Processo esperado

1. Localizar o código e as regras relacionadas com o pedido.
2. Fazer uma alteração pequena e coerente, sem expandir o âmbito.
3. Executar as validações relevantes.
4. Corrigir falhas antes de terminar.
5. Apresentar ficheiros alterados, testes executados, riscos e pendentes.

Manter a exploração e o relatório concisos. Não repetir grandes blocos da documentação no resultado.

## Validações disponíveis

```powershell
npm.cmd run check
npm.cmd run test:stats
npm.cmd run test:postgame
npm.cmd run test:monthly
npm.cmd run build:web
node --check www\app.js
git diff --check
```

Escolher os testes proporcionais à alteração. Para mudanças transversais, executar o conjunto completo.
