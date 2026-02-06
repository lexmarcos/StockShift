# Fix Transfers Module Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all API, design, MVVM, and type issues in the transfers module to match the endpoint docs and project standards.

**Architecture:** Each task targets one file or one concern. Models get proper SWR fetchers with the centralized `api` client. Views lose all state/effects (moved to models). Types align with `docs/endpoints/transfer.md`. Design follows CLAUDE.md rules.

**Tech Stack:** Next.js 15, TypeScript, Tailwind, shadcn/ui, SWR, ky (via `@/lib/api`), react-hook-form, zod, lucide.

**Skill Refs:** @superpowers:test-driven-development, @frontend-design

---

## Task 1: Fix transfers.types.ts — align with API response shapes

**Files:**
- Modify: `app/(pages)/transfers/transfers.types.ts`

**Step 1: Replace the entire file**

The current types don't match the paginated API response. The `TransferItem` is missing fields from the API (`productBarcode`). The `DiscrepancyItem` is here but the scan-related types are wrong in the validate types file.

```ts
// app/(pages)/transfers/transfers.types.ts
export enum TransferStatus {
  DRAFT = "DRAFT",
  IN_TRANSIT = "IN_TRANSIT",
  IN_VALIDATION = "IN_VALIDATION",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface TransferItem {
  id: string;
  sourceBatchId: string;
  quantity: number;
  productName?: string;
  productBarcode?: string;
  batchCode?: string;
}

export interface Transfer {
  id: string;
  code: string;
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  destinationWarehouseId: string;
  destinationWarehouseName: string;
  status: TransferStatus;
  notes?: string;
  items: TransferItem[];
  createdAt: string;
}

// GET /transfers — paginated response
export interface TransfersPageResponse {
  success: boolean;
  message?: string;
  data: {
    content: Transfer[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  };
}

// GET /transfers/{id} — single transfer response
export interface TransferDetailResponse {
  success: boolean;
  message?: string;
  data: Transfer;
}

// POST /transfers/{id}/scan — scan response
export interface ScanResponse {
  success: boolean;
  message: string;
  data: {
    valid: boolean;
    message: string;
    warning: string | null;
    productName: string;
    productBarcode: string;
    quantitySent: number;
    quantityReceived: number;
  };
}

// GET /transfers/{id}/discrepancy-report
export interface DiscrepancyItem {
  productName: string;
  quantitySent: number;
  quantityReceived: number;
  discrepancyType: "SHORTAGE" | "OVERAGE";
  difference: number;
}

export interface DiscrepancyReportResponse {
  success: boolean;
  message?: string;
  data: {
    transferId: string;
    items: DiscrepancyItem[];
  };
}

// GET /transfers/{id}/validation-logs
export interface ValidationLogEntry {
  barcode: string;
  productName: string;
  scannedAt: string;
  valid: boolean;
}

export interface ValidationLogsResponse {
  success: boolean;
  message?: string;
  data: ValidationLogEntry[];
}
```

**Step 2: Run tests to check nothing broke**

Run: `pnpm test -- app/(pages)/transfers/`
Expected: PASS (types are just interfaces, existing tests should still work or show clear import errors to fix in next tasks)

**Step 3: Commit**

```bash
git add app/(pages)/transfers/transfers.types.ts
git commit -m "fix(transfers): align types with API response shapes"
```

---

## Task 2: Fix transfers.model.ts — add SWR fetcher with api client

**Files:**
- Modify: `app/(pages)/transfers/transfers.model.ts`

**Step 1: Replace the entire file**

Current issues:
- No SWR fetcher (data never loads)
- URL is wrong (`/stockshift/api/transfers` instead of relative `transfers`)
- Response shape expects `Transfer[]` but API returns paginated `{ data: { content: [...] } }`
- Missing `error` exposure
- Missing `mutate` for refresh

```ts
// app/(pages)/transfers/transfers.model.ts
import { useState, useMemo } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import { Transfer, TransfersPageResponse } from "./transfers.types";

export function useTransfersModel() {
  const [activeTab, setActiveTab] = useState<"outgoing" | "incoming">("outgoing");
  const { warehouseId } = useSelectedWarehouse();

  const { data, isLoading, error } = useSWR<TransfersPageResponse>(
    warehouseId ? "transfers" : null,
    async (url: string) => {
      return await api.get(url).json<TransfersPageResponse>();
    }
  );

  const allTransfers = data?.data?.content || [];

  const filteredTransfers = useMemo(() => {
    if (!warehouseId) return [];

    const filtered = allTransfers.filter((transfer) => {
      if (activeTab === "outgoing") {
        return transfer.sourceWarehouseId === warehouseId;
      }
      return transfer.destinationWarehouseId === warehouseId;
    });

    return [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [allTransfers, warehouseId, activeTab]);

  return {
    transfers: filteredTransfers,
    isLoading,
    error: error || null,
    activeTab,
    onTabChange: setActiveTab,
  };
}
```

**Step 2: Run tests**

Run: `pnpm test -- app/(pages)/transfers/transfers.view.test.tsx`
Expected: PASS (view tests don't depend on model internals)

**Step 3: Commit**

```bash
git add app/(pages)/transfers/transfers.model.ts
git commit -m "fix(transfers): add SWR fetcher with api client to list model"
```

---

## Task 3: Fix transfers.view.tsx — remove design violations

**Files:**
- Modify: `app/(pages)/transfers/transfers.view.tsx`

**Step 1: Replace the entire file**

Current issues:
- `transition-colors` on cards (line 81) — violates "Sem Animações"
- `rounded-full` on arrow icon container (line 114) — violates radius rule
- `transition-colors` on arrow container — animation violation
- Missing `error` prop handling
- Icons missing `strokeWidth={2}`

```tsx
// app/(pages)/transfers/transfers.view.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Package, Calendar } from "lucide-react";
import Link from "next/link";
import { Transfer, TransferStatus } from "./transfers.types";
import { cn } from "@/lib/utils";

interface TransfersViewProps {
  transfers: Transfer[];
  isLoading: boolean;
  error: Error | null;
  activeTab: "outgoing" | "incoming";
  onTabChange: (tab: "outgoing" | "incoming") => void;
}

const statusConfig: Record<TransferStatus, { color: string; label: string }> = {
  [TransferStatus.DRAFT]: { color: "border-blue-600", label: "Rascunho" },
  [TransferStatus.IN_TRANSIT]: { color: "border-amber-500", label: "Em Trânsito" },
  [TransferStatus.IN_VALIDATION]: { color: "border-purple-500", label: "Em Validação" },
  [TransferStatus.COMPLETED]: { color: "border-emerald-600", label: "Concluído" },
  [TransferStatus.CANCELLED]: { color: "border-neutral-600", label: "Cancelado" },
};

export function TransfersView({
  transfers,
  isLoading,
  error,
  activeTab,
  onTabChange,
}: TransfersViewProps) {
  return (
    <div className="flex flex-col gap-6 p-4 pb-20 md:p-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white">Transferências</h1>
        {activeTab === "outgoing" && (
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide uppercase rounded-[4px]">
            <Link href="/transfers/new">
              <Plus className="mr-2 h-4 w-4" strokeWidth={2.5} />
              Nova Transferência
            </Link>
          </Button>
        )}
      </div>

      <Tabs
        defaultValue="outgoing"
        value={activeTab}
        onValueChange={(val) => onTabChange(val as "outgoing" | "incoming")}
        className="w-full"
      >
        <TabsList className="w-full grid grid-cols-2 bg-neutral-900 border border-neutral-800 p-1 rounded-[4px]">
          <TabsTrigger
            value="outgoing"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white uppercase tracking-wide font-bold rounded-[2px]"
          >
            Enviadas
          </TabsTrigger>
          <TabsTrigger
            value="incoming"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white uppercase tracking-wide font-bold rounded-[2px]"
          >
            Recebidas
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-4">
          {isLoading ? (
            <div className="text-center py-10 text-neutral-500">Carregando...</div>
          ) : error ? (
            <div className="text-center py-10 text-rose-500 bg-rose-500/10 rounded-[4px] border border-rose-900/30">
              Erro ao carregar transferências
            </div>
          ) : transfers.length === 0 ? (
            <div className="text-center py-10 text-neutral-500 bg-neutral-900/50 rounded-[4px] border border-neutral-800 border-dashed">
              <Package className="mx-auto h-10 w-10 mb-3 opacity-20" strokeWidth={2} />
              <p>Nenhuma transferência encontrada</p>
            </div>
          ) : (
            transfers.map((transfer) => {
              const config = statusConfig[transfer.status];
              const totalItems = transfer.items.reduce((acc, item) => acc + item.quantity, 0);

              return (
                <Link key={transfer.id} href={`/transfers/${transfer.id}`} className="block group">
                  <Card className={cn(
                    "bg-[#171717] border-neutral-800 hover:border-neutral-700 border-l-4 rounded-[4px]",
                    config.color
                  )}>
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-bold text-neutral-400 bg-neutral-800/50 px-2 py-0.5 rounded-[4px] tracking-tighter">
                              {transfer.code}
                            </span>
                            <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-[4px] bg-neutral-900 border border-neutral-800 text-neutral-300">
                              {config.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-neutral-300 text-sm sm:text-base font-medium">
                            <span className="truncate max-w-[120px] sm:max-w-none">{transfer.sourceWarehouseName}</span>
                            <ArrowRight className="h-4 w-4 text-neutral-500 flex-shrink-0" strokeWidth={2} />
                            <span className="truncate max-w-[120px] sm:max-w-none">{transfer.destinationWarehouseName}</span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-neutral-500 mt-2">
                            <div className="flex items-center gap-1.5">
                              <Package className="h-3.5 w-3.5" strokeWidth={2} />
                              <span>{totalItems} {totalItems === 1 ? "item" : "itens"}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
                              <span>{new Date(transfer.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="hidden sm:flex items-center justify-center h-10 w-10 rounded-[4px] bg-neutral-800/50 group-hover:bg-blue-600/20 group-hover:text-blue-500">
                          <ArrowRight className="h-5 w-5" strokeWidth={2} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Step 2: Update the test to pass `error` prop**

Open `app/(pages)/transfers/transfers.view.test.tsx` and add `error: null` to `defaultProps`:

```ts
  const defaultProps = {
    transfers: mockTransfers,
    isLoading: false,
    error: null,
    activeTab: "outgoing" as const,
    onTabChange: vi.fn(),
  };
```

**Step 3: Run tests**

Run: `pnpm test -- app/(pages)/transfers/transfers.view.test.tsx`
Expected: PASS

**Step 4: Commit**

```bash
git add app/(pages)/transfers/transfers.view.tsx app/(pages)/transfers/transfers.view.test.tsx
git commit -m "fix(transfers): remove design violations from list view"
```

---

## Task 4: Fix transfer-detail.model.ts — add SWR fetcher, use api client

**Files:**
- Modify: `app/(pages)/transfers/[id]/transfer-detail.model.ts`

**Step 1: Replace the entire file**

Current issues:
- No SWR fetcher (data never loads)
- Uses raw `ky` instead of `api` (no auth, no token refresh)
- Response shape expects `Transfer` directly but API returns `{ data: Transfer }`
- Uses `confirm()` for cancel — should be handled by view
- Missing `useBreadcrumb`

```ts
// app/(pages)/transfers/[id]/transfer-detail.model.ts
import { useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Transfer, TransferDetailResponse } from "../transfers.types";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import { useBreadcrumb } from "@/components/breadcrumb";

export const useTransferDetailModel = (transferId: string) => {
  const router = useRouter();
  const { warehouseId: currentWarehouseId } = useSelectedWarehouse();

  const [isExecuting, setIsExecuting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<TransferDetailResponse>(
    transferId ? `transfers/${transferId}` : null,
    async (url: string) => {
      return await api.get(url).json<TransferDetailResponse>();
    }
  );

  const transfer = data?.data ?? undefined;

  useBreadcrumb({
    title: transfer?.code || "Detalhes",
    backUrl: "/transfers",
    section: "Transferências",
    subsection: "Detalhes",
  });

  const isSource = transfer?.sourceWarehouseId === currentWarehouseId;
  const isDestination = transfer?.destinationWarehouseId === currentWarehouseId;

  const handleExecute = async () => {
    if (!transferId) return;
    setIsExecuting(true);
    try {
      await api.post(`transfers/${transferId}/execute`).json();
      toast.success("Transferência iniciada com sucesso!");
      mutate();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Erro ao executar transferência.");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCancel = async () => {
    if (!transferId) return;
    setIsCancelling(true);
    try {
      await api.delete(`transfers/${transferId}`).json();
      toast.success("Transferência cancelada.");
      mutate();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Erro ao cancelar transferência.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleStartValidation = async () => {
    if (!transferId) return;
    setIsValidating(true);
    try {
      await api.post(`transfers/${transferId}/start-validation`).json();
      toast.success("Validação iniciada!");
      router.push(`/transfers/${transferId}/validate`);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Erro ao iniciar validação.");
    } finally {
      setIsValidating(false);
    }
  };

  return {
    isLoading,
    error: error || null,
    transfer,
    isSource,
    isDestination,
    isExecuting,
    isCancelling,
    isValidating,
    onExecute: handleExecute,
    onCancel: handleCancel,
    onStartValidation: handleStartValidation,
  };
};
```

**Step 2: Run tests**

Run: `pnpm test -- app/(pages)/transfers/`
Expected: PASS

**Step 3: Commit**

```bash
git add app/(pages)/transfers/[id]/transfer-detail.model.ts
git commit -m "fix(transfers): add SWR fetcher and api client to detail model"
```

---

## Task 5: Fix transfer-detail.view.tsx — remove design violations

**Files:**
- Modify: `app/(pages)/transfers/[id]/transfer-detail.view.tsx`
- Modify: `app/(pages)/transfers/[id]/transfer-detail.types.ts`

**Step 1: Update types to remove React import and add error**

```ts
// app/(pages)/transfers/[id]/transfer-detail.types.ts
import { Transfer } from "../transfers.types";

export interface TransferDetailViewProps {
  isLoading: boolean;
  error: Error | null;
  transfer?: Transfer;
  isSource: boolean;
  isDestination: boolean;
  isExecuting: boolean;
  isCancelling: boolean;
  isValidating: boolean;
  onExecute: () => void;
  onCancel: () => void;
  onStartValidation: () => void;
}
```

**Step 2: Replace the view file**

Current issues:
- `import React from "react"` unnecessary
- `transition-colors` on back link (line 84) and arrow container (line 114)
- `rounded-full` on arrow container (line 114)
- Icons missing `strokeWidth={2}`
- Header uses `bg-neutral-900` custom header instead of using breadcrumb (breadcrumb is now in model)

Since breadcrumb is now handled by the model, the view should NOT render its own back-link header. The breadcrumb component renders globally. Remove the custom header and just render content.

```tsx
// app/(pages)/transfers/[id]/transfer-detail.view.tsx
import Link from "next/link";
import { ArrowRight, Calendar, FileText, Truck, CheckCircle, XCircle, Edit } from "lucide-react";
import { TransferDetailViewProps } from "./transfer-detail.types";
import { TransferStatus } from "../transfers.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const TransferDetailView = ({
  isLoading,
  error,
  transfer,
  isSource,
  isDestination,
  isExecuting,
  isCancelling,
  isValidating,
  onExecute,
  onCancel,
  onStartValidation,
}: TransferDetailViewProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-neutral-500">
        Carregando detalhes...
      </div>
    );
  }

  if (error || !transfer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="text-neutral-400">Transferência não encontrada</div>
      </div>
    );
  }

  const getStatusBadge = (status: TransferStatus) => {
    switch (status) {
      case TransferStatus.DRAFT:
        return <Badge variant="outline" className="bg-neutral-800 text-neutral-400 border-neutral-700 rounded-[4px]">RASCUNHO</Badge>;
      case TransferStatus.IN_TRANSIT:
        return <Badge className="bg-blue-600/20 text-blue-500 border-blue-600/50 rounded-[4px]">EM TRÂNSITO</Badge>;
      case TransferStatus.IN_VALIDATION:
        return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/50 rounded-[4px]">EM VALIDAÇÃO</Badge>;
      case TransferStatus.COMPLETED:
        return <Badge className="bg-emerald-600/20 text-emerald-500 border-emerald-600/50 rounded-[4px]">CONCLUÍDA</Badge>;
      case TransferStatus.CANCELLED:
        return <Badge className="bg-rose-600/20 text-rose-500 border-rose-600/50 rounded-[4px]">CANCELADA</Badge>;
      default:
        return <Badge variant="outline" className="rounded-[4px]">{status}</Badge>;
    }
  };

  const getStatusColor = (status: TransferStatus) => {
    switch (status) {
      case TransferStatus.IN_TRANSIT: return "border-l-blue-600";
      case TransferStatus.IN_VALIDATION: return "border-l-amber-500";
      case TransferStatus.COMPLETED: return "border-l-emerald-600";
      case TransferStatus.CANCELLED: return "border-l-rose-600";
      default: return "border-l-neutral-600";
    }
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Info header */}
      <div className="border-b border-neutral-800 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold tracking-tight text-white">{transfer.code}</h2>
                {getStatusBadge(transfer.status)}
              </div>
              <p className="text-neutral-400 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" strokeWidth={2} />
                Criado em {new Date(transfer.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Route Card */}
        <Card className={`bg-[#171717] border-neutral-800 border-l-4 ${getStatusColor(transfer.status)} rounded-[4px]`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Truck className="w-5 h-5 text-neutral-400" strokeWidth={2} />
              Rota de Transferência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider block mb-1">Origem</span>
                <div className="text-lg font-medium text-white">{transfer.sourceWarehouseName}</div>
                {isSource && <span className="text-xs text-blue-500 font-mono mt-1 block">SEU WAREHOUSE</span>}
              </div>

              <div className="hidden md:flex items-center justify-center px-4">
                <ArrowRight className="w-6 h-6 text-neutral-600" strokeWidth={2} />
              </div>

              <div className="flex-1 md:text-right">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider block mb-1">Destino</span>
                <div className="text-lg font-medium text-white">{transfer.destinationWarehouseName}</div>
                {isDestination && <span className="text-xs text-blue-500 font-mono mt-1 block">SEU WAREHOUSE</span>}
              </div>
            </div>

            {transfer.notes && (
              <>
                <Separator className="my-6 bg-neutral-800" />
                <div>
                  <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider block mb-2">
                    <FileText className="w-3 h-3 inline mr-1" strokeWidth={2} />
                    Observações
                  </span>
                  <p className="text-neutral-300 text-sm leading-relaxed">{transfer.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Items List */}
        <Card className="bg-[#171717] border-neutral-800 rounded-[4px]">
          <CardHeader>
            <CardTitle className="text-lg">Itens da Transferência</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-800 hover:bg-transparent">
                  <TableHead className="text-neutral-500">Produto</TableHead>
                  <TableHead className="text-neutral-500">Lote</TableHead>
                  <TableHead className="text-right text-neutral-500">Qtd.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfer.items.map((item) => (
                  <TableRow key={item.id} className="border-neutral-800 hover:bg-neutral-800/50">
                    <TableCell className="font-medium text-white">
                      {item.productName || "Produto Desconhecido"}
                    </TableCell>
                    <TableCell className="text-neutral-400 font-mono text-xs">
                      {item.batchCode || "N/A"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-white tracking-tighter">
                      {item.quantity}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-neutral-800 p-4 md:p-6 md:ml-[240px] z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-end gap-3">
          {/* Source Actions */}
          {isSource && transfer.status === TransferStatus.DRAFT && (
            <>
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isCancelling}
                className="border-neutral-700 text-neutral-300 hover:bg-rose-900/20 hover:text-rose-500 hover:border-rose-900 rounded-[4px]"
              >
                {isCancelling ? "Cancelando..." : "CANCELAR"}
              </Button>
              <Button
                onClick={onExecute}
                disabled={isExecuting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide uppercase rounded-[4px]"
              >
                {isExecuting ? "Processando..." : "EXECUTAR TRANSFERÊNCIA"}
              </Button>
            </>
          )}

          {isSource && transfer.status === TransferStatus.IN_TRANSIT && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isCancelling}
              className="border-neutral-700 text-neutral-300 hover:bg-rose-900/20 hover:text-rose-500 hover:border-rose-900 rounded-[4px]"
            >
              {isCancelling ? "Cancelando..." : "CANCELAR TRANSFERÊNCIA"}
            </Button>
          )}

          {/* Destination Actions */}
          {isDestination && transfer.status === TransferStatus.IN_TRANSIT && (
            <Button
              onClick={onStartValidation}
              disabled={isValidating}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide uppercase rounded-[4px]"
            >
              {isValidating ? "Iniciando..." : "INICIAR VALIDAÇÃO"}
            </Button>
          )}

          {isDestination && transfer.status === TransferStatus.IN_VALIDATION && (
            <Link href={`/transfers/${transfer.id}/validate`}>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white font-bold tracking-wide uppercase rounded-[4px]">
                CONTINUAR VALIDAÇÃO
              </Button>
            </Link>
          )}

          {/* Completed State */}
          {transfer.status === TransferStatus.COMPLETED && (
            <div className="text-emerald-500 flex items-center gap-2 text-sm font-medium px-4">
              <CheckCircle className="w-5 h-5" strokeWidth={2} />
              Transferência Concluída
            </div>
          )}

          {/* Cancelled State */}
          {transfer.status === TransferStatus.CANCELLED && (
            <div className="text-rose-500 flex items-center gap-2 text-sm font-medium px-4">
              <XCircle className="w-5 h-5" strokeWidth={2} />
              Transferência Cancelada
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

**Step 3: Remove unnecessary React import from page.tsx**

```tsx
// app/(pages)/transfers/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { TransferDetailView } from "./transfer-detail.view";
import { useTransferDetailModel } from "./transfer-detail.model";

export default function TransferDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const model = useTransferDetailModel(id);

  return <TransferDetailView {...model} />;
}
```

**Step 4: Run tests**

Run: `pnpm test -- app/(pages)/transfers/`
Expected: PASS

**Step 5: Commit**

```bash
git add app/(pages)/transfers/[id]/
git commit -m "fix(transfers): remove design violations from detail view, add breadcrumb"
```

---

## Task 6: Fix validate-transfer types and model — use api client, fix response shapes

**Files:**
- Modify: `app/(pages)/transfers/[id]/validate/validate-transfer.types.ts`
- Modify: `app/(pages)/transfers/[id]/validate/validate-transfer.model.ts`

**Step 1: Replace validate-transfer.types.ts**

Current `ScannedItem` doesn't match API. `ValidationStatus` is fabricated. Fix all types.

```ts
// app/(pages)/transfers/[id]/validate/validate-transfer.types.ts
import { DiscrepancyItem } from "../../transfers.types";

export interface ScanResultItem {
  valid: boolean;
  message: string;
  productName: string;
  productBarcode: string;
  quantitySent: number;
  quantityReceived: number;
}

export interface ExpectedItem {
  id: string;
  productName: string;
  batchCode: string;
  expectedQuantity: number;
  scannedQuantity: number;
}

export interface ValidateTransferViewProps {
  isLoading: boolean;
  isProcessing: boolean;
  transfer?: import("../../transfers.types").Transfer;
  expectedItems: ExpectedItem[];
  progress: number;
  lastScanResult: ScanResultItem | null;

  // Scanner state (managed by model, passed to view)
  barcode: string;
  onBarcodeChange: (value: string) => void;
  onScan: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;

  onFinish: () => void;

  // Modal props for finish confirmation
  showFinishModal: boolean;
  setShowFinishModal: (show: boolean) => void;
  discrepancies: DiscrepancyItem[];
  onConfirmFinish: () => void;
  isFinishing: boolean;
}
```

**Step 2: Replace validate-transfer.model.ts**

Current issues:
- No SWR fetcher (2 calls, both broken)
- Uses raw `ky` (no auth)
- `/validation-status` endpoint doesn't exist
- Scan response shape wrong
- Discrepancy report shape wrong
- All scanner state/effects should be in model (not view)
- Missing `useBreadcrumb`

Since `/validation-status` doesn't exist, we use `/validation-logs` to track scan history and derive progress from it combined with transfer items.

```ts
// app/(pages)/transfers/[id]/validate/validate-transfer.model.ts
import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  Transfer,
  TransferDetailResponse,
  ScanResponse,
  DiscrepancyItem,
  DiscrepancyReportResponse,
  ValidationLogsResponse,
  ValidationLogEntry,
} from "../../transfers.types";
import { ScanResultItem, ExpectedItem } from "./validate-transfer.types";
import { useBreadcrumb } from "@/components/breadcrumb";

export const useValidateTransferModel = (transferId: string) => {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyItem[]>([]);
  const [lastScanResult, setLastScanResult] = useState<ScanResultItem | null>(null);
  const [barcode, setBarcode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep focus on input
  useEffect(() => {
    const focusInput = () => inputRef.current?.focus();
    focusInput();
    window.addEventListener("click", focusInput);
    return () => window.removeEventListener("click", focusInput);
  }, []);

  // Fetch transfer details
  const { data: transferData, isLoading: isLoadingTransfer } = useSWR<TransferDetailResponse>(
    transferId ? `transfers/${transferId}` : null,
    async (url: string) => {
      return await api.get(url).json<TransferDetailResponse>();
    }
  );

  const transfer = transferData?.data;

  // Fetch validation logs (scan history)
  const { data: logsData, isLoading: isLoadingLogs, mutate: mutateLogs } = useSWR<ValidationLogsResponse>(
    transferId ? `transfers/${transferId}/validation-logs` : null,
    async (url: string) => {
      return await api.get(url).json<ValidationLogsResponse>();
    }
  );

  const validationLogs = logsData?.data || [];

  useBreadcrumb({
    title: transfer?.code ? `Validação ${transfer.code}` : "Validação",
    backUrl: transferId ? `/transfers/${transferId}` : "/transfers",
    section: "Transferências",
    subsection: "Validação",
  });

  const isLoading = isLoadingTransfer || isLoadingLogs;

  // Derive expected items from transfer items + validation logs
  const expectedItems: ExpectedItem[] = useMemo(() => {
    if (!transfer) return [];

    // Count scanned quantity per product by matching productName from logs
    const scannedCounts: Record<string, number> = {};
    validationLogs.forEach((log) => {
      if (log.valid) {
        scannedCounts[log.productName] = (scannedCounts[log.productName] || 0) + 1;
      }
    });

    return transfer.items.map((item) => ({
      id: item.id,
      productName: item.productName || "Produto desconhecido",
      batchCode: item.batchCode || "Sem lote",
      expectedQuantity: item.quantity,
      scannedQuantity: scannedCounts[item.productName || ""] || 0,
    }));
  }, [transfer, validationLogs]);

  // Calculate global progress
  const progress = useMemo(() => {
    if (!expectedItems.length) return 0;
    const totalExpected = expectedItems.reduce((acc, item) => acc + item.expectedQuantity, 0);
    const totalScanned = expectedItems.reduce((acc, item) => acc + item.scannedQuantity, 0);
    if (totalExpected === 0) return 100;
    return Math.min(100, (totalScanned / totalExpected) * 100);
  }, [expectedItems]);

  const handleScan = async () => {
    const trimmedBarcode = barcode.trim();
    if (!transferId || !trimmedBarcode || isProcessing) return;

    try {
      setIsProcessing(true);
      setBarcode("");

      const result = await api
        .post(`transfers/${transferId}/scan`, { json: { barcode: trimmedBarcode } })
        .json<ScanResponse>();

      const scanData = result.data;
      setLastScanResult(scanData);

      if (!scanData.valid) {
        toast.error(scanData.message || "Erro ao escanear item");
      }

      // Refresh validation logs
      await mutateLogs();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Erro de conexão ou código inválido.");
      setLastScanResult({
        valid: false,
        message: "Falha na comunicação com o servidor",
        productName: "Erro de leitura",
        productBarcode: trimmedBarcode,
        quantitySent: 0,
        quantityReceived: 0,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinish = async () => {
    if (!transferId) return;

    try {
      setIsProcessing(true);
      const report = await api
        .get(`transfers/${transferId}/discrepancy-report`)
        .json<DiscrepancyReportResponse>();

      setDiscrepancies(report.data.items);
      setShowFinishModal(true);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Erro ao gerar relatório de discrepâncias.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmFinish = async () => {
    if (!transferId) return;

    try {
      setIsFinishing(true);
      await api.post(`transfers/${transferId}/complete-validation`).json();

      toast.success("Validação concluída com sucesso!");
      setShowFinishModal(false);
      router.push(`/transfers/${transferId}`);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Erro ao finalizar validação.");
    } finally {
      setIsFinishing(false);
    }
  };

  return {
    isLoading,
    isProcessing,
    transfer,
    expectedItems,
    progress,
    lastScanResult,
    barcode,
    onBarcodeChange: setBarcode,
    onScan: handleScan,
    inputRef,
    onFinish: handleFinish,
    showFinishModal,
    setShowFinishModal,
    discrepancies,
    onConfirmFinish: handleConfirmFinish,
    isFinishing,
  };
};
```

**Step 3: Run tests**

Run: `pnpm test -- app/(pages)/transfers/`
Expected: PASS

**Step 4: Commit**

```bash
git add app/(pages)/transfers/[id]/validate/validate-transfer.types.ts app/(pages)/transfers/[id]/validate/validate-transfer.model.ts
git commit -m "fix(transfers): fix validate model with api client and correct response shapes"
```

---

## Task 7: Fix validate-transfer.view.tsx — remove state/effects, fix design

**Files:**
- Modify: `app/(pages)/transfers/[id]/validate/validate-transfer.view.tsx`

**Step 1: Replace the entire file**

Current issues:
- Contains `useState`, `useRef`, `useEffect` (MVVM violation — all moved to model in Task 6)
- `animate-pulse` on scanner icon
- `animate-in fade-in slide-in-from-top-4` on last scanned card
- `backdrop-blur` on header
- `text-muted-foreground` instead of explicit `text-neutral-*`
- `transition-colors` on expected items cards

The view now receives `barcode`, `onBarcodeChange`, `onScan`, `inputRef` from model.

```tsx
// app/(pages)/transfers/[id]/validate/validate-transfer.view.tsx
import Link from "next/link";
import { Check, AlertTriangle, ScanLine, Package, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ValidateTransferViewProps } from "./validate-transfer.types";
import { cn } from "@/lib/utils";

export function ValidateTransferView({
  isLoading,
  isProcessing,
  transfer,
  expectedItems,
  progress,
  lastScanResult,
  barcode,
  onBarcodeChange,
  onScan,
  inputRef,
  onFinish,
  showFinishModal,
  setShowFinishModal,
  discrepancies,
  onConfirmFinish,
  isFinishing,
}: ValidateTransferViewProps) {
  if (isLoading || !transfer) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-neutral-500">Carregando dados da transferência...</div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onScan();
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Progress Bar */}
      <div className="border-b border-neutral-800 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-3">
            <div>
              <h2 className="text-lg font-bold leading-none text-white">Validação #{transfer.code}</h2>
              <p className="text-xs text-neutral-500 mt-1">
                {transfer.sourceWarehouseName} → {transfer.destinationWarehouseName}
              </p>
            </div>
          </div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-neutral-500">Progresso</span>
            <span className="font-mono font-bold text-white">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-7xl mx-auto">
        {/* Scanner Input */}
        <Card className="border-l-4 border-l-blue-600 bg-[#171717] border-neutral-800 rounded-[4px]">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <ScanLine className="absolute left-3 top-2.5 h-5 w-5 text-blue-500" strokeWidth={2} />
                <Input
                  ref={inputRef}
                  value={barcode}
                  onChange={(e) => onBarcodeChange(e.target.value)}
                  placeholder="Escanear código de barras..."
                  className="pl-10 h-10 bg-neutral-900 border-neutral-800 focus-visible:ring-blue-600 rounded-[4px]"
                  autoComplete="off"
                  disabled={isProcessing}
                />
              </div>
              <Button
                type="submit"
                disabled={!barcode.trim() || isProcessing}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide uppercase rounded-[4px]"
              >
                Scan
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Last Scan Result */}
        {lastScanResult && (
          <Card className={cn(
            "border-l-4 bg-[#171717] border-neutral-800 rounded-[4px]",
            lastScanResult.valid ? "border-l-emerald-600" : "border-l-rose-600"
          )}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded-[4px]",
                  lastScanResult.valid ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                )}>
                  {lastScanResult.valid ? <Check className="h-5 w-5" strokeWidth={2} /> : <AlertCircle className="h-5 w-5" strokeWidth={2} />}
                </div>
                <div>
                  <p className="font-bold text-sm text-white">
                    {lastScanResult.valid ? "Sucesso" : "Erro"}
                  </p>
                  <p className="text-sm font-medium mt-1 text-neutral-300">{lastScanResult.productName}</p>
                  <p className="text-xs text-neutral-500 font-mono mt-1">Código: {lastScanResult.productBarcode}</p>
                  {lastScanResult.valid && (
                    <p className="text-xs text-neutral-400 mt-1">
                      Recebido: {lastScanResult.quantityReceived} / {lastScanResult.quantitySent}
                    </p>
                  )}
                  {!lastScanResult.valid && lastScanResult.message && (
                    <p className="text-xs text-rose-500 mt-2 font-medium">{lastScanResult.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expected Items List */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-3">Itens Esperados</h2>
          <div className="space-y-3">
            {expectedItems.map((item) => {
              const isComplete = item.scannedQuantity >= item.expectedQuantity;
              const isOverage = item.scannedQuantity > item.expectedQuantity;

              return (
                <Card key={item.id} className={cn(
                  "bg-[#171717] border-neutral-800 rounded-[4px]",
                  isComplete && "opacity-60"
                )}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-[4px]",
                        isComplete ? "bg-emerald-500/10 text-emerald-500" :
                        isOverage ? "bg-rose-500/10 text-rose-500" : "bg-neutral-800 text-neutral-400"
                      )}>
                        {isComplete ? <Check className="h-4 w-4" strokeWidth={2} /> :
                         isOverage ? <AlertTriangle className="h-4 w-4" strokeWidth={2} /> : <Package className="h-4 w-4" strokeWidth={2} />}
                      </div>
                      <div>
                        <p className={cn("font-medium text-sm", isComplete ? "text-neutral-500 line-through" : "text-white")}>
                          {item.productName}
                        </p>
                        <p className="text-xs text-neutral-500 font-mono">
                          {item.batchCode}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "text-sm font-bold font-mono",
                        isComplete ? "text-emerald-500" :
                        isOverage ? "text-rose-500" : "text-neutral-200"
                      )}>
                        {item.scannedQuantity} / {item.expectedQuantity}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="fixed bottom-0 left-0 right-0 md:ml-[240px] p-4 bg-[#0A0A0A] border-t border-neutral-800">
        <div className="max-w-7xl mx-auto">
          <Button
            className="w-full h-12 text-base font-bold tracking-wide uppercase bg-emerald-600 hover:bg-emerald-700 text-white rounded-[4px]"
            onClick={onFinish}
            disabled={isFinishing || expectedItems.every((i) => i.scannedQuantity === 0)}
          >
            Finalizar Validação
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showFinishModal} onOpenChange={setShowFinishModal}>
        <DialogContent className="bg-[#171717] border-neutral-800 text-neutral-200 max-h-[80vh] overflow-y-auto rounded-[4px]">
          <DialogHeader>
            <DialogTitle className="text-white">Confirmar Validação</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Revise o relatório de discrepâncias antes de finalizar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {discrepancies.length === 0 ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[4px] p-4 flex items-center gap-3">
                <Check className="h-5 w-5 text-emerald-500" strokeWidth={2} />
                <span className="text-sm font-medium text-emerald-500">Nenhuma discrepância encontrada. Tudo certo!</span>
              </div>
            ) : (
              <div className="space-y-3">
                {discrepancies.map((disc, idx) => (
                  <div key={idx} className={cn(
                    "p-3 rounded-[4px] border text-sm",
                    disc.discrepancyType === "OVERAGE"
                      ? "bg-rose-500/10 border-rose-500/20"
                      : "bg-amber-500/10 border-amber-500/20"
                  )}>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-white">{disc.productName}</span>
                      <span className={disc.discrepancyType === "OVERAGE" ? "text-rose-500" : "text-amber-500"}>
                        {disc.discrepancyType === "OVERAGE" ? "EXCESSO" : "FALTA"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-neutral-400">
                      <span>Esperado: {disc.quantitySent}</span>
                      <span>Recebido: {disc.quantityReceived}</span>
                      <span className="font-mono font-bold text-white">Dif: {disc.difference}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-neutral-900 rounded-[4px] p-4 text-xs text-neutral-500">
              <p>Ao confirmar, o estoque será atualizado conforme a quantidade recebida. Itens faltantes não serão adicionados ao estoque.</p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowFinishModal(false)} className="border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white rounded-[4px]">
              Voltar
            </Button>
            <Button onClick={onConfirmFinish} disabled={isFinishing} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-[4px]">
              {isFinishing ? "Processando..." : "Confirmar e Finalizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

**Step 2: Update validate page.tsx to remove React import**

```tsx
// app/(pages)/transfers/[id]/validate/page.tsx
"use client";

import { useParams } from "next/navigation";
import { ValidateTransferView } from "./validate-transfer.view";
import { useValidateTransferModel } from "./validate-transfer.model";

export default function ValidateTransferPage() {
  const params = useParams();
  const id = params?.id as string;

  const model = useValidateTransferModel(id);

  return <ValidateTransferView {...model} />;
}
```

**Step 3: Run tests**

Run: `pnpm test -- app/(pages)/transfers/`
Expected: PASS

**Step 4: Commit**

```bash
git add app/(pages)/transfers/[id]/validate/
git commit -m "fix(transfers): fix validate view MVVM violations and design issues"
```

---

## Task 8: Fix new-transfer.view.tsx — move state to model, add container

**Files:**
- Modify: `app/(pages)/transfers/new/new-transfer.types.ts`
- Modify: `app/(pages)/transfers/new/new-transfer.model.ts`
- Modify: `app/(pages)/transfers/new/new-transfer.view.tsx`

**Step 1: Update types to include new model props for item builder**

The view currently has 4 `useState` and business logic for adding items. Move all to model.

```ts
// app/(pages)/transfers/new/new-transfer.types.ts
import { UseFormReturn } from "react-hook-form";
import { NewTransferSchema } from "./new-transfer.schema";

export interface NewTransferViewProps {
  form: UseFormReturn<NewTransferSchema>;
  onSubmit: (data: NewTransferSchema) => void;
  warehouses: { id: string; name: string }[];
  products: { id: string; name: string }[];
  batches: { id: string; code: string; quantity: number }[];
  onSelectProduct: (productId: string) => void;
  isLoading: boolean;
  isSubmitting: boolean;

  // Item builder state (managed by model)
  selectedProductId: string;
  selectedBatchId: string;
  itemQuantity: string;
  addItemError: string | null;
  onProductChange: (productId: string) => void;
  onBatchChange: (batchId: string) => void;
  onQuantityChange: (value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  items: Array<{ id: string; productName?: string; batchCode?: string; quantity: number }>;
}
```

**Step 2: Update model to manage item builder state and add breadcrumb**

```ts
// app/(pages)/transfers/new/new-transfer.model.ts
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import { newTransferSchema, NewTransferSchema } from "./new-transfer.schema";
import { NewTransferViewProps } from "./new-transfer.types";
import { useBreadcrumb } from "@/components/breadcrumb";

const fetcher = async (url: string) => {
  return await api.get(url).json<any>();
};

export function useNewTransferModel(): NewTransferViewProps {
  const router = useRouter();
  const { warehouseId: currentWarehouseId } = useSelectedWarehouse();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [addItemError, setAddItemError] = useState<string | null>(null);

  useBreadcrumb({
    title: "Nova Transferência",
    backUrl: "/transfers",
    section: "Transferências",
    subsection: "Criar",
  });

  const form = useForm<NewTransferSchema>({
    resolver: zodResolver(newTransferSchema),
    defaultValues: {
      items: [],
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Fetch data
  const { data: warehousesData, isLoading: isLoadingWarehouses } = useSWR(
    "warehouses",
    fetcher
  );

  const { data: productsData, isLoading: isLoadingProducts } = useSWR(
    "products",
    fetcher
  );

  const { data: batchesData } = useSWR(
    selectedProductId ? `batches?productId=${selectedProductId}` : null,
    fetcher
  );

  // Filter warehouses to exclude current source
  const warehouses = (warehousesData?.data || [])
    .filter((w: any) => w.id !== currentWarehouseId)
    .map((w: any) => ({ id: w.id, name: w.name }));

  const products = (productsData?.data?.content || productsData?.data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
  }));

  const batches = (batchesData?.data?.content || batchesData?.data || []).map((b: any) => ({
    id: b.id,
    code: b.code,
    quantity: b.quantity,
  }));

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    setSelectedBatchId("");
    setItemQuantity("");
    setAddItemError(null);
  };

  const handleAddItem = () => {
    setAddItemError(null);

    if (!selectedProductId) {
      setAddItemError("Selecione um produto.");
      return;
    }
    if (!selectedBatchId) {
      setAddItemError("Selecione um lote.");
      return;
    }

    const qty = Number(itemQuantity);
    if (!qty || qty <= 0) {
      setAddItemError("Quantidade inválida.");
      return;
    }

    const batch = batches.find((b: { id: string }) => b.id === selectedBatchId);
    if (!batch) {
      setAddItemError("Lote inválido.");
      return;
    }

    if (qty > batch.quantity) {
      setAddItemError(`Quantidade indisponível no lote (Máx: ${batch.quantity}).`);
      return;
    }

    const product = products.find((p: { id: string }) => p.id === selectedProductId);

    append({
      sourceBatchId: selectedBatchId,
      quantity: qty,
      productName: product?.name || "Desconhecido",
      batchCode: batch.code,
      availableQuantity: batch.quantity,
    });

    setSelectedProductId("");
    setSelectedBatchId("");
    setItemQuantity("");
  };

  const onSubmit = async (data: NewTransferSchema) => {
    if (!currentWarehouseId) {
      toast.error("Selecione um warehouse de origem.");
      return;
    }

    if (data.destinationWarehouseId === currentWarehouseId) {
      form.setError("destinationWarehouseId", {
        message: "O destino não pode ser igual à origem.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("transfers", {
        json: {
          destinationWarehouseId: data.destinationWarehouseId,
          notes: data.notes || undefined,
          items: data.items.map((item) => ({
            sourceBatchId: item.sourceBatchId,
            quantity: item.quantity,
          })),
        },
      });

      toast.success("Transferência criada com sucesso!");
      router.push("/transfers");
    } catch (error: any) {
      const errorMessage = error.message || "Erro ao criar transferência.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    onSubmit,
    warehouses,
    products,
    batches,
    onSelectProduct: handleProductChange,
    isLoading: isLoadingWarehouses || isLoadingProducts,
    isSubmitting,
    selectedProductId,
    selectedBatchId,
    itemQuantity,
    addItemError,
    onProductChange: handleProductChange,
    onBatchChange: setSelectedBatchId,
    onQuantityChange: setItemQuantity,
    onAddItem: handleAddItem,
    onRemoveItem: remove,
    items: fields,
  };
}
```

**Step 3: Replace the view (pure JSX, no state)**

```tsx
// app/(pages)/transfers/new/new-transfer.view.tsx
import { Plus, Trash2, ArrowRight, Package, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { NewTransferViewProps } from "./new-transfer.types";

export function NewTransferView({
  form,
  onSubmit,
  warehouses,
  products,
  batches,
  isLoading,
  isSubmitting,
  selectedProductId,
  selectedBatchId,
  itemQuantity,
  addItemError,
  onProductChange,
  onBatchChange,
  onQuantityChange,
  onAddItem,
  onRemoveItem,
  items,
}: NewTransferViewProps) {
  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-6 md:px-6 lg:px-8 pb-24">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Destination Warehouse */}
          <Card className="bg-[#171717] border-neutral-800 rounded-[4px]">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-blue-600" strokeWidth={2} />
                Destino
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="destinationWarehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-300">Warehouse de Destino</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-neutral-900 border-neutral-800 rounded-[4px] text-white focus:ring-blue-600">
                          <SelectValue placeholder="Selecione o destino..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-neutral-900 border-neutral-800 rounded-[4px]">
                        {warehouses.map((w) => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-rose-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel className="text-neutral-300">Observações (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Motivo da transferência..."
                        className="bg-neutral-900 border-neutral-800 rounded-[4px] text-white focus:border-blue-600 min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-rose-500" />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Add Items Section */}
          <Card className="bg-[#171717] border-neutral-800 rounded-[4px]">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="h-5 w-5 text-emerald-600" strokeWidth={2} />
                Adicionar Item
              </CardTitle>
              <CardDescription className="text-neutral-500">
                Selecione o produto e o lote de origem.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                {/* Product */}
                <div className="md:col-span-5 space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Produto</label>
                  <Select value={selectedProductId} onValueChange={onProductChange}>
                    <SelectTrigger className="bg-neutral-900 border-neutral-800 rounded-[4px] text-white">
                      <SelectValue placeholder="Buscar produto..." />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800 rounded-[4px]">
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Batch */}
                <div className="md:col-span-4 space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Lote (Disponível)</label>
                  <Select value={selectedBatchId} onValueChange={onBatchChange} disabled={!selectedProductId}>
                    <SelectTrigger className="bg-neutral-900 border-neutral-800 rounded-[4px] text-white disabled:opacity-50">
                      <SelectValue placeholder="Selecione o lote" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800 rounded-[4px]">
                      {batches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.code} ({b.quantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Qtd.</label>
                  <Input
                    type="number"
                    value={itemQuantity}
                    onChange={(e) => onQuantityChange(e.target.value)}
                    className="bg-neutral-900 border-neutral-800 rounded-[4px] text-white"
                    placeholder="0"
                    min={1}
                  />
                </div>

                {/* Add Button */}
                <div className="md:col-span-1">
                  <Button
                    type="button"
                    onClick={onAddItem}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-[4px]"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                  </Button>
                </div>
              </div>

              {addItemError && (
                <Alert variant="destructive" className="bg-rose-500/10 border-rose-900 text-rose-500 rounded-[4px]">
                  <AlertCircle className="h-4 w-4" strokeWidth={2} />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{addItemError}</AlertDescription>
                </Alert>
              )}

              <Separator className="bg-neutral-800 my-4" />

              {/* Items List */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-neutral-400">
                  Itens na Transferência ({items.length})
                </h3>

                {items.length === 0 && (
                  <div className="text-center py-8 text-neutral-600 border border-dashed border-neutral-800 rounded-[4px]">
                    Nenhum item adicionado
                  </div>
                )}

                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-neutral-900/50 border border-neutral-800 rounded-[4px]"
                    >
                      <div className="grid grid-cols-3 gap-4 flex-1">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">
                            {item.productName}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-neutral-500">Lote</span>
                          <span className="text-sm text-neutral-300">
                            {item.batchCode}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-neutral-500">Qtd.</span>
                          <span className="text-sm font-bold text-white">
                            {item.quantity}
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveItem(index)}
                        className="text-neutral-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-[4px]"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </Button>
                    </div>
                  ))}
                </div>
                {form.formState.errors.items && (
                  <p className="text-sm font-medium text-rose-500">
                    {form.formState.errors.items.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
              className="bg-transparent border-neutral-700 text-neutral-300 hover:bg-neutral-900 rounded-[4px] uppercase tracking-wide"
            >
              CANCELAR
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide rounded-[4px] px-8 uppercase"
            >
              {isSubmitting ? "CRIANDO..." : "CRIAR TRANSFERÊNCIA"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
```

**Step 4: Update new-transfer.view.test.tsx to match new props**

```tsx
// app/(pages)/transfers/new/new-transfer.view.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NewTransferView } from "./new-transfer.view";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { newTransferSchema, NewTransferSchema } from "./new-transfer.schema";
import { NewTransferViewProps } from "./new-transfer.types";
import React from "react";

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const TestWrapper = (props: Partial<NewTransferViewProps>) => {
  const form = useForm<NewTransferSchema>({
    resolver: zodResolver(newTransferSchema),
    defaultValues: {
      items: [],
    },
  });

  const defaultProps: NewTransferViewProps = {
    form,
    onSubmit: vi.fn(),
    warehouses: [
      { id: "w1", name: "Warehouse A" },
      { id: "w2", name: "Warehouse B" },
    ],
    products: [{ id: "p1", name: "Product 1" }],
    batches: [{ id: "b1", code: "BATCH-001", quantity: 100 }],
    onSelectProduct: vi.fn(),
    isLoading: false,
    isSubmitting: false,
    selectedProductId: "",
    selectedBatchId: "",
    itemQuantity: "",
    addItemError: null,
    onProductChange: vi.fn(),
    onBatchChange: vi.fn(),
    onQuantityChange: vi.fn(),
    onAddItem: vi.fn(),
    onRemoveItem: vi.fn(),
    items: [],
    ...props,
  };

  return <NewTransferView {...defaultProps} />;
};

describe("NewTransferView", () => {
  it("renders the form correctly", () => {
    render(<TestWrapper />);
    expect(screen.getByText("Destino")).toBeTruthy();
    expect(screen.getByText("Adicionar Item")).toBeTruthy();

    const buttons = screen.getAllByText("CRIAR TRANSFERÊNCIA");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("shows validation errors when submitting empty form", async () => {
    render(<TestWrapper />);

    const submitBtn = screen.getAllByText("CRIAR TRANSFERÊNCIA")[0];
    fireEvent.click(submitBtn);

    expect(await screen.findByText("Selecione um warehouse de destino")).toBeTruthy();
    expect(await screen.findByText("Adicione pelo menos um item")).toBeTruthy();
  });
});
```

**Step 5: Run tests**

Run: `pnpm test -- app/(pages)/transfers/new/`
Expected: PASS

**Step 6: Commit**

```bash
git add app/(pages)/transfers/new/
git commit -m "fix(transfers): move state from view to model, add container and breadcrumb"
```

---

## Task 9: Run full test suite and verify build

**Step 1: Run all transfer tests**

Run: `pnpm test -- app/(pages)/transfers/`
Expected: PASS

**Step 2: Run full test suite**

Run: `pnpm test`
Expected: PASS

**Step 3: Verify build compiles**

Run: `pnpm build`
Expected: No TypeScript errors

**Step 4: Fix any issues found and commit**

If any fixes are needed:

```bash
git add -A
git commit -m "fix(transfers): stabilize after review fixes"
```
