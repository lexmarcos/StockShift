# Mobile Issues - Transfers

## [TRF-M01] Listagem de Transferências
- **Problema**: Cards de sumário (StatusCard) empilhados verticalmente.
- **Impacto**: Excesso de scroll inicial.
- **Sugestão**: Grid 2x2 ou Scroll Horizontal.

## [TRF-M02] Formulário de Nova Transferência
- **Problema**: Input de Quantidade e Botão Adicionar desalinhados.
- **Impacto**: UX pobre e desperdício de espaço vertical.
- **Sugestão**: Flex-row no container de quantidade/botão.

## [TRF-M03] Navegação e Ações
- **Problema**: Falta de FAB (Floating Action Button) para "Nova Transferência".
- **Impacto**: Dificuldade de uso com uma mão (Mobile First).
- **Sugestão**: Implementar FAB similar ao da tela de Armazéns.

## [TRF-M04] Tela de Validação
- **Problema**: Botões de ação na parte inferior podem sobrepor o conteúdo se a `FixedBottomBar` não tiver o padding correto.
- **Sugestão**: Validar padding-bottom no container principal.
