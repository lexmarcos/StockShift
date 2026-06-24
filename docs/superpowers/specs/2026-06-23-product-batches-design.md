# Product Batches — Design Spec

**Date**: 2026-06-23
**Status**: Approved
**Context**: Replace standalone batch listing with a product-scoped batch view.

---

## Goal

Remove the standalone `/batches` listing screen and `/batches/create`. Instead, each product row in the product listing gains a "View Batches" action that navigates to `/products/[id]/batches` — a table of batches for that product in the currently selected warehouse. The existing batch detail screen (`/batches/[id]`) and its edit page (`/batches/[id]/edit`) remain unchanged.

## Routes

### Removed

| Route | Files |
|---|---|
| `/batches` (listing) | `page.tsx`, `page.client.tsx`, `batches.model.ts`, `batches.types.ts`, `batches.view.tsx`, plus all test files |
| `/batches/create` | Entire directory |

### Kept (unchanged)

| Route | Note |
|---|---|
| `/batches/[id]` | Detail — backUrl changed from `/batches` to `/products` |
| `/batches/[id]/edit` | Edit — no changes |

### Added

| Route | Description |
|---|---|
| `/products/[id]/batches` | Lists batches for the product in the current warehouse |

## Navigation

- **Sidebar**: Remove `{ href: "/batches", label: "Lotes", Icon: Layers }` from `navItems[]`.
- **Breadcrumb**: `Produtos > Nome do Produto > Lotes`. BackUrl set to `/products/[productId]`.

## Product Listing Changes

Add a 4th action button "View Batches" (icon: `Layers`) between Edit and Delete, gated by `PermissionGate permission="batches:read"`.

### Desktop (`ProductTableActions`)

```
[👁 Ver] [✏️ Editar] [📦 Lotes] [🗑 Remover]
```

Link: `<Link href={`/products/${product.id}/batches`}>`

### Mobile (`ProductActions` dropdown)

New item: `<Layers className="mr-2 size-3.5" /> Lotes`

## New Screen: `/products/[id]/batches`

### Architecture (MVVM)

```
app/(pages)/products/[id]/batches/
  page.tsx                  — Server component, metadata
  page.client.tsx           — Bridge: model → view
  product-batches.model.ts  — Hook + pure functions
  product-batches.types.ts  — Types
  product-batches.view.tsx  — Presentational view
  product-batches.model.test.ts
```

### Model (`product-batches.model.ts`)

**Hook**: `useProductBatchesModel(productId: string)`

1. Reads `warehouseId` from `useSelectedWarehouse()`
2. SWR fetches `batches/warehouses/${warehouseId}/products/${productId}/batches` (endpoint already exists — `GET /api/batches/warehouses/{warehouseId}/products/{productId}/batches`)
3. Local state: `sortKey` (enum: `"batchCode" | "quantity" | "expirationDate"`), `sortDirection` (`"asc" | "desc"`)
4. Client-side sort via `sortBatches(batches, key, direction)` — pure function
5. Reuses `deriveBatchStatus` from `@/app/(pages)/batches/batches.model` for status badges
6. Reuses `formatBatchDate` from `@/app/(pages)/batches/[id]/batches-detail.model` for date formatting
7. Sets breadcrumb: `useBreadcrumb({ title: "Lotes", backUrl: "/products" })`
8. Returns `requiresWarehouse: true` when no warehouse is selected

### Types (`product-batches.types.ts`)

```typescript
export interface ProductBatch {
  id: string;
  batchCode: string | null;
  quantity: number;
  costPrice: number | null;
  sellingPrice: number | null;
  manufacturedDate: string | null;
  expirationDate: string | null;
  createdAt: string;
}

export type SortKey = "batchCode" | "quantity" | "expirationDate";
export type SortDirection = "asc" | "desc";

export interface ProductBatchesViewProps {
  batches: ProductBatch[];
  productName: string;
  isLoading: boolean;
  error: Error | null;
  requiresWarehouse: boolean;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSortChange: (key: SortKey) => void;
}
```

### View (`product-batches.view.tsx`)

**States**:
- **Loading**: `<LoadingState message="Carregando lotes..." />`
- **Error**: `<ErrorState title="Erro ao carregar lotes" description="..." />`
- **No warehouse**: `<ErrorState title="Selecione um armazém" />`
- **Empty**: `<EmptyState>` — "Nenhum lote encontrado para este produto neste armazém"
- **Data**: Table (desktop) + Cards (mobile)

**Desktop Table** (`<Table>`):

| Column | Sortable | Content |
|---|---|---|
| Lote | — | `batchCode ?? "—"` |
| Qtd | ✅ | `quantity` |
| Preço Custo | — | `costPrice` as BRL |
| Preço Venda | — | `sellingPrice` as BRL |
| Fabricação | — | Formatted date |
| Validade | ✅ | Formatted date + `StatusBadge` |
| Ações | — | Eye icon link to `/batches/[id]` |

**Mobile Cards**:
Each card shows: batch code, status badge, quantity, selling price, expiration date. Entire card is tappable → navigates to `/batches/[id]`.

### Component Reuse

| Source | What |
|---|---|
| `batches/batches.model.ts` | `deriveBatchStatus()` |
| `batches/[id]/batches-detail.components.tsx` | `StatusBadge` |
| `batches/[id]/batches-detail.model.ts` | `formatBatchDate()` |

### API

**Endpoint**: `GET /api/batches/warehouses/{warehouseId}/products/{productId}/batches`
**Permission**: `batches:read`
**Response**: `{ success: boolean, data: ProductBatch[] }`

This endpoint already exists and is documented in `docs/endpoints/batches.md`.

## Batch Detail Back URL

In `batches/[id]/batches-detail.model.ts`, change:
```typescript
backUrl: "/batches"
// to
backUrl: "/products"
```

## Tests

- `product-batches.model.test.ts`: Unit tests for `sortBatches`, model hook (mock SWR, mock warehouse selection)
- Existing tests for `batches/[id]` and `batches/[id]/edit` must continue passing
- `products.view.test.tsx` needs update for the new 4th action button
- `app-sidebar.test.tsx` needs update for removed "Lotes" item

## Files to Delete

```
app/(pages)/batches/page.tsx
app/(pages)/batches/page.client.tsx
app/(pages)/batches/batches.view.tsx
app/(pages)/batches/batches.view.test.tsx
app/(pages)/batches/create/   (entire directory)
```

**Kept as shared modules**: `batches.model.ts` and `batches.types.ts` stay — `deriveBatchStatus` is used by both the batch detail page and the new product-batches screen. Their tests (`batches.model.test.ts`) also stay.

## Files to Create

```
app/(pages)/products/[id]/batches/page.tsx
app/(pages)/products/[id]/batches/page.client.tsx
app/(pages)/products/[id]/batches/product-batches.model.ts
app/(pages)/products/[id]/batches/product-batches.model.test.ts
app/(pages)/products/[id]/batches/product-batches.types.ts
app/(pages)/products/[id]/batches/product-batches.view.tsx
```

## Files to Modify

| File | Change |
|---|---|
| `products/products.view.tsx` | Add 4th action (desktop + mobile) |
| `products/products.types.ts` | No changes needed (props unchanged) |
| `components/layout/app-sidebar.tsx` | Remove `/batches` nav item |
| `batches/[id]/batches-detail.model.ts` | Change `backUrl` to `/products` |
