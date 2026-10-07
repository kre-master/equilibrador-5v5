# Ajustes da convocatoria pelo admin

Pedido autorizado: permitir ao admin ajustar a convocatoria quando jogadores nao conseguem alterar a resposta por falta de internet.

Abordagens: botoes junto aos nomes (escolhida, menos passos); seletor administrativo de resposta (mais cliques); override separado (duplicaria estado sem necessidade).

Na lista Vou, Remover muda a resposta para not_going. Nas listas Talvez e Nao vou, Confirmar muda para going. Mantem-se o acesso ao perfil em botao separado. Acoes apenas para admin, sem edicao em convocatorias canceladas ou concluidas. Confirmar fica indisponivel quando cheio, mas Remover continua disponivel.

Reutilizar saveEventResponseForPlayer e as policies existentes. Preservar user_id ao ajustar resposta existente, recarregar dados depois de sucesso e apresentar erros sem alterar estado local em caso de falha remota. Nao alterar jogos ja gerados.

Validar transicoes, lotacao, permissao, eventos inativos, preservacao da conta, falha remota e renderizacao; atualizar cache-busters e gerar www pelo build.
