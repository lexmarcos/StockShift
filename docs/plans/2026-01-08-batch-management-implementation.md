# Batch Management Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a dedicated batches module with rich list + filters/alerts, batch detail, create, and edit flows.

**Architecture:** MVVM per route with SWR + ky in models, JSX-only views, and Zod schemas for forms. List view uses local filtering/sorting and computed status (expired/expiring/low/ok).

**Tech Stack:** Next.js 15, TypeScript, Tailwind, shadcn/ui, SWR, ky, react-hook-form, zod, lucide.

**Skill Refs:** @superpowers:test-driven-development, @frontend-design

---

## Task 1: List model helpers + types + tests

**Files:**
- Create: `app/batches/batches.types.ts`
- Create: `app/batches/batches.model.test.ts`
- Create: `app/batches/batches.model.ts`

**Step 1: Write the failing tests**

```ts
// app/batches/batches.model.test.ts
import { describe, it, expect } from "vitest";
import {
  deriveBatchStatus,
  filterBatches,
  sortBatches,
  Batch,
} from "./batches.model";

const baseBatch: Batch = {
  id: "b1",
  productId: "p1",
  productName: "Produto A",
  productSku: "SKU-A",
  warehouseId: "w1",
  warehouseName: "Central",
  warehouseCode: "WH-1",
  quantity: 12,
  batchNumber: "BATCH-001",
  expirationDate: "2026-01-20",
  costPrice: 10,
  sellingPrice: 18,
  notes: "",
  createdAt: "2026-01-01T10:00:00Z",
  updatedAt: "2026-01-01T10:00:00Z",
};

describe("batches model helpers", () => {
  it("marks expired when expiration is in the past", () => {
    const status = deriveBatchStatus(
      { ...baseBatch, expirationDate: "2020-01-01" },
      { today: new Date("2026-01-10"), lowStockThreshold: 10 }
    );
    expect(status.label).toBe("Expirado");
    expect(status.kind).toBe("expired");
  });

  it("marks expiring when expiration is within 30 days", () => {
    const inTenDays = "2026-01-20";
    const status = deriveBatchStatus(
      { ...baseBatch, expirationDate: inTenDays },
      { today: new Date("2026-01-10"), lowStockThreshold: 10 }
    );
    expect(status.kind).toBe("expiring");
  });

  it("filters by search and warehouse", () => {
    const batches: Batch[] = [
      baseBatch,
      { ...baseBatch, id: "b2", productName: "Produto B" },
    ];

    const filtered = filterBatches(batches, {
      searchQuery: "produto b",
      warehouseId: "w1",
      status: "all",
      lowStockThreshold: 10,
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("b2");
  });

  it("sorts by quantity desc", () => {
    const batches: Batch[] = [
      { ...baseBatch, id: "b1", quantity: 5 },
      { ...baseBatch, id: "b2", quantity: 20 },
    ];

    const sorted = sortBatches(batches, { key: "quantity", direction: "desc" });
    expect(sorted[0].id).toBe("b2");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- app/batches/batches.model.test.ts`
Expected: FAIL with "Cannot find module './batches.model'" or missing exports.

**Step 3: Write minimal implementation**

```ts
// app/batches/batches.types.ts
export interface Batch {
  id: string;
  productId: string;
  productName: string;
  productSku?: string | null;
  warehouseId: string;
  warehouseName: string;
  warehouseCode?: string | null;
  quantity: number;
  batchNumber?: string | null;
  batchCode?: string | null;
  expirationDate?: string | null;
  manufacturedDate?: string | null;
  costPrice?: number | null;
  sellingPrice?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BatchStatusKind = "expired" | "expiring" | "low" | "ok";

export interface BatchStatus {
  kind: BatchStatusKind;
  label: string;
  daysToExpire?: number | null;
}

export interface BatchFilters {
  searchQuery: string;
  warehouseId: string | "";
  status: "all" | BatchStatusKind;
  lowStockThreshold: number;
}

export interface SortConfig {
  key: "product" | "quantity" | "expiration" | "createdAt";
  direction: "asc" | "desc";
}

export interface BatchesResponse {
  success: boolean;
  message?: string | null;
  data: Batch[];
}
```

```ts
// app/batches/batches.model.ts
import { differenceInCalendarDays, parseISO, isValid } from "date-fns";
import type { Batch, BatchFilters, BatchStatus, SortConfig } from "./batches.types";

export type { Batch, BatchFilters, BatchStatus, SortConfig };

export const deriveBatchStatus = (
  batch: Batch,
  options: { today?: Date; lowStockThreshold?: number } = {}
): BatchStatus => {
  const today = options.today ?? new Date();
  const threshold = options.lowStockThreshold ?? 10;
  const quantity = batch.quantity ?? 0;
  const expirationDate = batch.expirationDate ? parseISO(batch.expirationDate) : null;
  const hasValidExpiration = expirationDate && isValid(expirationDate);

  if (hasValidExpiration) {
    const days = differenceInCalendarDays(expirationDate, today);
    if (days < 0) return { kind: "expired", label: "Expirado", daysToExpire: days };
    if (days <= 30) return { kind: "expiring", label: "Expirando", daysToExpire: days };
  }

  if (quantity <= threshold) return { kind: "low", label: "Baixo" };

  return { kind: "ok", label: "OK" };
};

export const filterBatches = (batches: Batch[], filters: BatchFilters) => {
  const query = filters.searchQuery.trim().toLowerCase();

  return batches.filter((batch) => {
    if (filters.warehouseId && batch.warehouseId !== filters.warehouseId) {
      return false;
    }

    if (query) {
      const haystack = [
        batch.productName,
        batch.productSku,
        batch.batchNumber,
        batch.batchCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(query)) {
        return false;
      }
    }

    if (filters.status !== "all") {
      const status = deriveBatchStatus(batch, {
        lowStockThreshold: filters.lowStockThreshold,
      });
      return status.kind === filters.status;
    }

    return true;
  });
};

export const sortBatches = (batches: Batch[], sort: SortConfig) => {
  const sorted = [...batches];
  sorted.sort((a, b) => {
    const direction = sort.direction === "asc" ? 1 : -1;

    switch (sort.key) {
      case "product":
        return direction * a.productName.localeCompare(b.productName);
      case "quantity":
        return direction * (a.quantity - b.quantity);
      case "expiration": {
        const aDate = a.expirationDate ? parseISO(a.expirationDate) : null;
        const bDate = b.expirationDate ? parseISO(b.expirationDate) : null;
        const aTime = aDate && isValid(aDate) ? aDate.getTime() : 0;
        const bTime = bDate && isValid(bDate) ? bDate.getTime() : 0;
        return direction * (aTime - bTime);
      }
      case "createdAt":
        return direction * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      default:
        return 0;
    }
  });
  return sorted;
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- app/batches/batches.model.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/batches/batches.types.ts app/batches/batches.model.ts app/batches/batches.model.test.ts
git commit -m "test: add batch list model helpers"
```

---

## Task 2: List model hook + view + page + smoke test

**Files:**
- Modify: `app/batches/batches.model.ts`
- Create: `app/batches/batches.view.tsx`
- Create: `app/batches/page.tsx`
- Create: `app/batches/batches.view.test.tsx`

**Step 1: Write the failing test**

```tsx
// app/batches/batches.view.test.tsx
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BatchesView } from "./batches.view";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

const baseProps = {
  batches: [],
  isLoading: false,
  error: null,
  filters: {
    searchQuery: "",
    warehouseId: "",
    status: "all" as const,
    lowStockThreshold: 10,
  },
  sortConfig: { key: "createdAt", direction: "desc" as const },
  warehouses: [],
  statusCounts: { expired: 0, expiring: 0, low: 0 },
  setSearchQuery: vi.fn(),
  setWarehouseId: vi.fn(),
  setStatus: vi.fn(),
  setSortConfig: vi.fn(),
  onClearFilters: vi.fn(),
};

describe("BatchesView", () => {
  it("shows empty state when no batches", () => {
    render(<BatchesView {...baseProps} />);
    expect(screen.getByText(/nenhum batch encontrado/i)).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- app/batches/batches.view.test.tsx`
Expected: FAIL with "Cannot find module './batches.view'".

**Step 3: Write minimal implementation**

```ts
// app/batches/batches.model.ts (append)
import { useMemo, useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import type { BatchesResponse } from "./batches.types";
import type { Warehouse } from "../warehouses/warehouses.types";

export const useBatchesModel = () => {
  const [filters, setFilters] = useState({
    searchQuery: "",
    warehouseId: "",
    status: "all" as const,
    lowStockThreshold: 10,
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "createdAt",
    direction: "desc",
  });

  const { data, error, isLoading, mutate } = useSWR<BatchesResponse>(
    "batches",
    async () => await api.get("batches").json<BatchesResponse>()
  );

  const { data: warehouseData } = useSWR<{ success: boolean; data: Warehouse[] }>(
    "warehouses",
    async () => await api.get("warehouses").json()
  );

  const rawBatches = data?.data || [];
  const filtered = useMemo(
    () => filterBatches(rawBatches, filters),
    [rawBatches, filters]
  );

  const sorted = useMemo(
    () => sortBatches(filtered, sortConfig),
    [filtered, sortConfig]
  );

  const statusCounts = useMemo(() => {
    return rawBatches.reduce(
      (acc, batch) => {
        const status = deriveBatchStatus(batch, {
          lowStockThreshold: filters.lowStockThreshold,
        });
        if (status.kind === "expired") acc.expired += 1;
        if (status.kind === "expiring") acc.expiring += 1;
        if (status.kind === "low") acc.low += 1;
        return acc;
      },
      { expired: 0, expiring: 0, low: 0 }
    );
  }, [rawBatches]);

  return {
    batches: sorted,
    isLoading,
    error,
    filters,
    sortConfig,
    warehouses: warehouseData?.data || [],
    statusCounts,
    setSearchQuery: (searchQuery: string) =>
      setFilters((prev) => ({ ...prev, searchQuery })),
    setWarehouseId: (warehouseId: string) =>
      setFilters((prev) => ({ ...prev, warehouseId })),
    setStatus: (status: BatchFilters["status"]) =>
      setFilters((prev) => ({ ...prev, status })),
    setSortConfig,
    onClearFilters: () =>
      setFilters((prev) => ({ ...prev, searchQuery: "", warehouseId: "", status: "all" })),
    refresh: mutate,
  };
};
```

```tsx
// app/batches/batches.view.tsx
"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Calendar,
  Package,
  Plus,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Batch, BatchFilters, SortConfig } from "./batches.types";
import { deriveBatchStatus } from "./batches.model";
import type { Warehouse } from "../warehouses/warehouses.types";

interface BatchesViewProps {
  batches: Batch[];
  isLoading: boolean;
  error: any;
  filters: BatchFilters;
  sortConfig: SortConfig;
  warehouses: Warehouse[];
  statusCounts: { expired: number; expiring: number; low: number };
  setSearchQuery: (value: string) => void;
  setWarehouseId: (value: string) => void;
  setStatus: (value: BatchFilters["status"]) => void;
  setSortConfig: (value: SortConfig) => void;
  onClearFilters: () => void;
}

const statusStyles: Record<string, string> = {
  expired: "border-border/60 bg-muted/30 text-foreground",
  expiring: "border-border/50 bg-muted/20 text-foreground",
  low: "border-border/50 bg-muted/10 text-foreground",
  ok: "border-border/30 bg-transparent text-foreground/80",
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  try {
    return format(new Date(value), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return value;
  }
};

export const BatchesView = ({
  batches,
  isLoading,
  error,
  filters,
  sortConfig,
  warehouses,
  statusCounts,
  setSearchQuery,
  setWarehouseId,
  setStatus,
  setSortConfig,
  onClearFilters,
}: BatchesViewProps) => {
  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-20 border-b border-border/40 bg-card">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
          <div>
            <h1 className="text-base font-semibold uppercase tracking-wide">Batches</h1>
            <p className="text-xs text-muted-foreground hidden md:block mt-0.5">
              Controle de lotes e validade
            </p>
          </div>
          <Link href="/batches/create">
            <Button className="rounded-sm bg-foreground text-background hover:bg-foreground/90">
              <Plus className="mr-2 h-3.5 w-3.5" />
              Novo Batch
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <Card className="border border-border/50 bg-card/80 rounded-sm">
          <CardHeader className="border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-foreground/5 border border-border/30">
                <Package className="h-4 w-4 text-foreground/70" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                  Lista de Batches
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {batches.length} {batches.length === 1 ? "batch" : "batches"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  placeholder="Buscar por produto, SKU ou batch..."
                  value={filters.searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-9 h-9 rounded-sm border-border/40 text-xs bg-background"
                />
              </div>

              <Select
                value={filters.warehouseId}
                onValueChange={(value) => setWarehouseId(value === "all" ? "" : value)}
              >
                <SelectTrigger className="h-9 rounded-sm border-border/40 text-xs">
                  <SelectValue placeholder="Warehouse" />
                </SelectTrigger>
                <SelectContent className="rounded-sm">
                  <SelectItem value="all" className="text-xs">Todos</SelectItem>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id} className="text-xs">
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.status}
                onValueChange={(value) => setStatus(value as BatchFilters["status"])}
              >
                <SelectTrigger className="h-9 rounded-sm border-border/40 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-sm">
                  <SelectItem value="all" className="text-xs">Todos</SelectItem>
                  <SelectItem value="expired" className="text-xs">Expirado</SelectItem>
                  <SelectItem value="expiring" className="text-xs">Expirando</SelectItem>
                  <SelectItem value="low" className="text-xs">Baixo Estoque</SelectItem>
                  <SelectItem value="ok" className="text-xs">OK</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={`${sortConfig.key}-${sortConfig.direction}`}
                onValueChange={(value) => {
                  const [key, direction] = value.split("-") as [
                    SortConfig["key"],
                    SortConfig["direction"]
                  ];
                  setSortConfig({ key, direction });
                }}
              >
                <SelectTrigger className="h-9 rounded-sm border-border/40 text-xs">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent className="rounded-sm">
                  <SelectItem value="createdAt-desc" className="text-xs">Mais recentes</SelectItem>
                  <SelectItem value="createdAt-asc" className="text-xs">Mais antigos</SelectItem>
                  <SelectItem value="expiration-asc" className="text-xs">Validade (asc)</SelectItem>
                  <SelectItem value="expiration-desc" className="text-xs">Validade (desc)</SelectItem>
                  <SelectItem value="quantity-desc" className="text-xs">Quantidade (alta)</SelectItem>
                  <SelectItem value="quantity-asc" className="text-xs">Quantidade (baixa)</SelectItem>
                  <SelectItem value="product-asc" className="text-xs">Produto (A-Z)</SelectItem>
                  <SelectItem value="product-desc" className="text-xs">Produto (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-sm border-border/40 text-xs">
                <Calendar className="mr-1 h-3 w-3" />
                Expirados: {statusCounts.expired}
              </Badge>
              <Badge variant="outline" className="rounded-sm border-border/40 text-xs">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Expirando (30d): {statusCounts.expiring}
              </Badge>
              <Badge variant="outline" className="rounded-sm border-border/40 text-xs">
                <Package className="mr-1 h-3 w-3" />
                Baixo estoque: {statusCounts.low}
              </Badge>
              {(filters.searchQuery || filters.warehouseId || filters.status !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-sm border-border/40 text-xs"
                  onClick={onClearFilters}
                >
                  Limpar filtros
                </Button>
              )}
            </div>

            {isLoading && (
              <div className="py-10 text-center text-xs text-muted-foreground">
                Carregando batches...
              </div>
            )}

            {error && (
              <div className="py-10 text-center text-xs text-muted-foreground">
                Erro ao carregar batches
              </div>
            )}

            {!isLoading && !error && batches.length === 0 && (
              <div className="py-10 text-center text-xs text-muted-foreground">
                Nenhum batch encontrado
              </div>
            )}

            {!isLoading && !error && batches.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Produto</TableHead>
                      <TableHead className="text-xs">Batch</TableHead>
                      <TableHead className="text-xs">Warehouse</TableHead>
                      <TableHead className="text-xs">Quantidade</TableHead>
                      <TableHead className="text-xs">Validade</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((batch) => {
                      const status = deriveBatchStatus(batch, {
                        lowStockThreshold: filters.lowStockThreshold,
                      });
                      return (
                        <TableRow key={batch.id}>
                          <TableCell className="text-xs">
                            <div className="font-semibold">{batch.productName}</div>
                            <div className="text-muted-foreground">{batch.productSku || "-"}</div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {batch.batchNumber || batch.batchCode || "-"}
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="font-semibold">{batch.warehouseName}</div>
                            <div className="text-muted-foreground">{batch.warehouseCode || "-"}</div>
                          </TableCell>
                          <TableCell className="text-xs">{batch.quantity}</TableCell>
                          <TableCell className="text-xs">{formatDate(batch.expirationDate)}</TableCell>
                          <TableCell className="text-xs">
                            <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] uppercase ${statusStyles[status.kind]}`}>
                              {status.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-right">
                            <Link href={`/batches/${batch.id}`} className="text-foreground/80 hover:text-foreground">
                              Ver
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
```

```tsx
// app/batches/page.tsx
"use client";

import { useBatchesModel } from "./batches.model";
import { BatchesView } from "./batches.view";

export default function BatchesPage() {
  const model = useBatchesModel();
  return <BatchesView {...model} />;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- app/batches/batches.view.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add app/batches/batches.model.ts app/batches/batches.view.tsx app/batches/page.tsx app/batches/batches.view.test.tsx
git commit -m "feat: add batches list"
```

---

## Task 3: Batch detail (model + view + page)

**Files:**
- Create: `app/batches/[id]/batches-detail.types.ts`
- Create: `app/batches/[id]/batches-detail.model.ts`
- Create: `app/batches/[id]/batches-detail.view.tsx`
- Create: `app/batches/[id]/page.tsx`
- Create: `app/batches/[id]/batches-detail.view.test.tsx`

**Step 1: Write the failing test**

```tsx
// app/batches/[id]/batches-detail.view.test.tsx
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BatchesDetailView } from "./batches-detail.view";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

const baseBatch = {
  id: "b1",
  productId: "p1",
  productName: "Produto",
  productSku: "SKU",
  warehouseId: "w1",
  warehouseName: "Central",
  warehouseCode: "WH-1",
  quantity: 5,
  batchNumber: "BATCH-001",
  expirationDate: "2026-02-01",
  costPrice: 10,
  notes: "",
  createdAt: "2026-01-01T10:00:00Z",
  updatedAt: "2026-01-01T10:00:00Z",
};

describe("BatchesDetailView", () => {
  it("shows batch header", () => {
    render(
        <BatchesDetailView
        batch={baseBatch as any}
        isLoading={false}
        error={null}
        isDeleting={false}
        isDeleteOpen={false}
        onDeleteOpenChange={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText(/BATCH-001/i)).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- app/batches/[id]/batches-detail.view.test.tsx`
Expected: FAIL with "Cannot find module './batches-detail.view'".

**Step 3: Write minimal implementation**

```ts
// app/batches/[id]/batches-detail.types.ts
import type { Batch } from "../batches.types";

export interface BatchDetailResponse {
  success: boolean;
  message?: string | null;
  data: Batch;
}
```

```ts
// app/batches/[id]/batches-detail.model.ts
import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { BatchDetailResponse } from "./batches-detail.types";

export const useBatchDetailModel = (batchId: string) => {
  const router = useRouter();
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { data, error, isLoading, mutate } = useSWR<BatchDetailResponse>(
    batchId ? `batches/${batchId}` : null,
    async (url) => await api.get(url).json<BatchDetailResponse>()
  );

  const batch = data?.data ?? null;

  const onDelete = async () => {
    if (!batchId) return;
    setIsDeleting(true);
    try {
      await api.delete(`batches/${batchId}`).json();
      toast.success("Batch removido com sucesso");
      router.push("/batches");
      setDeleteOpen(false);
    } catch (err: any) {
      const message = err?.message || "Erro ao remover batch";
      toast.error(message);
    } finally {
      setIsDeleting(false);
      mutate();
    }
  };

  return {
    batch,
    isLoading,
    error,
    onDelete,
    isDeleting,
    isDeleteOpen,
    onDeleteOpenChange: setDeleteOpen,
  };
};
```

```tsx
// app/batches/[id]/batches-detail.view.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Batch } from "../batches.types";

interface BatchesDetailViewProps {
  batch: Batch | null;
  isLoading: boolean;
  error: any;
  isDeleteOpen: boolean;
  onDeleteOpenChange: (open: boolean) => void;
  isDeleting: boolean;
  onDelete: () => void;
}

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  try {
    return format(new Date(value), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return value;
  }
};

export const BatchesDetailView = ({
  batch,
  isLoading,
  error,
  isDeleteOpen,
  onDeleteOpenChange,
  isDeleting,
  onDelete,
}: BatchesDetailViewProps) => {
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 border-b border-border/40 bg-card">
          <div className="mx-auto flex h-14 w-full max-w-7xl items-center px-4 md:px-6 lg:px-8">
            <Link
              href="/batches"
              className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-muted/50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-10 text-xs text-muted-foreground">
          Carregando batch...
        </main>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 border-b border-border/40 bg-card">
          <div className="mx-auto flex h-14 w-full max-w-7xl items-center px-4 md:px-6 lg:px-8">
            <Link
              href="/batches"
              className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-muted/50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-10 text-xs text-muted-foreground">
          Batch não encontrado
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-20 border-b border-border/40 bg-card">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/batches"
              className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-muted/50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
            <div className="border-l border-border/40 pl-3">
              <h1 className="text-base font-semibold uppercase tracking-wide">
                {batch.batchNumber || batch.batchCode || "Batch"}
              </h1>
              <p className="text-xs text-muted-foreground hidden md:block">
                {batch.productName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/batches/${batch.id}/edit`}>
              <Button variant="outline" size="sm" className="rounded-sm border-border/40">
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Editar
              </Button>
            </Link>
            <AlertDialog open={isDeleteOpen} onOpenChange={onDeleteOpenChange}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-sm border-border/40">
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-sm">
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir batch?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação é irreversível. Se houver estoque, prefira ajustar via movimentações.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-sm">Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="rounded-sm"
                    onClick={onDelete}
                    disabled={isDeleting}
                  >
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border border-border/50 bg-card/80 rounded-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide">Produto</CardTitle>
              <CardDescription className="text-xs">Dados do item</CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nome</span>
                <span>{batch.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SKU</span>
                <span>{batch.productSku || "-"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 bg-card/80 rounded-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide">Warehouse</CardTitle>
              <CardDescription className="text-xs">Local de estoque</CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nome</span>
                <span>{batch.warehouseName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Código</span>
                <span>{batch.warehouseCode || "-"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card className="border border-border/50 bg-card/80 rounded-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide">Estoque</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantidade</span>
                <span>{batch.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Custo</span>
                <span>{batch.costPrice ? `R$ ${batch.costPrice}` : "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Venda</span>
                <span>{batch.sellingPrice ? `R$ ${batch.sellingPrice}` : "-"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 bg-card/80 rounded-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide">Datas</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fabricação</span>
                <span>{formatDate(batch.manufacturedDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Validade</span>
                <span>{formatDate(batch.expirationDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em</span>
                <span>{formatDate(batch.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};
```

```tsx
// app/batches/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useBatchDetailModel } from "./batches-detail.model";
import { BatchesDetailView } from "./batches-detail.view";

export default function BatchDetailPage() {
  const params = useParams();
  const batchId = params.id as string;
  const {
    batch,
    isLoading,
    error,
    onDelete,
    isDeleting,
    isDeleteOpen,
    onDeleteOpenChange,
  } = useBatchDetailModel(batchId);

  return (
    <BatchesDetailView
      batch={batch}
      isLoading={isLoading}
      error={error}
      onDelete={onDelete}
      isDeleting={isDeleting}
      isDeleteOpen={isDeleteOpen}
      onDeleteOpenChange={onDeleteOpenChange}
    />
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- app/batches/[id]/batches-detail.view.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add app/batches/[id]/batches-detail.types.ts app/batches/[id]/batches-detail.model.ts app/batches/[id]/batches-detail.view.tsx app/batches/[id]/page.tsx app/batches/[id]/batches-detail.view.test.tsx
git commit -m "feat: add batch detail page"
```

---

## Task 4: Batch create form

**Files:**
- Create: `app/batches/create/batches-create.types.ts`
- Create: `app/batches/create/batches-create.schema.ts`
- Create: `app/batches/create/batches-create.model.ts`
- Create: `app/batches/create/batches-create.view.tsx`
- Create: `app/batches/create/page.tsx`
- Create: `app/batches/create/batches-create.model.test.ts`

**Step 1: Write the failing test**

```ts
// app/batches/create/batches-create.model.test.ts
import { describe, it, expect } from "vitest";
import { buildBatchPayload } from "./batches-create.model";

const formData = {
  productId: "p1",
  warehouseId: "w1",
  quantity: 10,
  batchCode: "B-01",
  manufacturedDate: "2026-01-01",
  expirationDate: "2026-12-31",
  costPrice: 10,
  sellingPrice: 18,
  notes: "Ok",
};

describe("buildBatchPayload", () => {
  it("maps optional fields and trims empty strings", () => {
    const payload = buildBatchPayload({
      ...formData,
      batchCode: " ",
      notes: " ",
    } as any);
    expect(payload.batchCode).toBeUndefined();
    expect(payload.notes).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- app/batches/create/batches-create.model.test.ts`
Expected: FAIL with missing module or export.

**Step 3: Write minimal implementation**

```ts
// app/batches/create/batches-create.types.ts
export interface BatchCreateFormData {
  productId: string;
  warehouseId: string;
  quantity: number;
  batchCode?: string;
  manufacturedDate?: string;
  expirationDate?: string;
  costPrice?: number;
  sellingPrice?: number;
  notes?: string;
}

export interface BatchCreateResponse {
  success: boolean;
  message?: string | null;
  data: { id: string };
}
```

```ts
// app/batches/create/batches-create.schema.ts
import { z } from "zod";

export const batchCreateSchema = z
  .object({
    productId: z.string().min(1, "Selecione um produto"),
    warehouseId: z.string().min(1, "Selecione um warehouse"),
    quantity: z.coerce.number().int().nonnegative("Quantidade inválida"),
    batchCode: z.string().optional(),
    manufacturedDate: z.string().optional(),
    expirationDate: z.string().optional(),
    costPrice: z.coerce.number().optional(),
    sellingPrice: z.coerce.number().optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.manufacturedDate && data.expirationDate) {
      if (data.expirationDate < data.manufacturedDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["expirationDate"],
          message: "Validade deve ser após fabricação",
        });
      }
    }
  });

export type BatchCreateFormData = z.infer<typeof batchCreateSchema>;
```

```ts
// app/batches/create/batches-create.model.ts
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { batchCreateSchema, BatchCreateFormData } from "./batches-create.schema";
import type { BatchCreateResponse } from "./batches-create.types";

interface ProductsResponse {
  success: boolean;
  data: Array<{ id: string; name: string; sku?: string | null; hasExpiration: boolean }>;
}

interface WarehousesResponse {
  success: boolean;
  data: Array<{ id: string; name: string }>;
}

export const buildBatchPayload = (data: BatchCreateFormData) => ({
  productId: data.productId,
  warehouseId: data.warehouseId,
  quantity: data.quantity,
  batchCode: data.batchCode?.trim() || undefined,
  manufacturedDate: data.manufacturedDate || undefined,
  expirationDate: data.expirationDate || undefined,
  costPrice: data.costPrice,
  sellingPrice: data.sellingPrice,
  notes: data.notes?.trim() || undefined,
});

export const useBatchCreateModel = () => {
  const router = useRouter();

  const form = useForm<BatchCreateFormData>({
    resolver: zodResolver(batchCreateSchema),
    defaultValues: {
      productId: "",
      warehouseId: "",
      quantity: 0,
      batchCode: "",
      manufacturedDate: "",
      expirationDate: "",
      costPrice: undefined,
      sellingPrice: undefined,
      notes: "",
    },
  });

  const { data: productsData } = useSWR<ProductsResponse>(
    "products",
    async () => await api.get("products").json<ProductsResponse>()
  );

  const { data: warehousesData } = useSWR<WarehousesResponse>(
    "warehouses",
    async () => await api.get("warehouses").json<WarehousesResponse>()
  );

  const selectedProduct = productsData?.data.find(
    (product) => product.id === form.watch("productId")
  );

  const onSubmit = async (data: BatchCreateFormData) => {
    if (selectedProduct?.hasExpiration && !data.expirationDate) {
      form.setError("expirationDate", {
        message: "Validade obrigatória para este produto",
      });
      return;
    }

    try {
      const payload = buildBatchPayload(data);
      const response = await api
        .post("batches", { json: payload })
        .json<BatchCreateResponse>();

      if (response.success) {
        toast.success("Batch criado com sucesso");
        router.push(`/batches/${response.data.id}`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao criar batch");
    }
  };

  return {
    form,
    onSubmit,
    products: productsData?.data || [],
    warehouses: warehousesData?.data || [],
    selectedProduct,
  };
};
```

```tsx
// app/batches/create/batches-create.view.tsx
"use client";

import Link from "next/link";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, PackagePlus } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { BatchCreateFormData } from "./batches-create.schema";

interface BatchCreateViewProps {
  form: UseFormReturn<BatchCreateFormData>;
  onSubmit: (data: BatchCreateFormData) => void;
  products: Array<{ id: string; name: string; sku?: string | null; hasExpiration: boolean }>;
  warehouses: Array<{ id: string; name: string }>;
  selectedProduct?: { hasExpiration: boolean } | undefined;
}

export const BatchCreateView = ({ form, onSubmit, products, warehouses, selectedProduct }: BatchCreateViewProps) => {
  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-20 border-b border-border/40 bg-card">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 md:px-6 lg:px-8">
          <Link
            href="/batches"
            className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-muted/50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
          <div className="border-l border-border/40 pl-3">
            <h1 className="text-base font-semibold uppercase tracking-wide">Novo Batch</h1>
            <p className="text-xs text-muted-foreground hidden md:block">Entrada de estoque</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="border border-border/50 bg-card/80 rounded-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">Identificação</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Produto *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-9 rounded-sm border-border/40 text-xs">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="rounded-sm">
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id} className="text-xs">
                              {product.name} {product.sku ? `(${product.sku})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="warehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Warehouse *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-9 rounded-sm border-border/40 text-xs">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="rounded-sm">
                          {warehouses.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id} className="text-xs">
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="batchCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Código do Batch</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-9 rounded-sm border-border/40 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border border-border/50 bg-card/80 rounded-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">Estoque</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Quantidade *</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="h-9 rounded-sm border-border/40 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Custo</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} className="h-9 rounded-sm border-border/40 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sellingPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Venda</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} className="h-9 rounded-sm border-border/40 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border border-border/50 bg-card/80 rounded-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">Datas</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="manufacturedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Fabricação</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="h-9 rounded-sm border-border/40 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expirationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">
                        Validade{selectedProduct?.hasExpiration ? " *" : ""}
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="h-9 rounded-sm border-border/40 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border border-border/50 bg-card/80 rounded-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea {...field} className="min-h-[80px] rounded-sm border-border/40 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" className="rounded-sm bg-foreground text-background">
                <PackagePlus className="mr-2 h-3.5 w-3.5" />
                Salvar
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
};
```

```tsx
// app/batches/create/page.tsx
"use client";

import { useBatchCreateModel } from "./batches-create.model";
import { BatchCreateView } from "./batches-create.view";

export default function BatchCreatePage() {
  const model = useBatchCreateModel();
  return <BatchCreateView {...model} />;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- app/batches/create/batches-create.model.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/batches/create

git commit -m "feat: add batch create page"
```

---

## Task 5: Batch edit form

**Files:**
- Create: `app/batches/[id]/edit/batches-edit.types.ts`
- Create: `app/batches/[id]/edit/batches-edit.schema.ts`
- Create: `app/batches/[id]/edit/batches-edit.model.ts`
- Create: `app/batches/[id]/edit/batches-edit.view.tsx`
- Create: `app/batches/[id]/edit/page.tsx`
- Create: `app/batches/[id]/edit/batches-edit.model.test.ts`

**Step 1: Write the failing test**

```ts
// app/batches/[id]/edit/batches-edit.model.test.ts
import { describe, it, expect } from "vitest";
import { mapBatchToFormValues } from "./batches-edit.model";

const batch = {
  id: "b1",
  productId: "p1",
  warehouseId: "w1",
  quantity: 12,
  batchNumber: "B-01",
  expirationDate: "2026-12-31",
  costPrice: 10,
  sellingPrice: 18,
  notes: "Ok",
};

describe("mapBatchToFormValues", () => {
  it("maps api batch to form defaults", () => {
    const values = mapBatchToFormValues(batch as any);
    expect(values.productId).toBe("p1");
    expect(values.quantity).toBe(12);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- app/batches/[id]/edit/batches-edit.model.test.ts`
Expected: FAIL with missing module or export.

**Step 3: Write minimal implementation**

```ts
// app/batches/[id]/edit/batches-edit.types.ts
import type { Batch } from "../../batches.types";

export interface BatchEditResponse {
  success: boolean;
  message?: string | null;
  data: Batch;
}
```

```ts
// app/batches/[id]/edit/batches-edit.schema.ts
import { z } from "zod";

export const batchEditSchema = z
  .object({
    productId: z.string().min(1),
    warehouseId: z.string().min(1),
    quantity: z.coerce.number().int().nonnegative(),
    batchCode: z.string().optional(),
    manufacturedDate: z.string().optional(),
    expirationDate: z.string().optional(),
    costPrice: z.coerce.number().optional(),
    sellingPrice: z.coerce.number().optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.manufacturedDate && data.expirationDate) {
      if (data.expirationDate < data.manufacturedDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["expirationDate"],
          message: "Validade deve ser após fabricação",
        });
      }
    }
  });

export type BatchEditFormData = z.infer<typeof batchEditSchema>;
```

```ts
// app/batches/[id]/edit/batches-edit.model.ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { batchEditSchema, BatchEditFormData } from "./batches-edit.schema";
import type { BatchEditResponse } from "./batches-edit.types";
import type { Batch } from "../../batches.types";

export const mapBatchToFormValues = (batch: Batch): BatchEditFormData => ({
  productId: batch.productId,
  warehouseId: batch.warehouseId,
  quantity: batch.quantity ?? 0,
  batchCode: batch.batchNumber || batch.batchCode || "",
  manufacturedDate: batch.manufacturedDate || "",
  expirationDate: batch.expirationDate || "",
  costPrice: batch.costPrice ?? undefined,
  sellingPrice: batch.sellingPrice ?? undefined,
  notes: batch.notes || "",
});

export const useBatchEditModel = (batchId: string) => {
  const router = useRouter();
  const form = useForm<BatchEditFormData>({
    resolver: zodResolver(batchEditSchema),
    defaultValues: {
      productId: "",
      warehouseId: "",
      quantity: 0,
      batchCode: "",
      manufacturedDate: "",
      expirationDate: "",
      costPrice: undefined,
      sellingPrice: undefined,
      notes: "",
    },
  });

  const { data, isLoading } = useSWR<BatchEditResponse>(
    batchId ? `batches/${batchId}` : null,
    async (url) => await api.get(url).json<BatchEditResponse>()
  );

  const batch = data?.data || null;

  useEffect(() => {
    if (batch) {
      form.reset(mapBatchToFormValues(batch));
    }
  }, [batch, form]);

  const onSubmit = async (values: BatchEditFormData) => {
    try {
      await api.put(`batches/${batchId}`, { json: values }).json();
      toast.success("Batch atualizado");
      router.push(`/batches/${batchId}`);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar batch");
    }
  };

  return {
    form,
    onSubmit,
    batch,
    isLoading,
  };
};
```

```tsx
// app/batches/[id]/edit/batches-edit.view.tsx
"use client";

import Link from "next/link";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { BatchEditFormData } from "./batches-edit.schema";

interface BatchEditViewProps {
  form: UseFormReturn<BatchEditFormData>;
  onSubmit: (data: BatchEditFormData) => void;
  isLoading: boolean;
}

export const BatchEditView = ({ form, onSubmit, isLoading }: BatchEditViewProps) => {
  if (isLoading) {
    return <div className="min-h-screen bg-background px-4 py-10 text-xs text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-20 border-b border-border/40 bg-card">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 md:px-6 lg:px-8">
          <Link
            href="/batches"
            className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-muted/50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
          <div className="border-l border-border/40 pl-3">
            <h1 className="text-base font-semibold uppercase tracking-wide">Editar Batch</h1>
            <p className="text-xs text-muted-foreground hidden md:block">Atualização de lote</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="border border-border/50 bg-card/80 rounded-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">Identificação</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Produto</FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="h-9 rounded-sm border-border/40 text-xs" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="warehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Warehouse</FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="h-9 rounded-sm border-border/40 text-xs" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="batchCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Código do Batch</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-9 rounded-sm border-border/40 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border border-border/50 bg-card/80 rounded-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">Estoque</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Quantidade</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="h-9 rounded-sm border-border/40 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Custo</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} className="h-9 rounded-sm border-border/40 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sellingPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Venda</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} className="h-9 rounded-sm border-border/40 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border border-border/50 bg-card/80 rounded-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">Datas</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="manufacturedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Fabricação</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="h-9 rounded-sm border-border/40 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expirationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Validade</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="h-9 rounded-sm border-border/40 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border border-border/50 bg-card/80 rounded-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea {...field} className="min-h-[80px] rounded-sm border-border/40 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" className="rounded-sm bg-foreground text-background">
                <Save className="mr-2 h-3.5 w-3.5" />
                Salvar alterações
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
};
```

```tsx
// app/batches/[id]/edit/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useBatchEditModel } from "./batches-edit.model";
import { BatchEditView } from "./batches-edit.view";

export default function BatchEditPage() {
  const params = useParams();
  const batchId = params.id as string;
  const { form, onSubmit, isLoading } = useBatchEditModel(batchId);

  return <BatchEditView form={form} onSubmit={onSubmit} isLoading={isLoading} />;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- app/batches/[id]/edit/batches-edit.model.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/batches/[id]/edit

git commit -m "feat: add batch edit page"
```

---

## Task 6: Full test run

**Step 1: Run full suite**

Run: `pnpm test`
Expected: PASS

**Step 2: Commit any fixups**

```bash
git add -A
git commit -m "chore: stabilize batch management tests"
```
