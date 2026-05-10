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
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { InsightCard } from "@/components/ui/insight-card";
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
import type {
  DashboardMovementStats,
  DashboardRecentMovement,
  DashboardViewProps,
} from "./dashboard.types";

type DynamicRechartsProps = Record<string, unknown>;
type DynamicRechartsComponent = ComponentType<DynamicRechartsProps>;

const Bar = dynamic<DynamicRechartsProps>(() =>
  import("recharts").then((mod) => mod.Bar as unknown as DynamicRechartsComponent),
);
const BarChart = dynamic<DynamicRechartsProps>(() =>
  import("recharts").then((mod) => mod.BarChart as unknown as DynamicRechartsComponent),
);
const Cell = dynamic<DynamicRechartsProps>(() =>
  import("recharts").then((mod) => mod.Cell as unknown as DynamicRechartsComponent),
);
const Pie = dynamic<DynamicRechartsProps>(() =>
  import("recharts").then((mod) => mod.Pie as unknown as DynamicRechartsComponent),
);
const RechartsPie = dynamic<DynamicRechartsProps>(() =>
  import("recharts").then((mod) => mod.PieChart as unknown as DynamicRechartsComponent),
);
const XAxis = dynamic<DynamicRechartsProps>(() =>
  import("recharts").then((mod) => mod.XAxis as unknown as DynamicRechartsComponent),
);
const YAxis = dynamic<DynamicRechartsProps>(() =>
  import("recharts").then((mod) => mod.YAxis as unknown as DynamicRechartsComponent),
);

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
const DONUT_COLORS = [
  "#2563EB",
  "#059669",
  "#F59E0B",
  "#E11D48",
  "#8B5CF6",
  "#06B6D4",
  "#EC4899",
  "#84CC16",
];

const DASHBOARD_CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const DASHBOARD_COUNT_FORMATTER = new Intl.NumberFormat("pt-BR");

function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1).replace(".0", "")}M`;
  }
  if (value >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(1).replace(".0", "")}K`;
  }
  return DASHBOARD_CURRENCY_FORMATTER.format(value);
}

function formatCurrency(value: number): string {
  return DASHBOARD_CURRENCY_FORMATTER.format(value);
}

function formatCount(value: number): string {
  return DASHBOARD_COUNT_FORMATTER.format(value);
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
  const hasStockValue = (data?.totalStockValue ?? 0) > 0;

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
        value={
          hasStockValue
            ? formatCompactCurrency(data?.totalStockValue ?? 0)
            : data?.totalBatches
              ? "Sem custo"
              : formatCompactCurrency(0)
        }
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
  data: { warehouseName: string; stockValue: number; productCount: number }[];
}) {
  const hasMonetaryData = data.some((item) => item.stockValue > 0);
  const metricKey = hasMonetaryData ? "stockValue" : "productCount";

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
      {!hasMonetaryData && data.length > 0 && (
        <p className="mt-2 text-[10px] uppercase tracking-wide text-neutral-500">
          Sem custos cadastrados, exibindo produtos por armazém
        </p>
      )}
      <div className="mt-4">
        <ChartContainer config={config} className="h-[220px] w-full">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 10, right: 20 }}
          >
            <XAxis
              type="number"
              tickFormatter={(v: number) =>
                hasMonetaryData ? formatCompactCurrency(v) : formatCount(v)
              }
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
                  formatter={(value) =>
                    hasMonetaryData
                      ? formatCurrency(Number(value))
                      : `${formatCount(Number(value))} produtos`
                  }
                />
              }
            />
            <Bar dataKey={metricKey} radius={[0, 4, 4, 0]} barSize={24}>
              {data.map((item, i) => (
                <Cell key={item.warehouseName} fill={BAR_COLORS[i % BAR_COLORS.length]} />
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
  data: { categoryName: string; stockValue: number; productCount: number }[];
}) {
  const hasMonetaryData = data.some((item) => item.stockValue > 0);
  const metricKey = hasMonetaryData ? "stockValue" : "productCount";

  const config: ChartConfig = {};
  data.forEach((item, i) => {
    config[item.categoryName] = {
      label: item.categoryName,
      color: DONUT_COLORS[i % DONUT_COLORS.length],
    };
  });

  const total = data.reduce(
    (acc, d) => acc + (hasMonetaryData ? d.stockValue : d.productCount),
    0
  );

  return (
    <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-5">
      <SectionLabel icon={PieChart}>Distribuição por Categoria</SectionLabel>
      {!hasMonetaryData && data.length > 0 && (
        <p className="mt-2 text-[10px] uppercase tracking-wide text-neutral-500">
          Sem custos cadastrados, exibindo produtos por categoria
        </p>
      )}
      <div className="mt-4">
        <ChartContainer config={config} className="h-[220px] w-full">
          <RechartsPie>
            <Pie
              data={data}
              dataKey={metricKey}
              nameKey="categoryName"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((item, i) => (
                <Cell
                  key={item.categoryName}
                  fill={DONUT_COLORS[i % DONUT_COLORS.length]}
                />
              ))}
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    hasMonetaryData
                      ? formatCurrency(Number(value))
                      : `${formatCount(Number(value))} produtos`
                  }
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
              className="size-2 shrink-0 rounded-[2px]"
              style={{
                backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length],
              }}
            />
            <span className="text-[10px] text-neutral-400">
              {item.categoryName}
              <span className="ml-1 text-neutral-600">
                {total > 0
                  ? (((hasMonetaryData ? item.stockValue : item.productCount) / total) * 100).toFixed(0)
                  : 0}
                %
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
  movements: DashboardRecentMovement[];
}) {
  if (!movements || movements.length === 0) {
    return (
      <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-5">
        <SectionLabel icon={Activity}>Movimentações Recentes</SectionLabel>
        <div className="mt-6 flex flex-col items-center gap-2 py-8">
          <Clock className="size-8 text-neutral-700" strokeWidth={2} />
          <p className="text-xs text-neutral-500">
            Nenhuma movimentação recente
          </p>
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
          const label =
            MOVEMENT_LABELS[movement.movementType] || movement.movementType;
          const isLast = index === movements.length - 1;

          return (
            <div key={movement.id} className="flex gap-3">
              {/* Timeline line + icon */}
              <div className="flex flex-col items-center">
                <div
                  className="flex size-7 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <Icon
                    className="size-3.5"
                    style={{ color }}
                    strokeWidth={2}
                  />
                </div>
                {!isLast && <div className="w-px flex-1 bg-neutral-800" />}
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
                    {formatDistanceToNow(parseISO(movement.createdAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-neutral-500 line-clamp-1">
                  {movement.productCount} produto
                  {movement.productCount !== 1 ? "s" : ""}
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
  stats: DashboardMovementStats;
}) {
  const periods = [
    { label: "Hoje", data: stats.today },
    { label: "Esta Semana", data: stats.thisWeek },
    { label: "Este Mês", data: stats.thisMonth },
  ];

  const metrics: {
    key: keyof (typeof stats)["today"];
    label: string;
    color: string;
  }[] = [
    { key: "entries", label: "Entradas", color: "text-emerald-400" },
    { key: "exits", label: "Saídas", color: "text-rose-400" },
    { key: "transfers", label: "Transferências", color: "text-blue-400" },
    { key: "adjustments", label: "Ajustes", color: "text-neutral-400" },
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
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wide",
                      metric.color
                    )}
                  >
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
export function DashboardView({
  data,
  isLoading,
  error,
  onRetry,
}: DashboardViewProps) {
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
              productCount: w.productCount,
            })) ?? []
          }
        />
        <CategoryChart
          data={
            data?.stockByCategory?.map((c) => ({
              categoryName: c.categoryName,
              stockValue: c.stockValue,
              productCount: c.productCount,
            })) ?? []
          }
        />
      </div>

      {/* Bottom Row */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <RecentMovementsTimeline
          movements={data?.recentMovements ?? []}
        />
        <MovementStats
          stats={
            data?.movementStats ?? {
              today: { entries: 0, exits: 0, transfers: 0, adjustments: 0 },
              thisWeek: { entries: 0, exits: 0, transfers: 0, adjustments: 0 },
              thisMonth: {
                entries: 0,
                exits: 0,
                transfers: 0,
                adjustments: 0,
              },
            }
          }
        />
      </div>
    </PageContainer>
  );
}
