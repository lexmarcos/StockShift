# Arquitetura MVVM

## Estrutura Obrigatória

Toda página deve seguir esta estrutura:

```
nome-da-pasta/
├── nome-da-pasta.model.ts    # Lógica: states, hooks, requests
├── nome-da-pasta.view.tsx    # Apenas JSX, sem estados
├── nome-da-pasta.types.ts    # Interfaces e types
├── nome-da-pasta.schema.ts   # Schema Zod (se houver form)
└── page.tsx                   # ViewModel - orquestra model e view
```

## Responsabilidades

| Arquivo | Contém | Não Contém |
|---------|--------|------------|
| `.model.ts` | Estados, hooks, lógica de negócio, chamadas HTTP | JSX |
| `.view.tsx` | JSX puro, recebe tudo via props | useState, useEffect, lógica |
| `.types.ts` | Interfaces, types, enums | Lógica, componentes |
| `.schema.ts` | Schema Zod para validação | Lógica de negócio |
| `page.tsx` | Importa model e view, passa props | Lógica complexa |

## Validação de Formulários

- **Zod** para schemas declarativos
- **react-hook-form** para gerenciamento de estado
- Schema em arquivo separado `.schema.ts`

```typescript
// produto.schema.ts
import { z } from "zod";

export const produtoSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  preco: z.number().positive("Preço deve ser positivo"),
});

export type ProdutoFormData = z.infer<typeof produtoSchema>;
```

## Documentação de Endpoints

Antes de implementar chamadas HTTP, consultar `docs/endpoints/` para especificações.
