# Liquid Glass UI Design

## Objetivo

Atualizar a interface do Equilibrador 5v5 para uma direção visual "liquid glass" clara, inspirada em iOS/Apple, mantendo a app prática para uso real em telemóvel e desktop.

## Direção Visual

- Fundo claro com gradientes suaves e alguma profundidade visual.
- Painéis translúcidos com `backdrop-filter`, brilho subtil, bordas claras e sombras leves.
- Barra de navegação em formato glass flutuante, com o separador ativo mais contrastado.
- Botões, inputs, contadores e badges com acabamento mais polido e estados claros.
- Aparência premium sem tornar tabelas, convocatórias, ratings ou histórico difíceis de ler.

## Escopo

Esta alteração mexe apenas na apresentação:

- `styles.css`
- ajustes mínimos em classes HTML apenas se forem necessários para o visual

Não altera:

- algoritmo de equipas
- Supabase
- autenticação
- convocatórias
- dados guardados
- exportação PNG

## Componentes Afetados

- Header e navegação principal.
- Painéis das views.
- Formulários e inputs.
- Botões principais, secundários e perigosos.
- Lista de jogadores, tabelas, cartões de eventos e sugestões.
- Layout responsivo mobile.

## Regras de Legibilidade

- O blur e transparência não podem reduzir contraste de texto.
- Conteúdo denso, como tabelas, deve continuar com fundo suficientemente opaco.
- Em mobile, a navegação deve continuar fácil de tocar e sem sobreposição.
- O estilo deve ser consistente com o verde/laranja da app.

## Critérios de Aceitação

- A app mantém as mesmas funcionalidades.
- A interface fica claramente mais moderna e glass.
- Texto e botões continuam legíveis em desktop e mobile.
- Não há deslocações ou sobreposições novas no layout principal.
- `node --check app.js` continua sem erros, mesmo sem alteração prevista ao JavaScript.
