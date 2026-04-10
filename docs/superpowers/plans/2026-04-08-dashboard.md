# Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an executive dashboard page at `/dashboard` that displays KPIs, charts, recent movements, and movement stats from the reports API.

**Architecture:** MVVM pattern — types, model (SWR hook), view (pure JSX), page (orchestrator). Uses existing UI components (InsightCard, StatusCard, SectionLabel, PageContainer, PageHeader, ChartContainer) and Recharts for charts.

**Tech Stack:** Next.js 15, TypeScript, SWR, ky, Recharts, Tailwind CSS, shadcn/ui components

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `app/(pages)/dashboard/dashboard.types.ts` | API response interfaces |
| Create | `app/(pages)/dashboard/dashboard.model.ts` | SWR hook, data formatting |
| Create | `app/(pages)/dashboard/dashboard.view.tsx` | Pure JSX dashboard layout |
| Create | `app/(pages)/dashboard/page.tsx` | ViewModel orchestrator |
| Create | `app/(pages)/dashboard/dashboard.model.test.ts` | Model unit tests |

---

### Task 1: Types

**Files:**
- Create: `app/(pages)/dashboard/dashboard.types.ts`

- [ ] **Step 1: Create the types file**

```typescript
// app/(pages)/dashboard/dashboard.types.ts

export interface DashboardMovementStatsPeriod {
  entries: number;
  exits: number;
  transfers: number;
  adjustments: number;
}

export interface DashboardMovementStats {
  today: DashboardMovementStatsPeriod;
  thisWeek: DashboardMovementStatsPeriod;
  thisMonth: DashboardMovementStatsPeriod;
}

export interface DashboardRecentMovement {
  id: string;
  movementType: "ENTRY" | "EXIT" | "TRANSFER" | "ADJUSTMENT";
  status: string;
  createdAt: string;
  productCount: number;
  notes: string | null;
}

export interface DashboardStockByWarehouse {
  warehouseId: string;
  warehouseName: string;
  batchCount: number;
  stockValue: number;
  productCount: number;
}

export interface DashboardStockByCategory {
  categoryId: string;
  categoryName: string;
  batchCount: number;
  stockValue: number;
  productCount: number;
}

export interface DashboardData {
  totalProducts: number;
  activeProducts: number;
  totalWarehouses: number;
  activeWarehouses: number;
  totalBatches: number;
  totalStockValue: number;
  lowStockCount: number;
  expiringCount: number;
  recentMovements: DashboardRecentMovement[];
  stockByWarehouse: DashboardStockByWarehouse[];
  stockByCategory: DashboardStockByCategory[];
  movementStats: DashboardMovementStats;
}

export interface DashboardResponse {
  success: boolean;
  message: string | null;
  data: DashboardData;
}

export interface DashboardViewProps {
  data: DashboardData | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(pages)/dashboard/dashboard.types.ts
git commit -m "feat: add dashboard types for reports API"
```

---

### Task 2: Model

**Files:**
- Create: `app/(pages)/dashboard/dashboard.model.ts`

- [ ] **Step 1: Create the model file**

```typescript
// app/(pages)/dashboard/dashboard.model.ts

import useSWR from "swr";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { DashboardResponse } from "./dashboard.types";

export function useDashboardModel() {
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<DashboardResponse>(
    "reports/dashboard",
    async (url: string) => {
      try {
        return await api.get(url).json<DashboardResponse>();
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
        toast.error("Erro ao carregar dashboard");
        throw err;
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    }
  );

  return {
    data: data?.data,
    isLoading,
    error: error ?? null,
    onRetry: () => mutate(),
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(pages)/dashboard/dashboard.model.ts
git commit -m "feat: add dashboard model with SWR data fetching"
```

---

### Task 3: View

**Files:**
- Create: `app/(pages)/dashboard/dashboard.view.tsx`

- [ ] **Step 1: Create the view file**

```tsx
// app/(pages)/dashboard/dashboard.view.tsx

"use client";

import {
  Package,
  DollarSign,
  AlertTriangle,
  CalendarClock,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  Wrench,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  TrendingUp,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart as RechartsPie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { InsightCard } from "@/components/ui/insight-card";
import { StatusCard } from "@/components/ui/status-card";
import { SectionLabel } from "@/components/ui/section-label";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import type { DashboardViewProps } from "./dashboard.types";

const MOVEMENT_COLORS: Record<string, string> = {
  ENTRY: "#059669",
  EXIT: "#E11D48",
  TRANSFER: "#2563EB",
  ADJUSTMENT: "#737373",
};

const MOVEMENT_ICONS: Record<string, typeof ArrowDownCircle> = {
  ENTRY: ArrowDownCircle,
  EXIT: ArrowUpCircle,
  TRANSFER: ArrowLeftRight,
  ADJUSTMENT: Wrench,
};

const MOVEMENT_LABELS: Record<string, string> = {
  ENTRY: "Entrada",
  EXIT: "Saída",
  TRANSFER: "Transferência",
  ADJUSTMENT: "Ajuste",
};

const BAR_COLORS = ["#2563EB", "#059669", "#F59E0B", "#E11D48", "#8B5CF6"];

const DONUT_COLORS = ["#2563EB", "#059669", "#F59E0B", "#E11D48", "#8B5CF6", "#06B6D4", "#EC4899", "#84CC16"];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1).replace(".0", "")}M`;
  }
  if (value >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(1).replace(".0", "")}K`;
  }
  return formatCurrency(value);
}

// --- Loading Skeleton ---
function DashboardSkeleton() {
  return (
    <PageContainer>
      <PageHeader title="Dashboard" subtitle="Visão Geral" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-[4px]" />
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[280px] rounded-[4px]" />
        <Skeleton className="h-[280px] rounded-[4px]" />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[280px] rounded-[4px]" />
        <Skeleton className="h-[280px] rounded-[4px]" />
      </div>
    </PageContainer>
  );
}

// --- KPI Section ---
function KPISection({ data }: { data: DashboardViewProps["data"] }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <InsightCard
        icon={Package}
        color="blue"
        label="Produtos Ativos"
        value={data?.activeProducts ?? 0}
        suffix={`de ${data?.totalProducts ?? 0}`}
      />
      <InsightCard
        icon={DollarSign}
        color="emerald"
        label="Valor em Estoque"
        value={formatCompactCurrency(data?.totalStockValue ?? 0)}
        suffix={`${data?.totalBatches ?? 0} lotes`}
      />
      <InsightCard
        icon={AlertTriangle}
        color="amber"
        label="Estoque Baixo"
        value={data?.lowStockCount ?? 0}
        suffix="alertas"
      />
      <InsightCard
        icon={CalendarClock}
        color="rose"
        label="Expirando"
        value={data?.expiringCount ?? 0}
        suffix="itens"
      />
    </div>
  );
}

// --- Bar Chart: Stock by Warehouse ---
function WarehouseChart({
  data,
}: {
  data: { warehouseName: string; stockValue: number }[];
}) {
  const config: ChartConfig = {};
  data.forEach((item, i) => {
    config[item.warehouseName] = {
      label: item.warehouseName,
      color: BAR_COLORS[i % BAR_COLORS.length],
    };
  });

  return (
    <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-5">
      <SectionLabel icon={BarChart3}>Estoque por Armazém</SectionLabel>
      <div className="mt-4">
        <ChartContainer config={config} className="h-[220px] w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
            <XAxis
              type="number"
              tickFormatter={(v: number) => formatCompactCurrency(v)}
              stroke="#525252"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="warehouseName"
              stroke="#525252"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => formatCurrency(Number(value))}
                />
              }
            />
            <Bar dataKey="stockValue" radius={[0, 4, 4, 0]} barSize={24}>
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={BAR_COLORS[i % BAR_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}

// --- Donut Chart: Stock by Category ---
function CategoryChart({
  data,
}: {
  data: { categoryName: string; stockValue: number }[];
}) {
  const config: ChartConfig = {};
  data.forEach((item, i) => {
    config[item.categoryName] = {
      label: item.categoryName,
      color: DONUT_COLORS[i % DONUT_COLORS.length],
    };
  });

  const total = data.reduce((acc, d) => acc + d.stockValue, 0);

  return (
    <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-5">
      <SectionLabel icon={PieChart}>Distribuição por Categoria</SectionLabel>
      <div className="mt-4">
        <ChartContainer config={config} className="h-[220px] w-full">
          <RechartsPie>
            <Pie
              data={data}
              dataKey="stockValue"
              nameKey="categoryName"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={DONUT_COLORS[i % DONUT_COLORS.length]}
                />
              ))}
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => formatCurrency(Number(value))}
                />
              }
            />
          </RechartsPie>
        </ChartContainer>
      </div>
      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {data.map((item, i) => (
          <div key={item.categoryName} className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
            />
            <span className="text-[10px] text-neutral-400">
              {item.categoryName}
              <span className="ml-1 text-neutral-600">
                {((item.stockValue / total) * 100).toFixed(0)}%
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Recent Movements Timeline ---
function RecentMovementsTimeline({
  movements,
}: {
  movements: DashboardViewProps["data"]["recentMovements"];
}) {
  if (!movements || movements.length === 0) {
    return (
      <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-5">
        <SectionLabel icon={Activity}>Movimentações Recentes</SectionLabel>
        <div className="mt-6 flex flex-col items-center gap-2 py-8">
          <Clock className="h-8 w-8 text-neutral-700" strokeWidth={2} />
          <p className="text-xs text-neutral-500">Nenhuma movimentação recente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-5">
      <SectionLabel icon={Activity}>Movimentações Recentes</SectionLabel>
      <div className="mt-4 space-y-0">
        {movements.map((movement, index) => {
          const Icon = MOVEMENT_ICONS[movement.movementType] || Wrench;
          const color = MOVEMENT_COLORS[movement.movementType] || "#737373";
          const label = MOVEMENT_LABELS[movement.movementType] || movement.movementType;
          const isLast = index === movements.length - 1;

          return (
            <div key={movement.id} className="flex gap-3">
              {/* Timeline line + icon */}
              <div className="flex flex-col items-center">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color }} strokeWidth={2} />
                </div>
                {!isLast && (
                  <div className="w-px flex-1 bg-neutral-800" />
                )}
              </div>
              {/* Content */}
              <div className={cn("flex-1 pb-4", isLast && "pb-0")}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-bold uppercase tracking-wide"
                      style={{ color }}
                    >
                      {label}
                    </span>
                    <Badge
                      variant="outline"
                      className="rounded-[2px] border-neutral-700 bg-neutral-900 px-1.5 py-0 text-[9px] font-bold uppercase text-neutral-400"
                    >
                      {movement.status}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-neutral-600">
                    {formatDistanceToNow(new Date(movement.createdAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-neutral-500 line-clamp-1">
                  {movement.productCount} produto{movement.productCount !== 1 ? "s" : ""}
                  {movement.notes ? ` — ${movement.notes}` : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Movement Stats ---
function MovementStats({
  stats,
}: {
  stats: DashboardViewProps["data"]["movementStats"];
}) {
  const periods = [
    { label: "Hoje", data: stats.today },
    { label: "Esta Semana", data: stats.thisWeek },
    { label: "Este Mês", data: stats.thisMonth },
  ];

  const metrics: {
    key: keyof typeof stats.today;
    label: string;
    color: string;
    bgColor: string;
  }[] = [
    { key: "entries", label: "Entradas", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
    { key: "exits", label: "Saídas", color: "text-rose-400", bgColor: "bg-rose-500/10" },
    { key: "transfers", label: "Transferências", color: "text-blue-400", bgColor: "bg-blue-500/10" },
    { key: "adjustments", label: "Ajustes", color: "text-neutral-400", bgColor: "bg-neutral-500/10" },
  ];

  return (
    <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-5">
      <SectionLabel icon={TrendingUp}>Estatísticas de Movimentação</SectionLabel>
      <div className="mt-4 grid grid-cols-3 gap-4">
        {periods.map((period) => (
          <div key={period.label}>
            <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
              {period.label}
            </div>
            <div className="space-y-2">
              {metrics.map((metric) => (
                <div
                  key={metric.key}
                  className="flex items-center justify-between rounded-[4px] border border-neutral-800/50 px-3 py-2"
                >
                  <span className={cn("text-[10px] font-bold uppercase tracking-wide", metric.color)}>
                    {metric.label}
                  </span>
                  <span className="font-mono text-sm font-bold tracking-tighter text-white">
                    {period.data[metric.key]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main View ---
export function DashboardView({ data, isLoading, error, onRetry }: DashboardViewProps) {
  if (isLoading) return <DashboardSkeleton />;

  if (error) {
    return (
      <PageContainer>
        <ErrorState
          title="Erro ao carregar dashboard"
          description="Não foi possível carregar os dados do dashboard. Tente novamente."
          onRetry={onRetry}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Dashboard" subtitle="Visão Geral" />

      {/* KPI Cards */}
      <KPISection data={data} />

      {/* Charts Row */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <WarehouseChart
          data={
            data?.stockByWarehouse?.map((w) => ({
              warehouseName: w.warehouseName,
              stockValue: w.stockValue,
            })) ?? []
          }
        />
        <CategoryChart
          data={
            data?.stockByCategory?.map((c) => ({
              categoryName: c.categoryName,
              stockValue: c.stockValue,
            })) ?? []
          }
        />
      </div>

      {/* Bottom Row */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <RecentMovementsTimeline movements={data?.recentMovements ?? []} />
        <MovementStats stats={data?.movementStats ?? {
          today: { entries: 0, exits: 0, transfers: 0, adjustments: 0 },
          thisWeek: { entries: 0, exits: 0, transfers: 0, adjustments: 0 },
          thisMonth: { entries: 0, exits: 0, transfers: 0, adjustments: 0 },
        }} />
      </div>
    </PageContainer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(pages)/dashboard/dashboard.view.tsx
git commit -m "feat: add dashboard view with charts, timeline and stats"
```

---

### Task 4: Page (Orchestrator)

**Files:**
- Create: `app/(pages)/dashboard/page.tsx`

- [ ] **Step 1: Create the page file**

```tsx
// app/(pages)/dashboard/page.tsx

"use client";

import { useDashboardModel } from "./dashboard.model";
import { DashboardView } from "./dashboard.view";

export default function DashboardPage() {
  const model = useDashboardModel();

  return <DashboardView {...model} />;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(pages)/dashboard/page.tsx
git commit -m "feat: add dashboard page orchestrator"
```

---

### Task 5: Model Tests

**Files:**
- Create: `app/(pages)/dashboard/dashboard.model.test.ts`

- [ ] **Step 1: Create the test file**

```typescript
// app/(pages)/dashboard/dashboard.model.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDashboardModel } from "./dashboard.model";

const mockMutate = vi.fn();
const mockGet = vi.fn();

const mockDashboardData = {
  success: true,
  message: null,
  data: {
    totalProducts: 150,
    activeProducts: 142,
    totalWarehouses: 3,
    activeWarehouses: 3,
    totalBatches: 287,
    totalStockValue: 125430.5,
    lowStockCount: 12,
    expiringCount: 8,
    recentMovements: [
      {
        id: "1",
        movementType: "ENTRY",
        status: "COMPLETED",
        createdAt: "2025-12-28T10:00:00Z",
        productCount: 5,
        notes: "Purchase order #12345",
      },
    ],
    stockByWarehouse: [
      {
        warehouseId: "wh-1",
        warehouseName: "Main Warehouse",
        batchCount: 150,
        stockValue: 75200.0,
        productCount: 89,
      },
    ],
    stockByCategory: [
      {
        categoryId: "cat-1",
        categoryName: "Electronics",
        batchCount: 45,
        stockValue: 35000.0,
        productCount: 25,
      },
    ],
    movementStats: {
      today: { entries: 5, exits: 3, transfers: 2, adjustments: 1 },
      thisWeek: { entries: 23, exits: 18, transfers: 7, adjustments: 4 },
      thisMonth: { entries: 95, exits: 78, transfers: 25, adjustments: 12 },
    },
  },
};

vi.mock("swr", () => ({
  default: vi.fn(() => ({
    data: undefined,
    error: undefined,
    isLoading: true,
    mutate: mockMutate,
  })),
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe("useDashboardModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return isLoading true initially", () => {
    const { result } = renderHook(() => useDashboardModel());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it("should call SWR with correct endpoint key", () => {
    renderHook(() => useDashboardModel());
    const swr = vi.mocked(await import("swr")).default;
    expect(swr).toHaveBeenCalledWith(
      "reports/dashboard",
      expect.any(Function),
      expect.objectContaining({
        revalidateOnFocus: false,
        dedupingInterval: 300000,
      })
    );
  });

  it("should return onRetry that calls mutate", () => {
    const { result } = renderHook(() => useDashboardModel());
    result.current.onRetry();
    expect(mockMutate).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify**

Run: `pnpm test -- --run app/(pages)/dashboard/dashboard.model.test.ts`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add app/(pages)/dashboard/dashboard.model.test.ts
git commit -m "test: add dashboard model unit tests"
```

---

### Task 6: Build Verification

- [ ] **Step 1: Run build to check for type/lint errors**

Run: `pnpm build`
Expected: Build succeeds with no errors

- [ ] **Step 2: Run all tests**

Run: `pnpm test -- --run`
Expected: All tests pass

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: resolve dashboard build issues"
```
