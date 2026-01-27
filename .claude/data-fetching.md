# Data Fetching

## SWR

Usar para data fetching com cache automático.

```typescript
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

const { data, error, isLoading, mutate } = useSWR("/api/products", fetcher);
```

## ky

Usar para requisições HTTP com configuração centralizada.

```typescript
import ky from "ky";

const api = ky.create({
  prefixUrl: "/api",
  headers: { "Content-Type": "application/json" },
});

// GET
const products = await api.get("products").json();

// POST
const created = await api.post("products", { json: data }).json();

// PUT
await api.put(`products/${id}`, { json: data });

// DELETE
await api.delete(`products/${id}`);
```

## Padrão no Model

```typescript
// products.model.ts
import useSWR from "swr";
import ky from "ky";

const api = ky.create({ prefixUrl: "/api" });

export function useProductsModel() {
  const { data, error, isLoading, mutate } = useSWR("/api/products",
    (url) => ky.get(url).json()
  );

  const createProduct = async (product: CreateProductDTO) => {
    await api.post("products", { json: product });
    mutate();
  };

  return { data, error, isLoading, createProduct };
}
```
