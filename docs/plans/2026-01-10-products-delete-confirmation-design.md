# Exclusão de Produto na Listagem (Dupla Confirmação) Design

## Objetivo
Adicionar a ação de deletar produto na listagem com confirmação, incluindo aviso em amarelo pastel quando houver estoque no warehouse atual, e dupla confirmação somente nesses casos.

## Escopo
- Ação de deletar em **tabela (desktop)** e **cards (mobile)**.
- Modal de confirmação com dois botões: **Cancelar** e **Excluir**.
- Se houver estoque no warehouse atual, exibir aviso em amarelo pastel com batches e abrir **segundo modal** ao clicar em **Excluir**.
- Se não houver estoque no warehouse atual, **não** abrir o segundo modal.
- Exclusão via `DELETE /api/products/{id}` (soft delete).
- Uso de `ky` para requests e `SWR` para revalidar a listagem.

## Não-Escopo
- Criar novos endpoints.
- Alterar layout geral da página de produtos.
- Implementar animações ou transições.
- Exclusão em massa.

## Direção Visual
- Visual **Corporate Solid Dark**: tons de cinza e preto, sem cores vibrantes.
- Apenas o aviso usa **amarelo pastel** (fundo e borda suaves) para destacar a existência de estoque.
- Bordas com **rounded-sm** (4px) e sombras mínimas ou ausentes.
- Botões com contraste em cinza; ação destrutiva apenas no botão final de deletar.

## Comportamento
1. Usuário clica em **Deletar** na listagem.
2. Abre o **primeiro modal** e inicia a verificação de estoque do produto.
3. Buscar batches em `GET /api/batches/product/{productId}` e filtrar por `warehouseId` atual e `quantity > 0`.
4. **Se houver batches**:
   - Exibir aviso em amarelo pastel com:
     - Mensagem de warning.
     - Lista de batches (numero, quantidade e validade quando existir).
   - Botão **Excluir** abre o **segundo modal**.
5. **Se não houver batches**:
   - Botão **Excluir** executa `DELETE /api/products/{id}` diretamente.
6. **Segundo modal**:
   - Texto explicando soft delete (produto desativado) e impacto operacional.
   - Botões: **Não deletar** e **Deletar**.
7. Sucesso: toast + `mutate` da listagem; fechar modais.
8. Erro: toast com mensagem amigavel e manter modal aberto.

## Arquitetura / Arquivos
- **Model**: `app/products/products.model.ts`
  - Estado: produto selecionado, status dos modais, loading e batches filtrados.
  - Fetch de batches por produto + filtragem por warehouse.
  - Handler de delete com `api.delete` e revalidacao do SWR.
- **Types**: `app/products/products.types.ts`
  - Tipos para batches e props adicionais da view.
- **View**: `app/products/products.view.tsx`
  - Botao de deletar na tabela e no card mobile.
  - Dois `AlertDialog` com copy e botoes conforme o fluxo.
  - Bloco de aviso em amarelo pastel com lista de batches.

## Endpoints
- `GET /api/batches/product/{productId}`
- `DELETE /api/products/{id}`

## Testes
- **Model**: cenarios com estoque no warehouse (dupla confirmacao) e sem estoque (confirmacao unica).
