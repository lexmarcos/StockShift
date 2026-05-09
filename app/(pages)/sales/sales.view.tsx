"use client";

import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  ShoppingCart,
  Plus,
  Calendar,
  CalendarDays,
  Eye,
  MoreHorizontal,
  Filter,
  DollarSign,
  TrendingUp,
  CreditCard,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { PermissionGate } from "@/components/permission-gate";
import { InsightCard } from "@/components/ui/insight-card";
import { SalesChart } from "./sales-chart.view";
import {
  SaleSummary,
  SaleStatus,
  SalesDashboardData,
  SaleFilters,
  SaleFilterDraft,
  PaymentMethod,
  DateFilterPreset,
  KpiPeriodKey,
  PAYMENT_METHOD_LABELS,
  SALE_STATUS_LABELS,
  formatCents,
} from "./sales.types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SalesViewProps {
  sales: SaleSummary[];
  isLoading: boolean;
  error: Error | null;
  filters: SaleFilters;
  mobileFiltersDraft: SaleFilterDraft;
  isMobileFiltersOpen: boolean;
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalElements: number;
  };
  dashboardData: SalesDashboardData | null;
  dashboardLoading: boolean;
  kpiPeriod: KpiPeriodKey;
  onKpiPeriodChange: (period: KpiPeriodKey) => void;
  onPageChange: (page: number) => void;
  onFilterChange: <K extends keyof SaleFilters>(
    key: K,
    value: SaleFilters[K],
  ) => void;
  onDatePresetChange: (preset: DateFilterPreset) => void;
  onDateInputChange: (key: "dateFrom" | "dateTo", value: string) => void;
  onOpenMobileFilters: () => void;
  onCloseMobileFilters: () => void;
  onApplyMobileFilters: () => void;
  onClearMobileFilters: () => void;
  onMobileDatePresetChange: (preset: DateFilterPreset) => void;
  onMobileDateInputChange: (key: "dateFrom" | "dateTo", value: string) => void;
  onMobileFilterDraftChange: <K extends keyof SaleFilterDraft>(
    key: K,
    value: SaleFilterDraft[K],
  ) => void;
}

const getStatusStyle = (status: SaleStatus) =>
  status === "COMPLETED"
    ? {
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
      }
    : {
        color: "text-rose-500",
        bg: "bg-rose-500/10",
        border: "border-rose-500/20",
      };

const DATE_PRESET_LABELS: Record<DateFilterPreset, string> = {
  ALL: "Todos períodos",
  TODAY: "Hoje",
  LAST_7_DAYS: "Últimos 7 dias",
  THIS_MONTH: "Este mês",
  CUSTOM: "Personalizado",
};

const STATUS_FILTER_OPTIONS: {
  value: SaleStatus | "ALL";
  label: string;
}[] = [
  { value: "ALL", label: "Todos" },
  { value: "COMPLETED", label: SALE_STATUS_LABELS.COMPLETED },
  { value: "CANCELLED", label: SALE_STATUS_LABELS.CANCELLED },
];

const PAYMENT_FILTER_OPTIONS: {
  value: PaymentMethod | "ALL";
  label: string;
}[] = [
  { value: "ALL", label: "Todos" },
  ...Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
    value: value as PaymentMethod,
    label,
  })),
];

const formatDateDisplay = (value?: string) => {
  if (!value) return "";

  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
};

const getDateSummary = (
  datePreset: DateFilterPreset,
  dateFrom?: string,
  dateTo?: string,
) => {
  if (datePreset !== "CUSTOM") {
    return DATE_PRESET_LABELS[datePreset];
  }

  if (dateFrom && dateTo) {
    return `${formatDateDisplay(dateFrom)} - ${formatDateDisplay(dateTo)}`;
  }

  return DATE_PRESET_LABELS.CUSTOM;
};

const getActiveFilterCount = (filters: SaleFilters) => {
  const hasStatus = filters.status && filters.status !== "ALL";
  const hasPayment = filters.paymentMethod && filters.paymentMethod !== "ALL";
  const hasDate = filters.datePreset !== "ALL";

  return Number(hasStatus) + Number(hasPayment) + Number(hasDate);
};

const preventDrawerDismissFromSelectPortal = (event: Event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) return;

  const isSelectPortal =
    target.closest('[data-slot="select-content"]') ||
    target.closest("[data-radix-popper-content-wrapper]");

  if (isSelectPortal) {
    event.preventDefault();
  }
};

const SaleActions = ({ sale }: { sale: SaleSummary }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="end"
      className="w-48 rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-200 shadow-xl"
    >
      <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
        Ações
      </DropdownMenuLabel>
      <DropdownMenuSeparator className="bg-neutral-800" />
      <DropdownMenuItem asChild>
        <Link
          href={`/sales/${sale.id}`}
          className="cursor-pointer focus:bg-neutral-800 focus:text-white flex items-center w-full"
        >
          <Eye className="mr-2 h-3.5 w-3.5" /> Ver Detalhes
        </Link>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const FilterToken = ({
  icon,
  label,
  badge,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  badge?: number;
  onClick: () => void;
}) => (
  <Button
    type="button"
    variant="outline"
    onClick={onClick}
    className="h-9 shrink-0 rounded-[4px] border-neutral-800 bg-[#171717] px-3 text-xs font-medium text-neutral-300 hover:border-neutral-700 hover:bg-neutral-900 hover:text-white"
  >
    {icon}
    <span className="ml-2 whitespace-nowrap">{label}</span>
    {badge ? (
      <span className="ml-2 rounded-[4px] bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
        {badge}
      </span>
    ) : null}
  </Button>
);

export const SalesView = ({
  sales,
  isLoading,
  filters,
  mobileFiltersDraft,
  isMobileFiltersOpen,
  pagination,
  dashboardData,
  dashboardLoading,
  kpiPeriod,
  onKpiPeriodChange,
  onPageChange,
  onFilterChange,
  onDatePresetChange,
  onDateInputChange,
  onOpenMobileFilters,
  onCloseMobileFilters,
  onApplyMobileFilters,
  onClearMobileFilters,
  onMobileDatePresetChange,
  onMobileDateInputChange,
  onMobileFilterDraftChange,
}: SalesViewProps) => {


  const renderMobileFiltersPanel = (draft: SaleFilterDraft) => {
    return (
      <Drawer
        direction="bottom"
        open={isMobileFiltersOpen}
        onOpenChange={(open) => {
          if (!open) onCloseMobileFilters();
        }}
      >
        <DrawerContent
          onInteractOutside={preventDrawerDismissFromSelectPortal}
          onPointerDownOutside={preventDrawerDismissFromSelectPortal}
          className="max-h-[88vh] rounded-t-[4px] border-neutral-800 bg-[#0e0e0e] text-neutral-200 md:hidden"
        >
          <DrawerHeader className="relative px-5 pb-2 pt-5 text-left">
            <DrawerTitle className="text-xl font-bold tracking-tight text-white">
              Filtros
            </DrawerTitle>
            <DrawerDescription className="mt-1 text-xs text-neutral-500">
              Refine o histórico de vendas
            </DrawerDescription>
            <div className="absolute right-5 top-5 flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClearMobileFilters}
                className="h-9 rounded-[4px] px-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 hover:text-rose-400"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Limpar
              </Button>
              <DrawerClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 w-9 rounded-[4px] p-0 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="overflow-y-auto px-5 pb-2 pt-3">
            <div className="space-y-7">
              <div>
                <h3 className="mb-3 text-sm font-bold text-white">Status</h3>
                <div className="flex flex-wrap gap-2">
                  {STATUS_FILTER_OPTIONS.map((option) => {
                    const isSelected = draft.status === option.value;
                    return (
                      <Button
                        key={option.value}
                        type="button"
                        variant="outline"
                        onClick={() =>
                          onMobileFilterDraftChange("status", option.value)
                        }
                        className={`h-10 rounded-[4px] border px-3 text-sm font-semibold ${
                          isSelected
                            ? "border-blue-500 bg-blue-500/15 text-blue-300"
                            : "border-neutral-700 bg-neutral-900/30 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800"
                        }`}
                      >
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-bold text-white">
                  Pagamento
                </h3>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_FILTER_OPTIONS.map((option) => {
                    const isSelected = draft.paymentMethod === option.value;
                    return (
                      <Button
                        key={option.value}
                        type="button"
                        variant="outline"
                        onClick={() =>
                          onMobileFilterDraftChange(
                            "paymentMethod",
                            option.value,
                          )
                        }
                        className={`h-10 rounded-[4px] border px-3 text-sm font-semibold ${
                          isSelected
                            ? "border-blue-500 bg-blue-500/15 text-blue-300"
                            : "border-neutral-700 bg-neutral-900/30 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800"
                        }`}
                      >
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-bold text-white">Período</h3>
                <Select
                  value={draft.datePreset}
                  onValueChange={(value) =>
                    onMobileDatePresetChange(value as DateFilterPreset)
                  }
                >
                  <SelectTrigger className="h-12 rounded-[4px] border-neutral-700 bg-neutral-900/30 text-neutral-200 focus:border-blue-600 focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
                    {Object.entries(DATE_PRESET_LABELS).map(
                      ([value, label]) => (
                        <SelectItem
                          key={value}
                          value={value}
                          className="focus:bg-neutral-800"
                        >
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>

                {draft.datePreset === "CUSTOM" ? (
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <label className="space-y-1.5">
                      <span className="text-xs font-medium text-neutral-400">
                        Data inicial
                      </span>
                      <Input
                        type="date"
                        value={draft.dateFrom ?? ""}
                        onChange={(event) =>
                          onMobileDateInputChange(
                            "dateFrom",
                            event.target.value,
                          )
                        }
                        className="h-12 rounded-[4px] border-neutral-700 bg-neutral-900/30 text-neutral-200 [color-scheme:dark] focus-visible:border-blue-600 focus-visible:ring-0"
                      />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs font-medium text-neutral-400">
                        Data final
                      </span>
                      <Input
                        type="date"
                        value={draft.dateTo ?? ""}
                        onChange={(event) =>
                          onMobileDateInputChange(
                            "dateTo",
                            event.target.value,
                          )
                        }
                        className="h-12 rounded-[4px] border-neutral-700 bg-neutral-900/30 text-neutral-200 [color-scheme:dark] focus-visible:border-blue-600 focus-visible:ring-0"
                      />
                    </label>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <DrawerFooter className="border-t border-neutral-800 px-5 pb-5 pt-4">
            <Button
              type="button"
              onClick={onApplyMobileFilters}
              className="h-12 w-full rounded-[4px] bg-blue-600 text-sm font-bold text-white hover:bg-blue-700"
            >
              Aplicar filtros
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  };

  const activeFilterCount = getActiveFilterCount(filters);

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 font-sans text-neutral-200">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tighter text-white">
                  Vendas
                </h1>
                <p className="text-sm text-neutral-500 mt-1">
                  Histórico de vendas realizadas
                </p>
              </div>
              <PermissionGate permission="sales:create">
                <Link href="/sales/pdv" className="w-full md:w-auto">
                  <Button className="h-10 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)] md:w-auto">
                    <Plus className="mr-2 h-4 w-4" /> Nova Venda
                  </Button>
                </Link>
              </PermissionGate>
            </div>

            <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max gap-2">
                <FilterToken
                  icon={<Filter className="h-3.5 w-3.5" />}
                  label="Filtros"
                  badge={activeFilterCount || undefined}
                  onClick={onOpenMobileFilters}
                />
                <FilterToken
                  icon={<CalendarDays className="h-3.5 w-3.5" />}
                  label={getDateSummary(
                    filters.datePreset,
                    filters.dateFrom,
                    filters.dateTo,
                  )}
                  onClick={onOpenMobileFilters}
                />
                <FilterToken
                  icon={<CreditCard className="h-3.5 w-3.5" />}
                  label={
                    filters.paymentMethod && filters.paymentMethod !== "ALL"
                      ? PAYMENT_METHOD_LABELS[filters.paymentMethod]
                      : "Pagamento"
                  }
                  onClick={onOpenMobileFilters}
                />
              </div>
            </div>

            <div className="hidden w-full gap-3 md:flex md:h-12 md:flex-row md:items-center">
              <Select
                value={filters.status || "ALL"}
                onValueChange={(value) =>
                  onFilterChange("status", value as SaleStatus | "ALL")
                }
              >
                <SelectTrigger className="h-12 w-full md:w-[200px] rounded-[4px] border-neutral-800 bg-[#171717] text-[12px] font-bold uppercase tracking-widest text-neutral-400 focus:border-blue-600 focus:ring-0 hover:border-neutral-700">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5 text-neutral-500" />
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
                  <SelectItem
                    value="ALL"
                    className="text-[12px] font-bold uppercase focus:bg-neutral-800"
                  >
                    Todos
                  </SelectItem>
                  <SelectItem
                    value="COMPLETED"
                    className="text-[12px] font-bold uppercase focus:bg-neutral-800"
                  >
                    Concluída
                  </SelectItem>
                  <SelectItem
                    value="CANCELLED"
                    className="text-[12px] font-bold uppercase focus:bg-neutral-800"
                  >
                    Cancelada
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.paymentMethod || "ALL"}
                onValueChange={(value) =>
                  onFilterChange(
                    "paymentMethod",
                    value as PaymentMethod | "ALL",
                  )
                }
              >
                <SelectTrigger className="h-12 w-full md:w-[200px] rounded-[4px] border-neutral-800 bg-[#171717] text-[12px] font-bold uppercase tracking-widest text-neutral-400 focus:border-blue-600 focus:ring-0 hover:border-neutral-700">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5 text-neutral-500" />
                    <SelectValue placeholder="Pagamento" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
                  <SelectItem
                    value="ALL"
                    className="text-[12px] font-bold uppercase focus:bg-neutral-800"
                  >
                    Todos
                  </SelectItem>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                    <SelectItem
                      key={key}
                      value={key}
                      className="text-[12px] font-bold uppercase focus:bg-neutral-800"
                    >
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.datePreset}
                onValueChange={(value) =>
                  onDatePresetChange(value as DateFilterPreset)
                }
              >
                <SelectTrigger className="h-12 w-full rounded-[4px] border-neutral-800 bg-[#171717] text-[12px] font-bold uppercase tracking-widest text-neutral-400 hover:border-neutral-700 focus:border-blue-600 focus:ring-0 md:w-[190px]">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-neutral-500" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
                  {Object.entries(DATE_PRESET_LABELS).map(([value, label]) => (
                    <SelectItem
                      key={value}
                      value={value}
                      className="text-[12px] font-bold uppercase focus:bg-neutral-800"
                    >
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {filters.datePreset === "CUSTOM" ? (
                <>
                  <Input
                    type="date"
                    value={filters.dateFrom ?? ""}
                    onChange={(event) =>
                      onDateInputChange("dateFrom", event.target.value)
                    }
                    className="h-12 w-[160px] rounded-[4px] border-neutral-800 bg-[#171717] text-[12px] font-bold uppercase tracking-widest text-neutral-300 [color-scheme:dark] focus-visible:border-blue-600 focus-visible:ring-0"
                  />
                  <Input
                    type="date"
                    value={filters.dateTo ?? ""}
                    onChange={(event) =>
                      onDateInputChange("dateTo", event.target.value)
                    }
                    className="h-12 w-[160px] rounded-[4px] border-neutral-800 bg-[#171717] text-[12px] font-bold uppercase tracking-widest text-neutral-300 [color-scheme:dark] focus-visible:border-blue-600 focus-visible:ring-0"
                  />
                </>
              ) : null}
            </div>
          </div>

          {/* KPI Cards */}
          <div className="space-y-3">
            {/* Period Toggle */}
            <div className="flex items-center gap-1 rounded-[4px] border border-neutral-800 bg-[#171717] p-1 w-full md:w-fit">
              {(
                [
                  { key: "today", label: "Hoje" },
                  { key: "week", label: "Semana" },
                  { key: "month", label: "Mês" },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onKpiPeriodChange(key)}
                  className={`flex-1 md:flex-initial rounded-[4px] px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${
                    kpiPeriod === key
                      ? "bg-blue-600 text-white"
                      : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {dashboardLoading ? (
                <div className="col-span-3 flex items-center justify-center py-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-500 border-t-blue-500" />
                </div>
              ) : (
                dashboardData && (
                  <>
                    <InsightCard
                      icon={ShoppingCart}
                      color="blue"
                      label="Vendas"
                      value={dashboardData.kpis[kpiPeriod].count}
                      suffix="vendas"
                    />
                    <InsightCard
                      icon={DollarSign}
                      color="emerald"
                      label="Faturamento"
                      value={formatCents(dashboardData.kpis[kpiPeriod].revenue)}
                    />
                    <InsightCard
                      icon={TrendingUp}
                      color="amber"
                      label="Ticket Médio"
                      value={formatCents(dashboardData.kpis[kpiPeriod].avgTicket)}
                    />
                  </>
                )
              )}
            </div>
          </div>

          {/* Monthly Chart */}
          {dashboardData && dashboardData.dailyChart.length > 0 && (
            <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-4">
              <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                Vendas do Mês
              </h3>
              <SalesChart data={dashboardData.dailyChart} />
            </div>
          )}

          {/* Desktop Table */}
          <div className="hidden md:block rounded-[4px] border border-neutral-800 bg-[#171717] overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900/50">
                    <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                      Código
                    </TableHead>
                    <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                      Data
                    </TableHead>
                    <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                      Vendedor
                    </TableHead>
                    <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                      Pagamento
                    </TableHead>
                    <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                      Total
                    </TableHead>
                    <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                      Status
                    </TableHead>
                    <TableHead className="py-4 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-48 text-center text-neutral-500"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-500 border-t-blue-500" />
                          <span className="text-[10px] uppercase font-bold tracking-widest">
                            Carregando vendas...
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : sales.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-48 text-center text-neutral-500"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <ShoppingCart className="h-8 w-8 text-neutral-700" />
                          <span className="text-[10px] uppercase font-bold tracking-widest">
                            Nenhuma venda encontrada
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.map((sale) => {
                      const s = getStatusStyle(sale.status);
                      return (
                        <TableRow
                          key={sale.id}
                          className="border-b border-neutral-800 transition-colors hover:bg-neutral-800/50"
                        >
                          <TableCell className="py-4">
                            <Link
                              href={`/sales/${sale.id}`}
                              className="font-mono text-sm font-bold text-white hover:text-blue-400"
                            >
                              {sale.code}
                            </Link>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center text-sm text-neutral-400">
                              <Calendar className="mr-2 h-3.5 w-3.5" />
                              {format(
                                new Date(sale.createdAt),
                                "dd/MM/yyyy HH:mm",
                                { locale: ptBR },
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="text-sm text-neutral-300">
                              {sale.createdByUserName || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="text-sm font-medium text-neutral-300">
                              {PAYMENT_METHOD_LABELS[sale.paymentMethod]}
                            </span>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="font-mono text-sm font-bold text-white">
                              {formatCents(sale.total)}
                            </span>
                          </TableCell>
                          <TableCell className="py-4">
                            <span
                              className={`inline-flex items-center rounded-[2px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${s.bg} ${s.color} ${s.border}`}
                            >
                              {SALE_STATUS_LABELS[sale.status]}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <SaleActions sale={sale} />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-8 gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-500 border-t-blue-500" />
                <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">
                  Carregando...
                </span>
              </div>
            ) : sales.length === 0 ? (
              <div className="p-8 text-center bg-[#171717] rounded-[4px] border border-neutral-800">
                <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">
                  Nenhuma venda encontrada
                </span>
              </div>
            ) : (
              sales.map((sale) => {
                const s = getStatusStyle(sale.status);
                return (
                  <div
                    key={sale.id}
                    className="flex flex-col gap-3 rounded-[4px] border border-neutral-800 bg-[#171717] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/sales/${sale.id}`}
                        className="font-mono text-base font-bold text-white hover:text-blue-400"
                      >
                        {sale.code}
                      </Link>
                      <SaleActions sale={sale} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                          Data
                        </span>
                        <span className="text-sm text-neutral-300 mt-0.5">
                          {format(new Date(sale.createdAt), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                          Total
                        </span>
                        <span className="text-sm font-bold text-white mt-0.5">
                          {formatCents(sale.total)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                          Vendedor
                        </span>
                        <span className="text-sm text-neutral-300 mt-0.5">
                          {sale.createdByUserName || "—"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-neutral-800">
                      <span className="text-xs font-medium text-neutral-400">
                        {PAYMENT_METHOD_LABELS[sale.paymentMethod]}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-[2px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${s.bg} ${s.color} ${s.border}`}
                      >
                        {SALE_STATUS_LABELS[sale.status]}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-neutral-500">
              Página {pagination.page + 1} de{" "}
              {Math.max(1, pagination.totalPages)}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={pagination.page === 0}
                onClick={() => onPageChange(pagination.page - 1)}
                className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-400 hover:bg-neutral-800 hover:text-white"
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                disabled={pagination.page >= pagination.totalPages - 1}
                onClick={() => onPageChange(pagination.page + 1)}
                className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-400 hover:bg-neutral-800 hover:text-white"
              >
                Próxima
              </Button>
            </div>
          </div>
        </div>
      </main>
      {renderMobileFiltersPanel(mobileFiltersDraft)}
    </div>
  );
};
