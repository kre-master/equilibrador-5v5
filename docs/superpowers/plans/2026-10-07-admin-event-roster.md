# Admin Event Roster Implementation Plan

**Goal:** Ajustar respostas de presenca a partir da convocatoria pelo admin.

**Architecture:** Reutilizar o estado e o upsert existentes, com controlos junto aos nomes e handler administrativo. Nenhuma alteracao de schema.

**Tech Stack:** JavaScript, CSS, Supabase, node:test.

- [x] Em app.js, passar eventData/status para renderRosterMini; desenhar botoes separados Confirmar/Remover apenas para isAdmin em eventos ativos. Desativar Confirmar quando cheio.
- [x] Ligar data-event-admin-response a saveAdminEventResponse; validar admin, evento ativo, jogador e status; desativar controlos durante pedido; reutilizar saveEventResponseForPlayer, preservar existing.userId, renderizar apos sucesso e reportar erro.
- [x] Em styles.css, agrupar perfil/acao com flex e permitir quebra em ecras pequenos; atualizar versoes JS/CSS em index.html.
- [x] Criar tests/event-roster.test.mjs usando VM como tests/guest-players.test.mjs. Cobrir maybe/not_going -> going, going -> not_going, lotacao, nao-admin, cancelado/concluido, conta preservada, falha e controlos visiveis.
- [x] Executar node --test tests/event-roster.test.mjs tests/guest-players.test.mjs, npm.cmd run check, suites stats/postgame/monthly, npm.cmd run build:web, node --check www/app.js e git diff --check.
- [x] Atualizar regras e estado tecnico com o comportamento e verificacoes. Nao fazer commit ou push sem pedido.
