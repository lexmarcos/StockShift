# Batches Neon Badges + Default Warehouse Design

## Objetivo
Melhorar a tela de batches mantendo o visual “Corporate Solid Dark”, com **badges em neon** (texto + borda vibrantes sobre fundo preto), ícones nas ações da tabela, ordenação clicável nos cabeçalhos e preseleção do warehouse via `useSelectedWarehouse`.

## Escopo
- **Visual**: somente badges ganham cores neon; restante permanece monocromático em cinza/preto.
- **Tabela**: ações com ícone (Lucide) e texto.
- **Ordenação**: cabeçalhos clicáveis para Produto, Quantidade e Validade.
- **Filtro**: ao abrir a página, o filtro de warehouse deve iniciar com o valor de `useSelectedWarehouse` quando disponível.

## Não-Escopo
- Alterar layout geral (cards, grid, inputs) além do necessário.
- Animações ou transições.
- Mudança de endpoints ou formato de dados.

## Direção Visual
- **Badges neon** (fundo preto, borda + texto vibrantes):
  - `expired`: vermelho neon
  - `expiring`: amarelo neon
  - `low`: ciano neon
  - `ok`: verde neon
- Tipografia, espaçamentos e demais componentes permanecem no padrão atual.

## Comportamento
1. **Warehouse default**
   - `useBatchesModel` deve consumir `useSelectedWarehouse`.
   - Ao montar, se `filters.warehouseId` estiver vazio e existir `warehouseId` no hook, preencher o filtro com esse valor.
   - Não sobrescrever caso o usuário já tenha selecionado outro warehouse.

2. **Ordenação por coluna**
   - Cabeçalhos de **Produto**, **Quantidade** e **Validade** tornam-se interativos.
   - Clique alterna entre `asc` e `desc` para a coluna ativa.
   - Indicador visual (ícone de seta) mostra direção atual da coluna ativa.

3. **Ações com ícones**
   - Coluna Ações exibe ícone Lucide (ex.: `Eye`) + texto “Ver”.
   - Em mobile, o texto pode ser ocultado para reduzir ruído.

## Arquitetura / Arquivos
- **Model**: `app/batches/batches.model.ts`
  - Integrar `useSelectedWarehouse` e ajuste de estado inicial do filtro.
  - Manter lógica de sorting existente, apenas ajustar a UI para ordenar via cabeçalhos.
- **View**: `app/batches/batches.view.tsx`
  - Estilos das badges (classes utilitárias Tailwind).
  - Cabeçalhos clicáveis e ícones de ordenação.
  - Ações com ícone.

## Testes
- **Model**: teste garantindo que `filters.warehouseId` inicia com o valor do hook quando vazio.
- **View**: testes para ordenação ao clicar em cabeçalhos e presença do ícone em ações.

