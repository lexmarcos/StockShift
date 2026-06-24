# Product Batches — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the standalone `/batches` listing with a product-scoped batch view at `/products/[id]/batches`, add a 4th action button to the product listing, and remove the standalone batch listing and create pages.

**Architecture:** New MVVM screen under `products/[id]/batches/` reuses `deriveBatchStatus` from `batches/batches.model`, `formatBatchDate` from `batches/[id]/batches-detail.model`, and `formatCentsToBRL` from `lib/currency`. Client-side sort only. The existing batch detail (`/batches/[id]`) and edit (`/batches/[id]/edit`) remain unchanged.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, SWR, ky, lucide-react, date-fns

## Global Constraints

- MVVM: `.model.ts` (logic), `.view.tsx` (pure JSX), `.types.ts` (interfaces), `page.tsx` (ViewModel)
- NO JSX in models. NO state/hooks/logic in views
- Types explicit everywhere. No `any`
- Functions: 4-20 lines. Files: under 500 lines
- Tests: Unit test `.model.ts` files ONLY (Vitest)
- Dark-only brutalism: bg `#0A0A0A`, surfaces `#171717`, borders `neutral-800`, 4px border radius, no shadows, no rounded-full, no animations
- Mobile First → Tablet (`md:`) → Desktop (`max-w-7xl`)
- Inject dependencies through constructor/parameter, not global/import
- Endpoints: Check `docs/endpoints/` before making API calls
- All `useSWR` and `ky.get/.post` calls inside hooks in `.model.ts`
- Early returns over nested ifs. Max 2 levels of indentation

---

### Task 1: Create `product-batches.types.ts`

**Files:**
- Create: `app/(pages)/products/[id]/batches/product-batches.types.ts`

**Interfaces:**
- Produces: `ProductBatch`, `SortKey`, `SortDirection`, `ProductBatchesViewProps`

- [ ] **Step 1: Write the types file**

```typescript
export interface ProductBatch {
  id: string;
  productName: string | null;
  batchCode: string | null;
  quantity: number;
  costPrice: number | null;
  sellingPrice: number | null;
  manufacturedDate: string | null;
  expirationDate: string | null;
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

- [ ] **Step 2: Verify file exists**

Run: `ls -la app/\(pages\)/products/\[id\]/batches/product-batches.types.ts`

- [ ] **Step 3: Commit**

```bash
git add app/\(pages\)/products/\[id\]/batches/product-batches.types.ts
git commit -m "feat(product-batches): add types for product-scoped batch listing"
```

---

### Task 2: Create `product-batches.model.ts` with tests

**Files:**
- Create: `app/(pages)/products/[id]/batches/product-batches.model.ts`
- Create: `app/(pages)/products/[id]/batches/product-batches.model.test.ts`

**Interfaces:**
- Consumes: `ProductBatch`, `SortKey`, `SortDirection` from Task 1 types
- Consumes: `deriveBatchStatus` from `@/app/(pages)/batches/batches.model`
- Consumes: `formatBatchDate` from `@/app/(pages)/batches/[id]/batches-detail.model`
- Consumes: `formatCentsToBRL` from `@/lib/currency`
- Consumes: `useSelectedWarehouse` from `@/hooks/use-selected-warehouse`
- Produces: `sortProductBatches(batches, key, direction) → ProductBatch[]`
- Produces: `useProductBatchesModel(productId: string) → ProductBatchesViewProps`

- [ ] **Step 1: Write the failing test for `sortProductBatches`**

Create `app/(pages)/products/[id]/batches/product-batches.model.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { sortProductBatches, useProductBatchesModel } from "./product-batches.model";
import type { ProductBatch } from "./product-batches.types";

const makeBatch = (overrides: Partial<ProductBatch> = {}): ProductBatch => ({
  id: "1",
  productName: "Test Product",
  batchCode: "B001",
  quantity: 10,
  costPrice: 1000,
  sellingPrice: 2000,
  manufacturedDate: "2026-01-01",
  expirationDate: "2026-12-31",
  ...overrides,
});

describe("sortProductBatches", () => {
  const batches: ProductBatch[] = [
    makeBatch({ id: "1", batchCode: "B001", quantity: 10, expirationDate: "2026-06-01" }),
    makeBatch({ id: "2", batchCode: "A002", quantity: 50, expirationDate: "2026-12-31" }),
    makeBatch({ id: "3", batchCode: "C003", quantity: 5,  expirationDate: "2025-01-01" }),
  ];

  it("sorts by quantity ascending", () => {
    const result = sortProductBatches(batches, "quantity", "asc");
    expect(result.map((b) => b.id)).toEqual(["3", "1", "2"]);
  });

  it("sorts by quantity descending", () => {
    const result = sortProductBatches(batches, "quantity", "desc");
    expect(result.map((b) => b.id)).toEqual(["2", "1", "3"]);
  });

  it("sorts by batchCode ascending", () => {
    const result = sortProductBatches(batches, "batchCode", "asc");
    expect(result.map((b) => b.id)).toEqual(["2", "1", "3"]);
  });

  it("sorts by batchCode descending", () => {
    const result = sortProductBatches(batches, "batchCode", "desc");
    expect(result.map((b) => b.id)).toEqual(["3", "1", "2"]);
  });

  it("sorts by expirationDate ascending (nulls last)", () => {
    const withNull = [
      ...batches,
      makeBatch({ id: "4", batchCode: "D004", expirationDate: null }),
    ];
    const result = sortProductBatches(withNull, "expirationDate", "asc");
    // "2025-01-01", "2026-06-01", "2026-12-31", null
    expect(result.map((b) => b.id)).toEqual(["3", "1", "2", "4"]);
  });

  it("sorts by expirationDate descending (nulls last)", () => {
    const withNull = [
      ...batches,
      makeBatch({ id: "4", batchCode: "D004", expirationDate: null }),
    ];
    const result = sortProductBatches(withNull, "expirationDate", "desc");
    // "2026-12-31", "2026-06-01", "2025-01-01", null
    expect(result.map((b) => b.id)).toEqual(["2", "1", "3", "4"]);
  });

  it("does not mutate the input array", () => {
    const original = [...batches];
    sortProductBatches(batches, "quantity", "asc");
    expect(batches.map((b) => b.id)).toEqual(original.map((b) => b.id));
  });

  it("handles null batchCode (sorts to end on asc, start on desc)", () => {
    const withNullCode = [
      makeBatch({ id: "1", batchCode: "B001" }),
      makeBatch({ id: "2", batchCode: null }),
      makeBatch({ id: "3", batchCode: "A001" }),
    ];
    const asc = sortProductBatches(withNullCode, "batchCode", "asc");
    expect(asc.map((b) => b.id)).toEqual(["3", "1", "2"]);

    const desc = sortProductBatches(withNullCode, "batchCode", "desc");
    expect(desc.map((b) => b.id)).toEqual(["2", "1", "3"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run --reporter=verbose app/\(pages\)/products/\[id\]/batches/product-batches.model.test.ts`
Expected: FAIL — `sortProductBatches is not a function` or similar

- [ ] **Step 3: Write the model file**

Create `app/(pages)/products/[id]/batches/product-batches.model.ts`:

```typescript
import { useMemo, useState } from "react";
import useSWR from "swr";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import { useBreadcrumb } from "@/components/breadcrumb";
import { deriveBatchStatus } from "@/app/(pages)/batches/batches.model";
import { formatBatchDate } from "@/app/(pages)/batches/[id]/batches-detail.model";
import { formatCentsToBRL } from "@/lib/currency";
import type {
  ProductBatch,
  SortKey,
  SortDirection,
} from "./product-batches.types";

interface BatchesResponse {
  success: boolean;
  data: ProductBatch[];
}

export const sortProductBatches = (
  batches: readonly ProductBatch[],
  key: SortKey,
  direction: SortDirection,
): ProductBatch[] => {
  const sorted = [...batches];
  const multiplier = direction === "asc" ? 1 : -1;

  sorted.sort((a, b) => {
    switch (key) {
      case "batchCode": {
        const aCode = a.batchCode ?? "";
        const bCode = b.batchCode ?? "";
        if (!aCode && !bCode) return 0;
        if (!aCode) return 1;
        if (!bCode) return -1;
        return multiplier * aCode.localeCompare(bCode);
      }
      case "quantity":
        return multiplier * (a.quantity - b.quantity);
      case "expirationDate": {
        const aTime = a.expirationDate ? new Date(a.expirationDate).getTime() : 0;
        const bTime = b.expirationDate ? new Date(b.expirationDate).getTime() : 0;
        if (!aTime && !bTime) return 0;
        if (!aTime) return 1;
        if (!bTime) return -1;
        return multiplier * (aTime - bTime);
      }
      default:
        return 0;
    }
  });

  return sorted;
};

export const useProductBatchesModel = (productId: string) => {
  const { warehouseId } = useSelectedWarehouse();

  const [sortKey, setSortKey] = useState<SortKey>("expirationDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const url = warehouseId
    ? `batches/warehouses/${warehouseId}/products/${productId}/batches`
    : null;

  const { data, error, isLoading } = useSWR<BatchesResponse>(
    url,
    async (requestUrl: string) => {
      const { api } = await import("@/lib/api");
      return await api.get(requestUrl).json<BatchesResponse>();
    },
    { revalidateOnFocus: false },
  );

  const rawBatches = data?.data ?? [];
  const productName = rawBatches.length > 0 ? rawBatches[0].productName ?? "" : "";

  const batches = useMemo(
    () => sortProductBatches(rawBatches, sortKey, sortDirection),
    [rawBatches, sortKey, sortDirection],
  );

  const onSortChange = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  };

  useBreadcrumb({
    title: "Lotes",
    backUrl: "/products",
  });

  return {
    batches,
    productName,
    isLoading,
    error: error ?? null,
    requiresWarehouse: !warehouseId,
    sortKey,
    sortDirection,
    onSortChange,
  };
};

export { deriveBatchStatus, formatBatchDate, formatCentsToBRL };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- --run --reporter=verbose app/\(pages\)/products/\[id\]/batches/product-batches.model.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add app/\(pages\)/products/\[id\]/batches/product-batches.model.ts \
        app/\(pages\)/products/\[id\]/batches/product-batches.model.test.ts
git commit -m "feat(product-batches): add model with sort and SWR fetch"
```

---

### Task 3: Create `product-batches.view.tsx`

**Files:**
- Create: `app/(pages)/products/[id]/batches/product-batches.view.tsx`

**Interfaces:**
- Consumes: `ProductBatch`, `SortKey`, `SortDirection`, `ProductBatchesViewProps` from Task 1 types
- Consumes: `deriveBatchStatus`, `formatBatchDate`, `formatCentsToBRL` re-exported from Task 2 model
- Consumes: `PageContainer`, `PageHeader` from `@/components/ui/`
- Consumes: `LoadingState`, `ErrorState` from `@/components/ui/`
- Consumes: `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow` from `@/components/ui/table`
- Consumes: `Button` from `@/components/ui/button`
- Consumes: `Badge` from `@/components/ui/badge`
- Consumes: `ArrowUp`, `ArrowDown`, `Eye`, `Layers`, `Package` from `lucide-react`
- Produces: `ProductBatchesView` component

- [ ] **Step 1: Write the view file**

Create `app/(pages)/products/[id]/batches/product-batches.view.tsx`:

```typescript
"use client";

import Link from "next/link";
import {
  ArrowUp,
  ArrowDown,
  Eye,
  Layers,
  Package,
  AlertTriangle,
} from "lucide-react";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  deriveBatchStatus,
  formatBatchDate,
  formatCentsToBRL,
} from "./product-batches.model";
import type {
  ProductBatch,
  ProductBatchesViewProps,
  SortKey,
} from "./product-batches.types";

const STATUS_COLORS: Record<string, string> = {
  expired: "border-rose-500/30 bg-rose-500/10 text-rose-400",
  expiring: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  low: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  ok: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
};

const STATUS_ICONS: Record<string, typeof Package> = {
  expired: AlertTriangle,
  expiring: AlertTriangle,
  low: Package,
  ok: Package,
};

const BatchStatusBadge = ({ batch }: { batch: ProductBatch }) => {
  const status = deriveBatchStatus(batch);
  const Icon = STATUS_ICONS[status.kind] ?? Package;
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-7 rounded-[4px] border px-2 text-[10px] font-bold uppercase tracking-wider",
        STATUS_COLORS[status.kind] ?? "border-neutral-800 text-neutral-400",
      )}
    >
      <Icon className="mr-1.5 size-3.5" />
      {status.label}
    </Badge>
  );
};

const SortIcon = ({
  column,
  sortKey,
  sortDirection,
}: {
  column: SortKey;
  sortKey: SortKey;
  sortDirection: "asc" | "desc";
}) => {
  if (column !== sortKey) return <div className="size-3 opacity-0" />;
  return sortDirection === "asc" ? (
    <ArrowUp className="ml-1 size-3 text-blue-500" />
  ) : (
    <ArrowDown className="ml-1 size-3 text-blue-500" />
  );
};

const SortableHead = ({
  column,
  label,
  sortKey,
  sortDirection,
  onSortChange,
}: {
  column: SortKey;
  label: string;
  sortKey: SortKey;
  sortDirection: "asc" | "desc";
  onSortChange: (key: SortKey) => void;
}) => (
  <TableHead
    className="h-10 cursor-pointer text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white"
    onClick={() => onSortChange(column)}
  >
    <div className="flex items-center gap-1">
      {label}
      <SortIcon column={column} sortKey={sortKey} sortDirection={sortDirection} />
    </div>
  </TableHead>
);

const DesktopTable = ({
  batches,
  sortKey,
  sortDirection,
  onSortChange,
}: {
  batches: ProductBatch[];
  sortKey: SortKey;
  sortDirection: "asc" | "desc";
  onSortChange: (key: SortKey) => void;
}) => (
  <div className="hidden overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717] md:block">
    <Table>
      <TableHeader className="bg-neutral-900">
        <TableRow className="border-b border-neutral-800 hover:bg-neutral-900">
          <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Lote
          </TableHead>
          <SortableHead
            column="quantity"
            label="Qtd"
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSortChange={onSortChange}
          />
          <TableHead className="h-10 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Preço Custo
          </TableHead>
          <TableHead className="h-10 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Preço Venda
          </TableHead>
          <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Fabricação
          </TableHead>
          <SortableHead
            column="expirationDate"
            label="Validade"
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSortChange={onSortChange}
          />
          <TableHead className="h-10 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Ações
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {batches.map((batch) => (
          <TableRow
            key={batch.id}
            className="group border-b border-neutral-800/50 transition-colors hover:bg-neutral-800/50"
          >
            <TableCell className="py-3 font-mono text-xs text-neutral-300">
              {batch.batchCode ?? "—"}
            </TableCell>
            <TableCell className="py-3 font-mono text-sm font-bold tabular-nums text-white">
              {batch.quantity}
            </TableCell>
            <TableCell className="py-3 text-right font-mono text-xs tabular-nums text-neutral-400">
              {formatCentsToBRL(batch.costPrice, "—")}
            </TableCell>
            <TableCell className="py-3 text-right font-mono text-xs tabular-nums text-neutral-400">
              {formatCentsToBRL(batch.sellingPrice, "—")}
            </TableCell>
            <TableCell className="py-3 text-xs text-neutral-400">
              {formatBatchDate(batch.manufacturedDate)}
            </TableCell>
            <TableCell className="py-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-neutral-300">
                  {formatBatchDate(batch.expirationDate)}
                </span>
                <BatchStatusBadge batch={batch} />
              </div>
            </TableCell>
            <TableCell className="py-3 text-right">
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="size-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white"
              >
                <Link href={`/batches/${batch.id}`}>
                  <Eye className="size-4" />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

const MobileCards = ({ batches }: { batches: ProductBatch[] }) => (
  <div className="grid gap-2 md:hidden">
    {batches.map((batch) => {
      const status = deriveBatchStatus(batch);
      return (
        <Link
          key={batch.id}
          href={`/batches/${batch.id}`}
          className="flex items-center justify-between rounded-[4px] border border-neutral-800 bg-[#171717] p-3 transition-colors hover:border-neutral-700"
        >
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-white truncate">
                {batch.batchCode ?? "—"}
              </span>
              <BatchStatusBadge batch={batch} />
            </div>
            <span className="text-xs text-neutral-400">
              {batch.quantity} un. • {formatCentsToBRL(batch.sellingPrice, "Sem preço")}
            </span>
            <span className="text-[11px] text-neutral-500">
              Validade: {formatBatchDate(batch.expirationDate)}
            </span>
          </div>
          <Eye className="size-4 shrink-0 text-neutral-600" />
        </Link>
      );
    })}
  </div>
);

export const ProductBatchesView = ({
  batches,
  productName,
  isLoading,
  error,
  requiresWarehouse,
  sortKey,
  sortDirection,
  onSortChange,
}: ProductBatchesViewProps) => {
  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState message="Carregando lotes..." />
      </PageContainer>
    );
  }

  if (requiresWarehouse) {
    return (
      <PageContainer>
        <ErrorState
          title="Selecione um armazém"
          description="É necessário selecionar um armazém para visualizar os lotes."
        />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorState
          title="Erro ao carregar lotes"
          description="Não foi possível carregar os lotes deste produto."
        />
      </PageContainer>
    );
  }

  if (batches.length === 0) {
    return (
      <PageContainer>
        <PageHeader
          title={productName || "Lotes"}
          subtitle="Lotes do produto"
        />
        <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-[4px] border border-dashed border-neutral-800 bg-[#171717]/30">
          <div className="flex size-16 items-center justify-center rounded-[4px] bg-neutral-900 ring-1 ring-neutral-800">
            <Layers className="size-6 text-neutral-600" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-300">
              Nenhum lote encontrado
            </h3>
            <p className="mt-1 max-w-xs text-xs text-neutral-500">
              Este produto não possui lotes neste armazém.
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={productName || "Lotes"}
        subtitle="Lotes do produto"
      />
      <DesktopTable
        batches={batches}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortChange={onSortChange}
      />
      <MobileCards batches={batches} />
    </PageContainer>
  );
};
```

- [ ] **Step 2: Verify view file exists**

Run: `ls -la app/\(pages\)/products/\[id\]/batches/product-batches.view.tsx`

- [ ] **Step 3: Commit**

```bash
git add app/\(pages\)/products/\[id\]/batches/product-batches.view.tsx
git commit -m "feat(product-batches): add view with table, mobile cards, and status badges"
```

---

### Task 4: Create page files

**Files:**
- Create: `app/(pages)/products/[id]/batches/page.tsx`
- Create: `app/(pages)/products/[id]/batches/page.client.tsx`

**Interfaces:**
- Consumes: `useProductBatchesModel` from Task 2 model
- Consumes: `ProductBatchesView` from Task 3 view
- Produces: Rendered page at `/products/[id]/batches`

- [ ] **Step 1: Write `page.tsx`**

```typescript
import type { Metadata } from "next";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Lotes do Produto | StockShift",
  description: "Consulte os lotes do produto no armazém selecionado.",
};

export default function Page() {
  return <PageClient />;
}
```

- [ ] **Step 2: Write `page.client.tsx`**

```typescript
"use client";

import { useParams } from "next/navigation";
import { useProductBatchesModel } from "./product-batches.model";
import { ProductBatchesView } from "./product-batches.view";

export function PageClient() {
  const params = useParams();
  const productId = params.id as string;
  const model = useProductBatchesModel(productId);

  return <ProductBatchesView {...model} />;
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(pages\)/products/\[id\]/batches/page.tsx \
        app/\(pages\)/products/\[id\]/batches/page.client.tsx
git commit -m "feat(product-batches): add page and client entry point"
```

---

### Task 5: Add 4th action button to products listing

**Files:**
- Modify: `app/(pages)/products/products.view.tsx:62-62` (add `Layers` to lucide import)
- Modify: `app/(pages)/products/products.view.tsx:928-969` (desktop `ProductTableActions`)
- Modify: `app/(pages)/products/products.view.tsx:1030-1083` (mobile `ProductActions` dropdown)

**Interfaces:**
- Consumes: `PermissionGate` already imported
- Consumes: `Link` from `next/link` already imported

- [ ] **Step 1: Add `Layers` to lucide-react import**

In `products.view.tsx`, find the lucide-react import block (around line 38-61) and add `Layers` to the destructured imports:

```typescript
import {
  Package,
  Loader2,
  Eye,
  Pencil,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
  Filter,
  ArrowUp,
  ArrowDown,
  BarChart3,
  XCircle,
  MoreHorizontal,
  SlidersHorizontal,
  CheckCircle2,
  TrendingDown,
  Power,
  PowerOff,
  LayoutList,
  ArrowDownUp,
  X,
  Layers,   // <-- ADD THIS
} from "lucide-react";
```

- [ ] **Step 2: Add 4th button to desktop `ProductTableActions`**

Find `ProductTableActions` (around line 928). Add the new button between the Edit button (closing `</PermissionGate>`) and the Delete button (opening `<PermissionGate permission="batches:delete">`):

```typescript
const ProductTableActions = ({
  product,
  onOpenDeleteDialog,
}: {
  product: Product;
  onOpenDeleteDialog: (product: Product) => void;
}) => (
  <div className="flex justify-end gap-1 transition-opacity">
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="size-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white"
    >
      <Link href={`/products/${product.id}`}>
        <Eye className="size-4" />
      </Link>
    </Button>
    <PermissionGate permission="products:update">
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="size-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white"
      >
        <Link href={`/products/${product.id}/edit`}>
          <Pencil className="size-4" />
        </Link>
      </Button>
    </PermissionGate>
    <PermissionGate permission="batches:read">
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="size-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white"
      >
        <Link href={`/products/${product.id}/batches`}>
          <Layers className="size-4" />
        </Link>
      </Button>
    </PermissionGate>
    <PermissionGate permission="batches:delete">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onOpenDeleteDialog(product)}
        className="size-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-rose-500"
      >
        <Trash2 className="size-4" />
      </Button>
    </PermissionGate>
  </div>
);
```

- [ ] **Step 3: Add 4th item to mobile `ProductActions` dropdown**

Find `ProductActions` (around line 1030). Add the new dropdown item between the "Editar" item and the "Remover do armazém" item:

```typescript
const ProductActions = ({
  product,
  onOpenDeleteDialog,
}: {
  product: Product;
  onOpenDeleteDialog: (product: Product) => void;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white"
      >
        <MoreHorizontal className="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="end"
      className="w-48 rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-200 shadow-xl"
    >
      <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
        Ações do Produto
      </DropdownMenuLabel>
      <DropdownMenuSeparator className="bg-neutral-800" />
      <DropdownMenuItem asChild>
        <Link
          href={`/products/${product.id}`}
          className="flex w-full cursor-pointer items-center focus:bg-neutral-800 focus:text-white"
        >
          <Eye className="mr-2 size-3.5" /> Detalhes
        </Link>
      </DropdownMenuItem>
      <PermissionGate permission="products:update">
        <DropdownMenuItem asChild>
          <Link
            href={`/products/${product.id}/edit`}
            className="flex w-full cursor-pointer items-center focus:bg-neutral-800 focus:text-white"
          >
            <Pencil className="mr-2 size-3.5" /> Editar
          </Link>
        </DropdownMenuItem>
      </PermissionGate>
      <PermissionGate permission="batches:read">
        <DropdownMenuItem asChild>
          <Link
            href={`/products/${product.id}/batches`}
            className="flex w-full cursor-pointer items-center focus:bg-neutral-800 focus:text-white"
          >
            <Layers className="mr-2 size-3.5" /> Lotes
          </Link>
        </DropdownMenuItem>
      </PermissionGate>
      <PermissionGate permission="batches:delete">
        <DropdownMenuItem
          onClick={() => onOpenDeleteDialog(product)}
          className="cursor-pointer text-rose-500 focus:bg-rose-950/20 focus:text-rose-400"
        >
          <Trash2 className="mr-2 size-3.5" /> Remover do armazém
        </DropdownMenuItem>
      </PermissionGate>
    </DropdownMenuContent>
  </DropdownMenu>
);
```

- [ ] **Step 4: Run existing view tests to check for regressions**

Run: `pnpm test -- --run --reporter=verbose app/\(pages\)/products/products.view.test.tsx`
Expected: All existing tests pass (may need to update test snapshots/assertions if they check button count)

- [ ] **Step 5: Commit**

```bash
git add app/\(pages\)/products/products.view.tsx
git commit -m "feat(products): add 4th action button 'Lotes' to product rows"
```

---

### Task 6: Remove batches listing page files

**Files:**
- Delete: `app/(pages)/batches/page.tsx`
- Delete: `app/(pages)/batches/page.client.tsx`
- Delete: `app/(pages)/batches/batches.view.tsx`
- Delete: `app/(pages)/batches/batches.view.test.tsx`

**Note:** `batches.model.ts` and `batches.types.ts` are KEPT — `deriveBatchStatus` is used by the new product-batches screen.

- [ ] **Step 1: Delete the files**

```bash
rm app/\(pages\)/batches/page.tsx
rm app/\(pages\)/batches/page.client.tsx
rm app/\(pages\)/batches/batches.view.tsx
rm app/\(pages\)/batches/batches.view.test.tsx
```

- [ ] **Step 2: Verify the directory still has the kept files**

Run: `ls app/\(pages\)/batches/`
Expected: `batches.model.ts`, `batches.model.test.ts`, `batches.types.ts`, `[id]/`, `create/` (create directory removed next)

- [ ] **Step 3: Commit**

```bash
git rm app/\(pages\)/batches/page.tsx \
       app/\(pages\)/batches/page.client.tsx \
       app/\(pages\)/batches/batches.view.tsx \
       app/\(pages\)/batches/batches.view.test.tsx
git commit -m "feat(batches): remove standalone batch listing page"
```

---

### Task 7: Remove batches create directory

**Files:**
- Delete: `app/(pages)/batches/create/` (entire directory)

- [ ] **Step 1: Delete the directory**

```bash
rm -rf app/\(pages\)/batches/create/
```

- [ ] **Step 2: Commit**

```bash
git rm -r app/\(pages\)/batches/create/
git commit -m "feat(batches): remove standalone batch create page"
```

---

### Task 8: Update sidebar navigation

**Files:**
- Modify: `components/layout/app-sidebar.tsx:30-79` (remove `/batches` from `navItems[]`)
- Modify: `components/layout/app-sidebar.test.tsx` (update test expectations)

**Interfaces:**
- Consumes: `navItems` array

- [ ] **Step 1: Remove `Layers` import and `/batches` nav item**

In `app-sidebar.tsx`:
- Remove `Layers` from the lucide-react import (line 7 — `Layers` is only used for the batches nav item)
- Remove the batches entry from `navItems[]` (lines 37-42):

```typescript
const navItems: NavItem[] = [
  {
    href: "/products",
    label: "Produtos",
    Icon: Package,
    requiredPermission: "products:read",
  },
  // REMOVED: /batches entry
  {
    href: "/sales",
    label: "Vendas",
    Icon: ShoppingCart,
    requiredPermission: "sales:read",
  },
  {
    href: "/stock-movements",
    label: "Movimentações",
    Icon: Activity,
    requiredPermission: "stock_movements:read",
  },
  {
    href: "/transfers",
    label: "Transferências",
    Icon: ArrowLeftRight,
    requiredPermission: "transfers:read",
  },
  {
    href: "/brands",
    label: "Marcas",
    Icon: Tag,
    requiredPermission: "brands:read",
  },
  {
    href: "/categories",
    label: "Categorias",
    Icon: Folder,
    requiredPermission: "categories:read",
  },
  {
    href: "/exploratory-tests",
    label: "Testes",
    Icon: ClipboardCheck,
    devOnly: true,
  },
];
```

- [ ] **Step 2: Update sidebar test**

Run: `pnpm test -- --run --reporter=verbose components/layout/app-sidebar.test.tsx`
Check which tests fail and update them. The test likely checks for `"Lotes"` text — remove or update those assertions.

If the test file reads something like:
```typescript
expect(screen.getByText("Lotes")).toBeInTheDocument();
```
Change it to:
```typescript
expect(screen.queryByText("Lotes")).not.toBeInTheDocument();
```

- [ ] **Step 3: Commit**

```bash
git add components/layout/app-sidebar.tsx components/layout/app-sidebar.test.tsx
git commit -m "feat(sidebar): remove 'Lotes' navigation item"
```

---

### Task 9: Update batch detail backUrl

**Files:**
- Modify: `app/(pages)/batches/[id]/batches-detail.model.ts:182-184`

- [ ] **Step 1: Change `backUrl` from `/batches` to `/products`**

In `batches-detail.model.ts`, find the `useBreadcrumb` call (around line 182):

```typescript
// Before:
useBreadcrumb({
  title: resolveBatchDetailTitle(batch, hasError, isLoading),
  backUrl: "/batches",
});

// After:
useBreadcrumb({
  title: resolveBatchDetailTitle(batch, hasError, isLoading),
  backUrl: "/products",
});
```

- [ ] **Step 2: Run batch detail model tests**

Run: `pnpm test -- --run --reporter=verbose app/\(pages\)/batches/\[id\]/batches-detail.model.test.ts`
Expected: All pass (backUrl change has no impact on pure function tests)

- [ ] **Step 3: Commit**

```bash
git add app/\(pages\)/batches/\[id\]/batches-detail.model.ts
git commit -m "fix(batches): point batch detail backUrl to /products"
```

---

### Task 10: Final verification

- [ ] **Step 1: Run all model tests**

```bash
pnpm test -- --run
```
Expected: All tests pass

- [ ] **Step 2: Run TypeScript type check**

```bash
npx tsc --noEmit
```
Expected: No type errors

- [ ] **Step 3: Verify no broken imports reference deleted files**

```bash
grep -r "batches/page\|batches/create\|batches/batches.view" app/ components/ hooks/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null
```
Expected: No results (no remaining references to deleted files)

- [ ] **Step 4: Commit if any fixes were needed, or confirm clean state**

```bash
git status
```
