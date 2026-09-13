# Workflow híbrido — Footer

## Objetivo

Usar inferência local por defeito para exploração, implementação, testes, build e documentação, reservando o Codex OpenAI para decisões difíceis, segurança, diagnóstico complexo e revisão final.

O desktop e o portátil usam o mesmo código, `AGENTS.md` e processo através do GitHub. Cada máquina mantém localmente o seu modelo, quantização, contexto e configuração do LM Studio.

## Fluxo de uma alteração

1. Jon descreve a melhoria no Codex.
2. O Codex apresenta a divisão prevista entre inferência local e OpenAI.
3. O Codex seleciona apenas os ficheiros necessários e pede diagnóstico e proposta ao modelo local.
4. O Codex OpenAI aplica a proposta útil, executa os testes e revê o `git diff` e os pontos de risco.
5. Correções mecânicas podem voltar ao modelo local; problemas complexos são assumidos pelo Codex OpenAI.
6. Commit e push só são feitos depois de autorização explícita.

## Divisão padrão

### Inferência local

- analisar os ficheiros de contexto selecionados pelo Codex;
- localizar a causa provável;
- propor alterações pequenas e médias;
- sugerir testes e validações;
- resumir a solução e os riscos.

### Codex OpenAI

- clarificar requisitos ambíguos com impacto no produto;
- decidir arquitetura transversal;
- rever autenticação, Supabase, RLS e segurança;
- investigar falhas depois de tentativas locais razoáveis;
- rever o diff final em mudanças de risco médio ou alto.

## Evitar duplicação

- O Codex OpenAI não repete a implementação local por defeito.
- A passagem de trabalho usa a proposta local, o `git diff`, resultados dos testes e dúvidas pendentes.
- O modelo local não recebe terminal, credenciais, commit ou push.
- O agente local pesquisa documentação extensa por termos e lê apenas os excertos necessários.
- Se o trabalho local tiver de ser refeito substancialmente, registar a poupança como baixa ou inexistente.

## Arranque local

Com o servidor do LM Studio ativo na porta 1234, indicar o pedido e apenas os ficheiros relevantes:

```powershell
.\scripts\invoke-local-codex.ps1 -Prompt "Descreve aqui a tarefa" -ContextPath app.js, monthly-recap.js
```

No desktop, o modelo predefinido é `openai/gpt-oss-20b` com raciocínio `low`. O lançador descarrega automaticamente outro LLM que esteja em memória e carrega o modelo pedido com contexto de 32k. Para uma decisão local mais exigente pode usar-se `-ReasoningEffort medium`; `xhigh` fica reservado para ensaios em que o ganho justifique o tempo adicional.

O `qwen/qwen3.8-27b` fica disponível como alternativa para trabalho local mais demorado:

```powershell
.\scripts\invoke-local-codex.ps1 -Model "qwen/qwen3.8-27b" -Prompt "Descreve aqui a tarefa"
```

Se estiverem expostos vários modelos:

```powershell
.\scripts\invoke-local-codex.ps1 -Model "identificador-do-modelo" -Prompt "Descreve aqui a tarefa"
```

O comando interrompe antes de executar se o servidor não responder, se o modelo não puder ser carregado ou se algum ficheiro de contexto estiver fora do repositório. A aplicação e os testes continuam a cargo do Codex principal porque a política de segurança impede uma instância local aninhada de lançar outro terminal.

## Relatório esperado em cada tarefa

- divisão prevista: local, OpenAI e critério de escalada;
- trabalho efetivamente feito por cada lado;
- testes e build executados;
- problemas encontrados;
- avaliação da poupança: elevada, moderada, baixa ou inexistente.
