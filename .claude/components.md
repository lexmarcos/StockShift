# Componentes

## Componentes UI

Usar prioritariamente `/components/ui`. Novos componentes devem usar:
- Tailwind CSS para estilização
- lucide-react para ícones (`strokeWidth={2}` ou `2.5`)

## Breadcrumb

### Quando Usar

| Tipo de Rota | Exemplo | Breadcrumb |
|--------------|---------|------------|
| Principal | `/products`, `/warehouses` | Não |
| Filha | `/products/create`, `/products/[id]/edit` | Sim |

### Implementação

No `page.tsx` da rota filha:

```typescript
import { useBreadcrumb } from "@/components/breadcrumb/use-breadcrumb";

export default function ProductCreatePage() {
  useBreadcrumb({
    title: "Novo Produto",
    backUrl: "/products",
    section: "Produtos",
    subsection: "Criar",
  });

  return <ProductCreateView />;
}
```

## Design Responsivo

### Ordem de Implementação

1. Mobile (padrão inicial)
2. Tablet (`md:`)
3. Desktop (`lg:`, `max-w-7xl`)

### Sidebar Fix

O sidebar tem 240px de largura. Toda div `fixed` com `left-0 right-0` deve compensar:

```tsx
// Correto
<div className="fixed bottom-0 left-0 right-0 md:ml-[240px]">

// Errado - sobrepõe o sidebar
<div className="fixed bottom-0 left-0 right-0">
```
