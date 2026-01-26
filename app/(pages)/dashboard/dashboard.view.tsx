"use client";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Box,
  Calendar,
  Layers,
  Package,
  Plus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

import {
  formatCurrency,
  formatNumber,
  formatRelativeTime,
  getMovementTypeConfig,
  getStatusConfig,
} from "./dashboard.model";
import {
  AlertCardProps,
  ChartCardProps,
  DashboardData,
  KPICardProps,
  MovementTimelineProps,
  RecentMovement,
  DashboardViewProps,
} from "./dashboard.types";

// Chart colors following Corporate Solid Dark Vivid palette
const CHART_COLORS = [
  "#2563EB", // blue-600
  "#059669", // emerald-600
  "#F59E0B", // amber-500
  "#E11D48", // rose-600
  "#7C3AED", // violet-600
  "#0891B2", // cyan-600
];

// ============================================================================
// Alert Card Component
// ============================================================================
function AlertCard({ type, items, isLoading, onSeeAll }: AlertCardProps) {
  const isLowStock = type === "low-stock";
  const count = items?.length || 0;

  if (isLoading) {
    return <Skeleton className="h-[200px] w-full rounded-[4px]" />;
  }

  return (
    <div
      className={cn(
        "flex flex-col rounded-[4px] border border-neutral-800 bg-neutral-900 overflow-hidden",
        isLowStock
          ? "border-l-4 border-l-rose-600"
          : "border-l-4 border-l-amber-500",
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-neutral-800/50 bg-neutral-900/50">
        <div className="flex items-center gap-2">
          {isLowStock ? (
            <Package className="h-4 w-4 text-rose-500" />
          ) : (
            <Calendar className="h-4 w-4 text-amber-500" />
          )}
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            {isLowStock ? "Estoque Crítico" : "Vencimento Próximo"}
          </span>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "h-5 px-1.5 text-[10px] border-none font-bold",
            isLowStock
              ? "bg-rose-500/10 text-rose-500"
              : "bg-amber-500/10 text-amber-500",
          )}
        >
          {count} ITENS
        </Badge>
      </div>

      <ScrollArea className="h-[150px]">
        <div className="p-1">
          {items && items.length > 0 ? (
            items.slice(0, 10).map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between p-2 hover:bg-neutral-800/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-neutral-200">
                    {item.productName}
                  </p>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-tighter">
                    {item.warehouseName}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={cn(
                      "text-xs font-bold tracking-tighter",
                      isLowStock ? "text-rose-500" : "text-amber-500",
                    )}
                  >
                    {isLowStock
                      ? `${item.totalQuantity} un`
                      : formatRelativeTime(item.nearestExpiration || "")}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-neutral-600">
              <p className="text-[10px] uppercase font-bold tracking-widest">
                Sem alertas ativos
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      <button
        onClick={onSeeAll}
        className="mt-auto border-t border-neutral-800 bg-neutral-900/80 p-2 text-center text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all"
      >
        Visualizar Relatório Completo
      </button>
    </div>
  );
}

// ============================================================================
// KPI Card Component
// ============================================================================
function KPICard({
  value,
  label,
  icon: Icon,
  trend,
  format = "number",
  color = "blue",
}: KPICardProps) {
  const safeValue = Number(value || 0);
  const formattedValue =
    format === "currency" ? formatCurrency(safeValue) : formatNumber(safeValue);

  const colors = {
    blue: "text-blue-500 bg-blue-500/10",
    emerald: "text-emerald-500 bg-emerald-500/10",
    amber: "text-amber-500 bg-amber-500/10",
    rose: "text-rose-500 bg-rose-500/10",
  };

  return (
    <div className="group relative rounded-[4px] border border-neutral-800 bg-neutral-900 p-4 transition-all hover:border-neutral-700">
      <div className="flex items-start justify-between">
        <div className={cn("p-2 rounded-[4px]", colors[color])}>
          <Icon className="h-4 w-4" strokeWidth={2.5} />
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center text-[10px] font-bold tracking-tighter px-1.5 py-0.5 rounded-[4px]",
              trend.direction === "up"
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-rose-500/10 text-rose-500",
            )}
          >
            {trend.direction === "up" ? "+" : "-"}
            {trend.value}
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          {label}
        </p>
        <p className="text-2xl font-bold tracking-tighter text-white mt-1">
          {formattedValue}
        </p>
      </div>

      <div
        className={cn(
          "absolute bottom-0 left-0 h-[2px] w-0 transition-all group-hover:w-full",
          trend?.direction === "down" ? "bg-rose-600" : "bg-blue-600",
        )}
      />
    </div>
  );
}

// ============================================================================
// Chart Card Wrapper
// ============================================================================
function ChartCard({ title, children, isLoading, action }: ChartCardProps) {
  return (
    <div className="flex flex-col rounded-[4px] border border-neutral-800 bg-neutral-900 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-neutral-800/50">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">
          {title}
        </p>
        {action}
      </div>
      <div className="p-4 flex-1">
        {isLoading ? (
          <div className="flex h-[200px] items-center justify-center">
            <Skeleton className="h-full w-full rounded-[4px] opacity-20" />
          </div>
        ) : (
          <div className="h-[200px] w-full">{children}</div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Custom Tooltip for Charts
// ============================================================================
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    payload?: { name?: string; date?: string };
  }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-[4px] border border-neutral-700 bg-neutral-900/95 px-3 py-2 shadow-2xl backdrop-blur-md">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
        {payload[0]?.payload?.name || payload[0]?.payload?.date || label}
      </p>
      <p className="text-sm font-bold tracking-tight text-white">
        {typeof payload[0].value === "number" && payload[0].value > 1000
          ? formatCurrency(payload[0].value)
          : payload[0].value}
      </p>
    </div>
  );
}

// ============================================================================
// Movement Timeline Component
// ============================================================================
function MovementTimeline({
  movements,
  isLoading,
  onItemClick,
}: MovementTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-[4px]" />
        ))}
      </div>
    );
  }

  if (!movements || !movements.length) {
    return (
      <div className="flex h-32 flex-col items-center justify-center rounded-[4px] border border-dashed border-neutral-800 text-neutral-600">
        <TrendingUp className="h-8 w-8 mb-2 opacity-20" />
        <p className="text-[10px] uppercase font-bold tracking-widest">
          Sem atividades registradas
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-neutral-800/50">
      {movements.slice(0, 10).map((movement) => {
        const typeConfig = getMovementTypeConfig(movement.movementType);
        const statusConfig = getStatusConfig(movement.status);

        return (
          <button
            key={movement.id}
            onClick={() => onItemClick(movement.id)}
            className="group flex items-center gap-4 py-3 text-left transition-colors hover:bg-neutral-800/30 px-2"
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] font-mono text-[10px] font-bold ring-1 ring-inset transition-all group-hover:scale-110",
                typeConfig.bg,
                typeConfig.color.replace("text-", "ring-"),
              )}
            >
              {movement.movementType.charAt(0)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    typeConfig.color,
                  )}
                >
                  {typeConfig.label}
                </span>
                <span className="text-[10px] font-mono text-neutral-600">
                  #{movement.id.slice(0, 8)}
                </span>
              </div>
              <p className="truncate text-xs text-neutral-400">
                <span className="text-white font-medium">
                  {movement.productCount}
                </span>{" "}
                itens
                {movement.originWarehouseName &&
                  ` de ${movement.originWarehouseName}`}
                {movement.destinationWarehouseName &&
                  ` para ${movement.destinationWarehouseName}`}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span
                className={cn(
                  "inline-block rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-tighter mb-1",
                  statusConfig.bg,
                  statusConfig.color,
                )}
              >
                {statusConfig.label}
              </span>
              <p className="text-[10px] font-bold text-neutral-500 uppercase">
                {formatRelativeTime(movement.createdAt)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Alert Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[88px] rounded-[4px]" />
        <Skeleton className="h-[88px] rounded-[4px]" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-[4px]" />
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[280px] rounded-[4px]" />
        ))}
      </div>

      {/* Timeline Skeleton */}
      <Skeleton className="h-[300px] rounded-[4px]" />
    </div>
  );
}

// ============================================================================
// Error State
// ============================================================================
function DashboardError({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-[4px] border border-neutral-800 bg-neutral-900 p-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-[4px] bg-rose-500/10">
        <AlertTriangle className="h-6 w-6 text-rose-500" strokeWidth={2} />
      </div>
      <div className="text-center">
        <p className="font-semibold text-white">Erro ao carregar dashboard</p>
        <p className="mt-1 text-sm text-neutral-400">{error.message}</p>
      </div>
      <Button
        onClick={onRetry}
        className="rounded-[4px] bg-blue-600 uppercase tracking-wide hover:bg-blue-700"
      >
        Tentar Novamente
      </Button>
    </div>
  );
}

// ============================================================================
// Main Dashboard View
// ============================================================================

export function DashboardView({
  data,
  isLoading,
  error,
  onRefresh,
  isRefreshing,
  navigateToLowStock,
  navigateToExpiring,
  navigateToMovement,
  navigateToNewMovement,
}: DashboardViewProps) {
  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <DashboardError error={error} onRetry={onRefresh} />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Calculate counts and stats from real response data
  const lowStockItems = data.lowStockProducts || [];
  const expiringItems = data.expiringProducts || [];

  // Prepare chart data
  const warehouseChartData = (data.stockByWarehouse || []).map((w, i) => ({
    name: w.warehouseName,
    value: w.stockValue,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const categoryChartData = (data.stockByCategory || []).map((c, i) => ({
    name: c.categoryName,
    value: c.stockValue,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const movementStats = data.movementStats || {
    thisMonth: { entries: 0, exits: 0, transfers: 0, adjustments: 0 },
  };

  const movementTypeData = [
    {
      name: "Entradas",
      value: movementStats.thisMonth.entries,
      color: CHART_COLORS[1], // emerald
    },
    {
      name: "Saídas",
      value: movementStats.thisMonth.exits,
      color: CHART_COLORS[3], // rose
    },
    {
      name: "Transferências",
      value: movementStats.thisMonth.transfers,
      color: CHART_COLORS[0], // blue
    },
    {
      name: "Ajustes",
      value: movementStats.thisMonth.adjustments,
      color: CHART_COLORS[2], // amber
    },
  ];

  const stockHistoryData = data.stockHistory || [
    { date: "01/01", value: 45000 },
    { date: "05/01", value: 42000 },
    { date: "10/01", value: 48000 },
    { date: "15/01", value: 46000 },
    { date: "20/01", value: 52000 },
    { date: "25/01", value: 50000 },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">
              Sistema Operacional
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tighter text-white uppercase truncate">
            Visão Geral
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full md:flex md:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-9 w-full md:w-auto rounded-[4px] border-neutral-800 bg-neutral-900 px-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <RefreshCw
              className={cn("mr-2 h-3.5 w-3.5", isRefreshing && "animate-spin")}
              strokeWidth={2.5}
            />
            Sincronizar
          </Button>
          <Button
            onClick={navigateToNewMovement}
            size="sm"
            className="h-9 w-full md:w-auto rounded-[4px] bg-blue-600 px-4 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-blue-700"
          >
            <Plus className="mr-2 h-3.5 w-3.5" strokeWidth={2.5} />
            Novo Movimento
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* KPI Row */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <KPICard
            value={data.totalStockValue}
            label="Patrimônio Total"
            icon={TrendingUp}
            format="currency"
            color="emerald"
            trend={{ direction: "up", value: "3.2%" }}
          />
          <KPICard
            value={data.totalStockQuantity}
            label="Volume Itens"
            icon={Package}
            color="blue"
          />
          <KPICard
            value={data.totalProducts}
            label="SKUs Ativos"
            icon={Layers}
            color="blue"
          />
          <KPICard
            value={data.totalWarehouses}
            label="Unidades Logísticas"
            icon={Warehouse}
            color="amber"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Charts Column */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Main Evolution Chart */}
            <ChartCard title="Evolução Financeira de Estoque">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stockHistoryData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#2563EB"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <div className="grid gap-6 md:grid-cols-2">
              <ChartCard title="Distribuição por Categoria">
                {categoryChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] uppercase font-bold tracking-[0.2em] text-neutral-600">
                    Sem dados
                  </div>
                )}
              </ChartCard>

              <ChartCard title="Fluxo Mensal (Tipos)">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={movementTypeData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      tick={{
                        fill: "#737373",
                        fontSize: 9,
                        fontWeight: "bold",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.02)" }}
                      content={<CustomTooltip />}
                    />
                    <Bar dataKey="value" radius={[0, 2, 2, 0]} barSize={12}>
                      {movementTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>

          {/* Activity & Alerts Column */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <AlertCard
              type="low-stock"
              items={lowStockItems}
              onSeeAll={navigateToLowStock}
            />

            <AlertCard
              type="expiring"
              items={expiringItems}
              onSeeAll={navigateToExpiring}
            />

            <div className="flex flex-col rounded-[4px] border border-neutral-800 bg-neutral-900 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-neutral-800/50">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">
                  Logs Atividade
                </p>
                <Link
                  href="/stock-movements"
                  className="text-[10px] font-bold uppercase tracking-widest text-blue-500 hover:text-white transition-colors"
                >
                  FULL LOG →
                </Link>
              </div>
              <div className="p-2">
                <MovementTimeline
                  movements={data.recentMovements || []}
                  onItemClick={navigateToMovement}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
