# Stock Movements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement full stock movements module (list, detail, create, execute/cancel) with MVVM and validations.

**Architecture:** MVVM per route with SWR + ky in models, JSX-only views, Zod schemas for forms. List uses local filtering; detail exposes execute/cancel actions; create uses dynamic form based on movement type.

**Tech Stack:** Next.js 15, TypeScript, Tailwind, shadcn/ui, SWR, ky, react-hook-form, zod, lucide.

**Skill Refs:** @superpowers:test-driven-development, @frontend-design

---

## Task 1: List model helpers + types + tests

**Files:**
- Create: `app/stock-movements/stock-movements.types.ts`
- Create: `app/stock-movements/stock-movements.model.test.ts`
- Create: `app/stock-movements/stock-movements.model.ts`

**Step 1: Write the failing tests**

```ts
// app/stock-movements/stock-movements.model.test.ts
import { describe, it, expect } from "vitest";
import {
  filterMovements,
  sortMovements,
  StockMovement,
} from "./stock-movements.model";

const baseMovement: StockMovement = {
  id: "m1",
  movementType: "ENTRY",
  status: "PENDING",
  sourceWarehouseId: null,
  sourceWarehouseName: null,
  destinationWarehouseId: "w1",
  destinationWarehouseName: "Central",
  notes: "Pedido 123",
  createdBy: "u1",
  createdByName: "User",
  executedBy: null,
  executedByName: null,
  items: [
    {
      id: "i1",
      productId: "p1",
      productName: "Produto A",
      productSku: "SKU-A",
      batchId: null,
      batchNumber: null,
      quantity: 10,
      reason: "Reposição",
    },
  ],
  createdAt: "2026-01-01T10:00:00Z",
  updatedAt: "2026-01-01T10:00:00Z",
  executedAt: null,
};

describe("stock movements list helpers", () => {
  it("filters by status and type", () => {
    const movements = [baseMovement, { ...baseMovement, id: "m2", status: "COMPLETED" }];
    const filtered = filterMovements(movements, {
      searchQuery: "",
      status: "COMPLETED",
      movementType: "ENTRY",
      warehouseId: "",
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("m2");
  });

  it("sorts by createdAt desc", () => {
    const movements = [
      { ...baseMovement, id: "m1", createdAt: "2026-01-01T10:00:00Z" },
      { ...baseMovement, id: "m2", createdAt: "2026-02-01T10:00:00Z" },
    ];
    const sorted = sortMovements(movements, { key: "createdAt", direction: "desc" });
    expect(sorted[0].id).toBe("m2");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- app/stock-movements/stock-movements.model.test.ts`
Expected: FAIL with "Cannot find module './stock-movements.model'".

**Step 3: Write minimal implementation**

```ts
// app/stock-movements/stock-movements.types.ts
export type MovementType = "ENTRY" | "EXIT" | "TRANSFER" | "ADJUSTMENT";
export type MovementStatus = "PENDING" | "COMPLETED" | "CANCELLED";

export interface StockMovementItem {
  id: string;
  productId: string;
  productName: string;
  productSku?: string | null;
  batchId?: string | null;
  batchNumber?: string | null;
  quantity: number;
  reason?: string | null;
}

export interface StockMovement {
  id: string;
  movementType: MovementType;
  status: MovementStatus;
  sourceWarehouseId: string | null;
  sourceWarehouseName: string | null;
  destinationWarehouseId: string | null;
  destinationWarehouseName: string | null;
  notes?: string | null;
  createdBy: string;
  createdByName: string;
  executedBy: string | null;
  executedByName: string | null;
  items: StockMovementItem[];
  createdAt: string;
  updatedAt: string;
  executedAt: string | null;
}

export interface StockMovementsResponse {
  success: boolean;
  message?: string | null;
  data: StockMovement[];
}

export interface MovementFilters {
  searchQuery: string;
  status: MovementStatus | "all";
  movementType: MovementType | "all";
  warehouseId: string | "";
}

export interface SortConfig {
  key: "createdAt" | "movementType" | "status";
  direction: "asc" | "desc";
}
```

```ts
// app/stock-movements/stock-movements.model.ts
import { useMemo, useState } from "react";
import useSWR from "swr";
import type {
  StockMovement,
  MovementFilters,
  SortConfig,
  StockMovementsResponse,
} from "./stock-movements.types";

export type { StockMovement, MovementFilters, SortConfig };

export const filterMovements = (movements: StockMovement[], filters: MovementFilters) => {
  const query = filters.searchQuery.trim().toLowerCase();
  return movements.filter((movement) => {
    if (filters.status !== "all" && movement.status !== filters.status) return false;
    if (filters.movementType !== "all" && movement.movementType !== filters.movementType) return false;
    if (filters.warehouseId) {
      const matchesWarehouse =
        movement.sourceWarehouseId === filters.warehouseId ||
        movement.destinationWarehouseId === filters.warehouseId;
      if (!matchesWarehouse) return false;
    }
    if (query) {
      const itemText = movement.items
        .map((item) => `${item.productName} ${item.productSku ?? ""} ${item.batchNumber ?? ""}`)
        .join(" ")
        .toLowerCase();
      const haystack = `${movement.notes ?? ""} ${itemText}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
};

export const sortMovements = (movements: StockMovement[], sort: SortConfig) => {
  const sorted = [...movements];
  sorted.sort((a, b) => {
    const direction = sort.direction === "asc" ? 1 : -1;
    if (sort.key === "createdAt") {
      return direction * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    if (sort.key === "movementType") {
      return direction * a.movementType.localeCompare(b.movementType);
    }
    return direction * a.status.localeCompare(b.status);
  });
  return sorted;
};

export const useStockMovementsModel = () => {
  const [filters, setFilters] = useState<MovementFilters>({
    searchQuery: "",
    status: "all",
    movementType: "all",
    warehouseId: "",
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "createdAt",
    direction: "desc",
  });

  const { data, error, isLoading } = useSWR<StockMovementsResponse>(
    "stock-movements",
    async () => {
      const { api } = await import("@/lib/api");
      return await api.get("stock-movements").json<StockMovementsResponse>();
    }
  );

  const rawMovements = data?.data || [];
  const filtered = useMemo(() => filterMovements(rawMovements, filters), [rawMovements, filters]);
  const sorted = useMemo(() => sortMovements(filtered, sortConfig), [filtered, sortConfig]);

  return {
    movements: sorted,
    isLoading,
    error,
    filters,
    sortConfig,
    setSearchQuery: (value: string) => setFilters((prev) => ({ ...prev, searchQuery: value })),
    setStatus: (value: MovementFilters["status"]) => setFilters((prev) => ({ ...prev, status: value })),
    setMovementType: (value: MovementFilters["movementType"]) =>
      setFilters((prev) => ({ ...prev, movementType: value })),
    setWarehouseId: (value: string) => setFilters((prev) => ({ ...prev, warehouseId: value })),
    setSortConfig,
  };
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- app/stock-movements/stock-movements.model.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/stock-movements/stock-movements.types.ts app/stock-movements/stock-movements.model.ts app/stock-movements/stock-movements.model.test.ts
git commit -m "test: add stock movements list helpers"
```

---

## Task 2: List view + page + view test

**Files:**
- Create: `app/stock-movements/stock-movements.view.tsx`
- Create: `app/stock-movements/page.tsx`
- Create: `app/stock-movements/stock-movements.view.test.tsx`

**Step 1: Write the failing test**

```tsx
// app/stock-movements/stock-movements.view.test.tsx
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StockMovementsView } from "./stock-movements.view";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

const baseProps = {
  movements: [],
  isLoading: false,
  error: null,
  filters: { searchQuery: "", status: "all", movementType: "all", warehouseId: "" },
  sortConfig: { key: "createdAt", direction: "desc" },
  setSearchQuery: vi.fn(),
  setStatus: vi.fn(),
  setMovementType: vi.fn(),
  setWarehouseId: vi.fn(),
  setSortConfig: vi.fn(),
};

describe("StockMovementsView", () => {
  it("shows empty state", () => {
    render(<StockMovementsView {...baseProps} />);
    expect(screen.getByText(/nenhuma movimentação/i)).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- app/stock-movements/stock-movements.view.test.tsx`
Expected: FAIL with missing module.

**Step 3: Write minimal implementation**

```tsx
// app/stock-movements/stock-movements.view.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search } from "lucide-react";
import type { StockMovement, MovementFilters, SortConfig } from "./stock-movements.types";

interface StockMovementsViewProps {
  movements: StockMovement[];
  isLoading: boolean;
  error: any;
  filters: MovementFilters;
  sortConfig: SortConfig;
  setSearchQuery: (value: string) => void;
  setStatus: (value: MovementFilters["status"]) => void;
  setMovementType: (value: MovementFilters["movementType"]) => void;
  setWarehouseId: (value: string) => void;
  setSortConfig: (value: SortConfig) => void;
}

export const StockMovementsView = ({
  movements,
  isLoading,
  error,
  filters,
  sortConfig,
  setSearchQuery,
  setStatus,
  setMovementType,
  setWarehouseId,
  setSortConfig,
}: StockMovementsViewProps) => {
  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-20 border-b border-border/40 bg-card">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
          <div>
            <h1 className="text-base font-semibold uppercase tracking-wide">Movimentações</h1>
            <p className="text-xs text-muted-foreground hidden md:block mt-0.5">Controle de entradas e saídas</p>
          </div>
          <Link href="/stock-movements/create">
            <Button className="rounded-sm bg-foreground text-background hover:bg-foreground/90">
              <Plus className="mr-2 h-3.5 w-3.5" />
              Nova Movimentação
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <Card className="border border-border/50 bg-card/80 rounded-sm">
          <CardHeader className="border-b border-border/30">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">Lista de Movimentações</CardTitle>
            <CardDescription className="text-xs">{movements.length} registros</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  placeholder="Buscar por nota, produto ou lote..."
                  value={filters.searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-9 h-9 rounded-sm border-border/40 text-xs bg-background"
                />
              </div>
              <Select value={filters.movementType} onValueChange={(value) => setMovementType(value as MovementFilters["movementType"])}>
                <SelectTrigger className="h-9 rounded-sm border-border/40 text-xs">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="rounded-sm">
                  <SelectItem value="all" className="text-xs">Todos</SelectItem>
                  <SelectItem value="ENTRY" className="text-xs">Entrada</SelectItem>
                  <SelectItem value="EXIT" className="text-xs">Saída</SelectItem>
                  <SelectItem value="TRANSFER" className="text-xs">Transferência</SelectItem>
                  <SelectItem value="ADJUSTMENT" className="text-xs">Ajuste</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.status} onValueChange={(value) => setStatus(value as MovementFilters["status"])}>
                <SelectTrigger className="h-9 rounded-sm border-border/40 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-sm">
                  <SelectItem value="all" className="text-xs">Todos</SelectItem>
                  <SelectItem value="PENDING" className="text-xs">Pendente</SelectItem>
                  <SelectItem value="COMPLETED" className="text-xs">Concluído</SelectItem>
                  <SelectItem value="CANCELLED" className="text-xs">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading && <div className="py-10 text-center text-xs text-muted-foreground">Carregando movimentações...</div>}
            {error && <div className="py-10 text-center text-xs text-muted-foreground">Erro ao carregar movimentações</div>}
            {!isLoading && !error && movements.length === 0 && (
              <div className="py-10 text-center text-xs text-muted-foreground">Nenhuma movimentação encontrada</div>
            )}

            {!isLoading && !error && movements.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Tipo</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Notas</TableHead>
                      <TableHead className="text-xs">Criado em</TableHead>
                      <TableHead className="text-xs text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell className="text-xs">{movement.movementType}</TableCell>
                        <TableCell className="text-xs">{movement.status}</TableCell>
                        <TableCell className="text-xs">{movement.notes || "-"}</TableCell>
                        <TableCell className="text-xs">{new Date(movement.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell className="text-xs text-right">
                          <Link href={`/stock-movements/${movement.id}`} className="text-foreground/80 hover:text-foreground">
                            Ver
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
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
// app/stock-movements/page.tsx
"use client";

import { useStockMovementsModel } from "./stock-movements.model";
import { StockMovementsView } from "./stock-movements.view";

export default function StockMovementsPage() {
  const model = useStockMovementsModel();
  return <StockMovementsView {...model} />;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- app/stock-movements/stock-movements.view.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add app/stock-movements/stock-movements.view.tsx app/stock-movements/page.tsx app/stock-movements/stock-movements.view.test.tsx
git commit -m "feat: add stock movements list"
```

---

## Task 3: Detail model + view + page

**Files:**
- Create: `app/stock-movements/[id]/stock-movements-detail.types.ts`
- Create: `app/stock-movements/[id]/stock-movements-detail.model.ts`
- Create: `app/stock-movements/[id]/stock-movements-detail.view.tsx`
- Create: `app/stock-movements/[id]/page.tsx`
- Create: `app/stock-movements/[id]/stock-movements-detail.view.test.tsx`

**Step 1: Write the failing test**

```tsx
// app/stock-movements/[id]/stock-movements-detail.view.test.tsx
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StockMovementDetailView } from "./stock-movements-detail.view";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

const movement = {
  id: "m1",
  movementType: "ENTRY",
  status: "PENDING",
  sourceWarehouseId: null,
  sourceWarehouseName: null,
  destinationWarehouseId: "w1",
  destinationWarehouseName: "Central",
  notes: "Pedido",
  createdBy: "u1",
  createdByName: "User",
  executedBy: null,
  executedByName: null,
  items: [
    {
      id: "i1",
      productId: "p1",
      productName: "Produto",
      productSku: "SKU",
      batchId: null,
      batchNumber: null,
      quantity: 2,
      reason: "",
    },
  ],
  createdAt: "2026-01-01T10:00:00Z",
  updatedAt: "2026-01-01T10:00:00Z",
  executedAt: null,
};

describe("StockMovementDetailView", () => {
  it("shows movement header", () => {
    render(
      <StockMovementDetailView
        movement={movement as any}
        isLoading={false}
        error={null}
        isExecuting={false}
        isCancelling={false}
        onExecute={vi.fn()}
        onCancel={vi.fn()}
        isCancelOpen={false}
        onCancelOpenChange={vi.fn()}
      />
    );
    expect(screen.getByText(/ENTRY/i)).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- app/stock-movements/[id]/stock-movements-detail.view.test.tsx`
Expected: FAIL

**Step 3: Write minimal implementation**

```ts
// app/stock-movements/[id]/stock-movements-detail.types.ts
import type { StockMovement } from "../stock-movements.types";

export interface StockMovementDetailResponse {
  success: boolean;
  message?: string | null;
  data: StockMovement;
}
```

```ts
// app/stock-movements/[id]/stock-movements-detail.model.ts
import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import type { StockMovementDetailResponse } from "./stock-movements-detail.types";

export const useStockMovementDetailModel = (movementId: string) => {
  const [isCancelOpen, setCancelOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<StockMovementDetailResponse>(
    movementId ? `stock-movements/${movementId}` : null,
    async (url) => {
      const { api } = await import("@/lib/api");
      return await api.get(url).json<StockMovementDetailResponse>();
    }
  );

  const movement = data?.data ?? null;

  const onExecute = async () => {
    if (!movementId) return;
    setIsExecuting(true);
    try {
      const { api } = await import("@/lib/api");
      await api.post(`stock-movements/${movementId}/execute`).json();
      toast.success("Movimentação executada");
      mutate();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao executar movimentação");
    } finally {
      setIsExecuting(false);
    }
  };

  const onCancel = async () => {
    if (!movementId) return;
    setIsCancelling(true);
    try {
      const { api } = await import("@/lib/api");
      await api.post(`stock-movements/${movementId}/cancel`).json();
      toast.success("Movimentação cancelada");
      setCancelOpen(false);
      mutate();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao cancelar movimentação");
    } finally {
      setIsCancelling(false);
    }
  };

  return {
    movement,
    isLoading,
    error,
    isExecuting,
    isCancelling,
    onExecute,
    onCancel,
    isCancelOpen,
    onCancelOpenChange: setCancelOpen,
  };
};
```

```tsx
// app/stock-movements/[id]/stock-movements-detail.view.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Check, X } from "lucide-react";
import type { StockMovement } from "../stock-movements.types";

interface StockMovementDetailViewProps {
  movement: StockMovement | null;
  isLoading: boolean;
  error: any;
  isExecuting: boolean;
  isCancelling: boolean;
  onExecute: () => void;
  onCancel: () => void;
  isCancelOpen: boolean;
  onCancelOpenChange: (open: boolean) => void;
}

export const StockMovementDetailView = ({
  movement,
  isLoading,
  error,
  isExecuting,
  isCancelling,
  onExecute,
  onCancel,
  isCancelOpen,
  onCancelOpenChange,
}: StockMovementDetailViewProps) => {
  if (isLoading) {
    return <div className="min-h-screen bg-background px-4 py-10 text-xs text-muted-foreground">Carregando...</div>;
  }

  if (error || !movement) {
    return <div className="min-h-screen bg-background px-4 py-10 text-xs text-muted-foreground">Movimentação não encontrada</div>;
  }

  const canAct = movement.status === "PENDING";

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-20 border-b border-border/40 bg-card">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/stock-movements" className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-muted/50">
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
            <div className="border-l border-border/40 pl-3">
              <h1 className="text-base font-semibold uppercase tracking-wide">{movement.movementType}</h1>
              <p className="text-xs text-muted-foreground hidden md:block">{movement.status}</p>
            </div>
          </div>
          {canAct && (
            <div className="flex items-center gap-2">
              <Button size="sm" className="rounded-sm bg-foreground text-background" onClick={onExecute} disabled={isExecuting}>
                <Check className="mr-2 h-3.5 w-3.5" />
                Executar
              </Button>
              <AlertDialog open={isCancelOpen} onOpenChange={onCancelOpenChange}>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="rounded-sm border-border/40">
                    <X className="mr-2 h-3.5 w-3.5" />
                    Cancelar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar movimentação?</AlertDialogTitle>
                    <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-sm">Voltar</AlertDialogCancel>
                    <AlertDialogAction className="rounded-sm" onClick={onCancel} disabled={isCancelling}>
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <Card className="border border-border/50 bg-card/80 rounded-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">Itens</CardTitle>
            <CardDescription className="text-xs">{movement.items.length} itens</CardDescription>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            {movement.items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>{item.productName}</span>
                <span>{item.quantity}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
```

```tsx
// app/stock-movements/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useStockMovementDetailModel } from "./stock-movements-detail.model";
import { StockMovementDetailView } from "./stock-movements-detail.view";

export default function StockMovementDetailPage() {
  const params = useParams();
  const movementId = params.id as string;
  const model = useStockMovementDetailModel(movementId);
  return <StockMovementDetailView {...model} />;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- app/stock-movements/[id]/stock-movements-detail.view.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add app/stock-movements/[id]

git commit -m "feat: add stock movement detail"
```

---

## Task 4: Create form schema + model + view + test

**Files:**
- Create: `app/stock-movements/create/stock-movements-create.types.ts`
- Create: `app/stock-movements/create/stock-movements-create.schema.ts`
- Create: `app/stock-movements/create/stock-movements-create.model.ts`
- Create: `app/stock-movements/create/stock-movements-create.view.tsx`
- Create: `app/stock-movements/create/page.tsx`
- Create: `app/stock-movements/create/stock-movements-create.model.test.ts`

**Step 1: Write the failing test**

```ts
// app/stock-movements/create/stock-movements-create.model.test.ts
import { describe, it, expect } from "vitest";
import { buildMovementPayload } from "./stock-movements-create.model";

const formData = {
  movementType: "ENTRY",
  sourceWarehouseId: "",
  destinationWarehouseId: "w1",
  notes: "Pedido",
  items: [
    { productId: "p1", batchId: "", quantity: 2, reason: "" },
  ],
};

describe("buildMovementPayload", () => {
  it("maps null warehouse ids and trims notes", () => {
    const payload = buildMovementPayload({ ...formData, notes: " " } as any);
    expect(payload.notes).toBeUndefined();
    expect(payload.sourceWarehouseId).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- app/stock-movements/create/stock-movements-create.model.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```ts
// app/stock-movements/create/stock-movements-create.types.ts
import type { MovementType } from "../stock-movements.types";

export interface MovementItemFormData {
  productId: string;
  batchId?: string;
  quantity: number;
  reason?: string;
}

export interface StockMovementCreateFormData {
  movementType: MovementType;
  sourceWarehouseId?: string;
  destinationWarehouseId?: string;
  notes?: string;
  items: MovementItemFormData[];
  executeNow?: boolean;
}

export interface StockMovementCreateResponse {
  success: boolean;
  message?: string | null;
  data: { id: string };
}
```

```ts
// app/stock-movements/create/stock-movements-create.schema.ts
import { z } from "zod";

export const stockMovementCreateSchema = z
  .object({
    movementType: z.enum(["ENTRY", "EXIT", "TRANSFER", "ADJUSTMENT"]),
    sourceWarehouseId: z.string().optional(),
    destinationWarehouseId: z.string().optional(),
    notes: z.string().optional(),
    executeNow: z.boolean().optional(),
    items: z.array(
      z.object({
        productId: z.string().min(1, "Selecione um produto"),
        batchId: z.string().optional(),
        quantity: z.coerce.number().int().min(1, "Quantidade inválida"),
        reason: z.string().optional(),
      })
    ).min(1, "Adicione ao menos um item"),
  })
  .superRefine((data, ctx) => {
    const type = data.movementType;
    if ((type === "ENTRY" || type === "TRANSFER") && !data.destinationWarehouseId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["destinationWarehouseId"], message: "Destino obrigatório" });
    }
    if ((type === "EXIT" || type === "TRANSFER" || type === "ADJUSTMENT") && !data.sourceWarehouseId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["sourceWarehouseId"], message: "Origem obrigatória" });
    }
    if ((type === "EXIT" || type === "TRANSFER") && data.items.some((item) => !item.batchId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["items"], message: "Batch obrigatório" });
    }
  });

export type StockMovementCreateFormData = z.infer<typeof stockMovementCreateSchema>;
```

```ts
// app/stock-movements/create/stock-movements-create.model.ts
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { stockMovementCreateSchema, StockMovementCreateFormData } from "./stock-movements-create.schema";
import type { StockMovementCreateResponse } from "./stock-movements-create.types";

interface WarehousesResponse { success: boolean; data: Array<{ id: string; name: string }>; }
interface ProductsResponse { success: boolean; data: Array<{ id: string; name: string; sku?: string | null }>; }
interface BatchesResponse { success: boolean; data: Array<{ id: string; batchNumber?: string | null; quantity: number }>; }

export const buildMovementPayload = (data: StockMovementCreateFormData) => ({
  movementType: data.movementType,
  sourceWarehouseId: data.sourceWarehouseId || null,
  destinationWarehouseId: data.destinationWarehouseId || null,
  notes: data.notes?.trim() || undefined,
  items: data.items.map((item) => ({
    productId: item.productId,
    batchId: item.batchId || undefined,
    quantity: item.quantity,
    reason: item.reason?.trim() || undefined,
  })),
});

export const useStockMovementCreateModel = () => {
  const router = useRouter();
  const form = useForm<StockMovementCreateFormData>({
    resolver: zodResolver(stockMovementCreateSchema),
    defaultValues: {
      movementType: "ENTRY",
      sourceWarehouseId: "",
      destinationWarehouseId: "",
      notes: "",
      executeNow: false,
      items: [{ productId: "", batchId: "", quantity: 1, reason: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  const { data: warehousesData } = useSWR<WarehousesResponse>("warehouses", async () => {
    const { api } = await import("@/lib/api");
    return await api.get("warehouses").json<WarehousesResponse>();
  });

  const { data: productsData } = useSWR<ProductsResponse>("products", async () => {
    const { api } = await import("@/lib/api");
    return await api.get("products").json<ProductsResponse>();
  });

  const sourceWarehouseId = form.watch("sourceWarehouseId");
  const { data: batchesData } = useSWR<BatchesResponse>(
    sourceWarehouseId ? `batches/warehouse/${sourceWarehouseId}` : null,
    async (url) => {
      const { api } = await import("@/lib/api");
      return await api.get(url).json<BatchesResponse>();
    }
  );

  const onSubmit = async (values: StockMovementCreateFormData) => {
    try {
      const payload = buildMovementPayload(values);
      const { api } = await import("@/lib/api");
      const response = await api.post("stock-movements", { json: payload }).json<StockMovementCreateResponse>();
      if (response.success) {
        if (values.executeNow) {
          await api.post(`stock-movements/${response.data.id}/execute`).json();
        }
        toast.success("Movimentação criada");
        router.push(`/stock-movements/${response.data.id}`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao criar movimentação");
    }
  };

  return {
    form,
    onSubmit,
    items: fields,
    addItem: () => append({ productId: "", batchId: "", quantity: 1, reason: "" }),
    removeItem: (index: number) => remove(index),
    warehouses: warehousesData?.data || [],
    products: productsData?.data || [],
    batches: batchesData?.data || [],
  };
};
```

```tsx
// app/stock-movements/create/stock-movements-create.view.tsx
"use client";

import Link from "next/link";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { StockMovementCreateFormData } from "./stock-movements-create.schema";

interface StockMovementCreateViewProps {
  form: UseFormReturn<StockMovementCreateFormData>;
  onSubmit: (data: StockMovementCreateFormData) => void;
  items: Array<{ id: string }>
  addItem: () => void;
  removeItem: (index: number) => void;
  warehouses: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string; sku?: string | null }>;
  batches: Array<{ id: string; batchNumber?: string | null; quantity: number }>;
}

export const StockMovementCreateView = ({
  form,
  onSubmit,
  items,
  addItem,
  removeItem,
  warehouses,
  products,
  batches,
}: StockMovementCreateViewProps) => {
  const movementType = form.watch("movementType");
  const requiresSource = movementType === "EXIT" || movementType === "TRANSFER" || movementType === "ADJUSTMENT";
  const requiresDestination = movementType === "ENTRY" || movementType === "TRANSFER";
  const requiresBatch = movementType === "EXIT" || movementType === "TRANSFER";

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-20 border-b border-border/40 bg-card">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 md:px-6 lg:px-8">
          <Link href="/stock-movements" className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-muted/50">
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
          <div className="border-l border-border/40 pl-3">
            <h1 className="text-base font-semibold uppercase tracking-wide">Nova Movimentação</h1>
            <p className="text-xs text-muted-foreground hidden md:block">Entrada, saída ou transferência</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="border border-border/50 bg-card/80 rounded-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">Tipo</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="movementType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Tipo *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-9 rounded-sm border-border/40 text-xs">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="rounded-sm">
                          <SelectItem value="ENTRY" className="text-xs">Entrada</SelectItem>
                          <SelectItem value="EXIT" className="text-xs">Saída</SelectItem>
                          <SelectItem value="TRANSFER" className="text-xs">Transferência</SelectItem>
                          <SelectItem value="ADJUSTMENT" className="text-xs">Ajuste</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="executeNow"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-sm border border-border/40 bg-background/50 px-3 py-2">
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Executar agora</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border border-border/50 bg-card/80 rounded-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">Warehouses</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {requiresSource && (
                  <FormField
                    control={form.control}
                    name="sourceWarehouseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-wide">Origem *</FormLabel>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
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
                )}
                {requiresDestination && (
                  <FormField
                    control={form.control}
                    name="destinationWarehouseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-wide">Destino *</FormLabel>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
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
                )}
              </CardContent>
            </Card>

            <Card className="border border-border/50 bg-card/80 rounded-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">Itens</CardTitle>
                <Button type="button" size="sm" variant="outline" className="rounded-sm border-border/40 text-xs" onClick={addItem}>
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  Adicionar item
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="grid gap-3 md:grid-cols-4">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId` as const}
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
                      name={`items.${index}.batchId` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase tracking-wide">Batch{requiresBatch ? " *" : ""}</FormLabel>
                          <Select value={field.value || ""} onValueChange={field.onChange} disabled={!requiresBatch}>
                            <SelectTrigger className="h-9 rounded-sm border-border/40 text-xs">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="rounded-sm">
                              {batches.map((batch) => (
                                <SelectItem key={batch.id} value={batch.id} className="text-xs">
                                  {batch.batchNumber || batch.id} ({batch.quantity})
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
                      name={`items.${index}.quantity` as const}
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
                    <div className="flex items-end gap-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.reason` as const}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="text-xs font-semibold uppercase tracking-wide">Motivo</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-9 rounded-sm border-border/40 text-xs" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {items.length > 1 && (
                        <Button type="button" variant="outline" size="sm" className="rounded-sm border-border/40" onClick={() => removeItem(index)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" className="rounded-sm bg-foreground text-background">Salvar</Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
};
```

```tsx
// app/stock-movements/create/page.tsx
"use client";

import { useStockMovementCreateModel } from "./stock-movements-create.model";
import { StockMovementCreateView } from "./stock-movements-create.view";

export default function StockMovementCreatePage() {
  const model = useStockMovementCreateModel();
  return <StockMovementCreateView {...model} />;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- app/stock-movements/create/stock-movements-create.model.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/stock-movements/create

git commit -m "feat: add stock movement create"
```

---

## Task 5: Full test run

**Step 1: Run full suite**

Run: `pnpm test`
Expected: PASS

**Step 2: Commit any fixups**

```bash
git add -A
git commit -m "chore: stabilize stock movements"
```

