# Testes

## Framework

Vitest para testes unitários.

## Escopo

Testar apenas o arquivo `.model.ts` de cada página.

## Estrutura

```
nome-da-pasta/
├── nome-da-pasta.model.ts
├── nome-da-pasta.model.test.ts  # Testes aqui
├── nome-da-pasta.view.tsx
├── nome-da-pasta.types.ts
└── page.tsx
```

## Workflow

Ao finalizar uma página, perguntar:

> "Deseja criar testes unitários do model desta página?"

## Exemplo

```typescript
// products.model.test.ts
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useProductsModel } from "./products.model";

describe("useProductsModel", () => {
  it("should fetch products", async () => {
    const { result } = renderHook(() => useProductsModel());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
  });
});
```

## Comando

```bash
pnpm test
```
