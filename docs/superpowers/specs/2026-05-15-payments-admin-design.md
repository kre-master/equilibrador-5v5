# Payments Admin Design

## Objetivo

Criar um separador admin para gerir idas e pagamentos mensais dos jogos.

## Regras

- Cada presença em jogo confirmado custa 4 EUR.
- Cada jogador paga no maximo 15 EUR por mes.
- O campo custa 38 EUR por jogo.
- Apenas jogos confirmados no historico contam para pagamentos.
- Suplentes contam como presença.
- O admin pode ajustar manualmente presenças porque um jogador pode ter respondido "vou" ou estar numa equipa e depois não ter ido.
- O admin pode registar pagamentos manuais com data, valor e nota.
- Saldo positivo significa que o jogador deve pagar.
- Saldo negativo significa credito do jogador.
- O ficheiro atual do tesoureiro entra como ponto de arranque financeiro: saldos atuais por jogador e saldo de caixa.
- A app calcula apenas movimentos posteriores ao mes inicial definido.

## UI

- Novo separador admin: `Pagamentos`.
- Selector de mes.
- Tabela por jogador com presenças por jogo do mes, valor a pagar, pago no mes, saldo anterior e saldo atual.
- Botao WhatsApp para exportar resumo de devedores/creditos.
- Formulario para adicionar pagamento manual.
- Historico de pagamentos do mes.

## Dados

- As presenças base vêm dos jogos (`games`).
- Ajustes de presença ficam em `attendance_overrides`.
- Pagamentos ficam em `payments`.
- Saldos iniciais e caixa ficam em `finance_settings`.
- A promoção/remocao de admin usa a coluna existente `profiles.role`.

## Fora de Escopo

- Export PNG estilo Excel.
- Faturação real.
- Integração MBWay.
