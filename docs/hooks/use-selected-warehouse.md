# Hook useSelectedWarehouse

## Descrição

Hook personalizado para acessar o ID do warehouse selecionado em qualquer página do sistema.

## Uso

```tsx
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";

function MyComponent() {
  const { warehouseId, setWarehouseId } = useSelectedWarehouse();

  // warehouseId contém o ID do warehouse selecionado (ou null)
  // setWarehouseId permite alterar o warehouse selecionado

  return (
    <div>
      {warehouseId ? (
        <p>Warehouse selecionado: {warehouseId}</p>
      ) : (
        <p>Nenhum warehouse selecionado</p>
      )}
    </div>
  );
}
```

## Exemplo: Filtrar produtos por warehouse

```tsx
"use client";

import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import useSWR from "swr";

function ProductsPage() {
  const { warehouseId } = useSelectedWarehouse();

  const { data, isLoading } = useSWR(
    warehouseId ? `products?warehouseId=${warehouseId}` : null,
    fetcher
  );

  if (!warehouseId) {
    return <div>Selecione um warehouse primeiro</div>;
  }

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div>
      <h1>Produtos do Warehouse {warehouseId}</h1>
      {/* Renderizar produtos */}
    </div>
  );
}
```

## Persistência

O warehouse selecionado é automaticamente salvo no `localStorage` e restaurado ao recarregar a página.

**Key do localStorage**: `selected-warehouse-id`
