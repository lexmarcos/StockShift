"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  DollarSign,
  Eye,
  Filter,
  MoreHorizontal,
  Plus,
  ShoppingCart,
  Trash2,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { PermissionGate } from "@/components/permission-gate";
import { Button } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { SalesChart } from "./sales-chart.view";
import {
  DateFilterPreset,
  formatCents,
  PAYMENT_METHOD_LABELS,
  PaymentMethod,
  SaleFilterDraft,
  SaleFilters,
  SalesMetricsData,
  SaleStatus,
  SALE_STATUS_LABELS,
  SaleSummary,
} from "./sales.types";

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
  salesMetricsData: SalesMetricsData | null;
  salesMetricsLoading: boolean;
  salesMetricsTitle: string;
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

type SalesViewState = SalesViewProps;

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
  if (datePreset !== "CUSTOM") return DATE_PRESET_LABELS[datePreset];

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

  if (isSelectPortal) event.preventDefault();
};

const SaleActions = ({ sale }: { sale: SaleSummary }) => (
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
        Ações
      </DropdownMenuLabel>
      <DropdownMenuSeparator className="bg-neutral-800" />
      <DropdownMenuItem asChild>
        <Link
          href={`/sales/${sale.id}`}
          className="flex w-full cursor-pointer items-center focus:bg-neutral-800 focus:text-white"
        >
          <Eye className="mr-2 size-3.5" /> Ver Detalhes
        </Link>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const FilterToken = ({
  badge,
  icon,
  label,
  onClick,
}: {
  badge?: number;
  icon: ReactNode;
  label: string;
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

export const SalesView = (props: SalesViewProps) => {
  const viewState: SalesViewState = props;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 font-sans text-neutral-200">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <div className="space-y-6">
          <SalesHeader viewState={viewState} />
          <SalesMetricsSection viewState={viewState} />
          <SalesChartSection viewState={viewState} />
          <SalesDesktopTable viewState={viewState} />
          <SalesMobileCards viewState={viewState} />
          <SalesPagination viewState={viewState} />
        </div>
      </main>
      <SalesMobileFiltersDrawer viewState={viewState} />
    </div>
  );
};

function SalesHeader({ viewState }: { viewState: SalesViewState }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tighter text-white">
            Vendas
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Histórico de vendas realizadas
          </p>
        </div>
        <PermissionGate permission="sales:create">
          <Link href="/sales/pdv" className="w-full md:w-auto">
            <Button className="h-10 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)] hover:bg-blue-700 md:w-auto">
              <Plus className="mr-2 size-4" /> Nova Venda
            </Button>
          </Link>
        </PermissionGate>
      </div>
      <SalesMobileFilterTokens viewState={viewState} />
      <SalesDesktopFilters viewState={viewState} />
    </div>
  );
}

function SalesMobileFilterTokens({
  viewState,
}: {
  viewState: SalesViewState;
}) {
  const { filters, onOpenMobileFilters } = viewState;
  const activeFilterCount = getActiveFilterCount(filters);

  return (
    <div className="relative -mx-4 md:hidden">
      <div className="overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-2 pr-8">
          <FilterToken
            icon={<Filter className="size-3.5" />}
            label="Filtros"
            badge={activeFilterCount || undefined}
            onClick={onOpenMobileFilters}
          />
          <FilterToken
            icon={<CalendarDays className="size-3.5" />}
            label={getDateSummary(
              filters.datePreset,
              filters.dateFrom,
              filters.dateTo,
            )}
            onClick={onOpenMobileFilters}
          />
          <FilterToken
            icon={<CreditCard className="size-3.5" />}
            label={
              filters.paymentMethod && filters.paymentMethod !== "ALL"
                ? PAYMENT_METHOD_LABELS[filters.paymentMethod]
                : "Pagamento"
            }
            onClick={onOpenMobileFilters}
          />
        </div>
      </div>
      <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-l from-[#0A0A0A] to-transparent" />
    </div>
  );
}

function SalesDesktopFilters({ viewState }: { viewState: SalesViewState }) {
  const {
    filters,
    onDateInputChange,
    onDatePresetChange,
    onFilterChange,
  } = viewState;

  return (
    <div className="hidden w-full gap-3 md:flex md:h-12 md:flex-row md:items-center">
      <Select
        value={filters.status || "ALL"}
        onValueChange={(value) =>
          onFilterChange("status", value as SaleStatus | "ALL")
        }
      >
        <SelectTrigger className="h-12 w-full rounded-[4px] border-neutral-800 bg-[#171717] text-[12px] font-bold uppercase tracking-widest text-neutral-400 hover:border-neutral-700 focus:border-blue-600 focus:ring-0 md:w-[200px]">
          <div className="flex items-center gap-2">
            <Filter className="size-3.5 text-neutral-500" />
            <SelectValue placeholder="Status" />
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
          {STATUS_FILTER_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="text-[12px] font-bold uppercase focus:bg-neutral-800"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <SalesPaymentFilter filters={filters} onFilterChange={onFilterChange} />
      <SalesDatePresetFilter
        filters={filters}
        onDatePresetChange={onDatePresetChange}
      />
      {filters.datePreset === "CUSTOM" ? (
        <SalesCustomDateInputs
          filters={filters}
          onDateInputChange={onDateInputChange}
        />
      ) : null}
    </div>
  );
}

function SalesPaymentFilter({
  filters,
  onFilterChange,
}: {
  filters: SaleFilters;
  onFilterChange: SalesViewProps["onFilterChange"];
}) {
  return (
    <Select
      value={filters.paymentMethod || "ALL"}
      onValueChange={(value) =>
        onFilterChange("paymentMethod", value as PaymentMethod | "ALL")
      }
    >
      <SelectTrigger className="h-12 w-full rounded-[4px] border-neutral-800 bg-[#171717] text-[12px] font-bold uppercase tracking-widest text-neutral-400 hover:border-neutral-700 focus:border-blue-600 focus:ring-0 md:w-[200px]">
        <div className="flex items-center gap-2">
          <Filter className="size-3.5 text-neutral-500" />
          <SelectValue placeholder="Pagamento" />
        </div>
      </SelectTrigger>
      <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
        {PAYMENT_FILTER_OPTIONS.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="text-[12px] font-bold uppercase focus:bg-neutral-800"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SalesDatePresetFilter({
  filters,
  onDatePresetChange,
}: {
  filters: SaleFilters;
  onDatePresetChange: (preset: DateFilterPreset) => void;
}) {
  return (
    <Select
      value={filters.datePreset}
      onValueChange={(value) => onDatePresetChange(value as DateFilterPreset)}
    >
      <SelectTrigger className="h-12 w-full rounded-[4px] border-neutral-800 bg-[#171717] text-[12px] font-bold uppercase tracking-widest text-neutral-400 hover:border-neutral-700 focus:border-blue-600 focus:ring-0 md:w-[190px]">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-3.5 text-neutral-500" />
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
  );
}

function SalesCustomDateInputs({
  filters,
  onDateInputChange,
}: {
  filters: SaleFilters;
  onDateInputChange: SalesViewProps["onDateInputChange"];
}) {
  return (
    <>
      <Input
        type="date"
        value={filters.dateFrom ?? ""}
        onChange={(event) => onDateInputChange("dateFrom", event.target.value)}
        className="h-12 w-[160px] rounded-[4px] border-neutral-800 bg-[#171717] text-[12px] font-bold uppercase tracking-widest text-neutral-300 [color-scheme:dark] focus-visible:border-blue-600 focus-visible:ring-0"
      />
      <Input
        type="date"
        value={filters.dateTo ?? ""}
        onChange={(event) => onDateInputChange("dateTo", event.target.value)}
        className="h-12 w-[160px] rounded-[4px] border-neutral-800 bg-[#171717] text-[12px] font-bold uppercase tracking-widest text-neutral-300 [color-scheme:dark] focus-visible:border-blue-600 focus-visible:ring-0"
      />
    </>
  );
}

function SalesMetricsSection({ viewState }: { viewState: SalesViewState }) {
  return (
    <div className="space-y-3">
      <div className="flex min-h-12 items-center gap-2 rounded-[4px] border border-neutral-800 bg-[#171717] px-4 text-xs font-bold uppercase tracking-widest text-neutral-300">
        <CalendarDays className="size-4 shrink-0 text-blue-500" />
        <span>{viewState.salesMetricsTitle}</span>
      </div>
      <SalesMetricsContent viewState={viewState} />
    </div>
  );
}

function SalesMetricsContent({ viewState }: { viewState: SalesViewState }) {
  if (viewState.salesMetricsLoading) {
    return (
      <div className="flex items-center justify-center rounded-[4px] border border-neutral-800 bg-[#171717] p-5 py-6">
        <div className="size-6 animate-spin rounded-full border-2 border-neutral-500 border-t-blue-500" />
      </div>
    );
  }

  if (!viewState.salesMetricsData) return null;

  const { kpiSummary } = viewState.salesMetricsData;

  return (
    <div className="overflow-x-auto rounded-[4px] border border-neutral-800 bg-[#171717] p-4 [scrollbar-width:none] sm:p-5 [&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-max items-center justify-between gap-6">
        <SalesMetricItem
          icon={<ShoppingCart className="size-5 sm:size-6" strokeWidth={2} />}
          iconClassName="bg-blue-500/10 text-blue-400"
          label="Vendas"
          value={String(kpiSummary.count)}
          suffix="vendas"
        />
        <SalesMetricDivider />
        <SalesMetricItem
          icon={<DollarSign className="size-5 sm:size-6" strokeWidth={2} />}
          iconClassName="bg-emerald-500/10 text-emerald-400"
          label="Faturamento"
          value={formatCents(kpiSummary.revenue)}
        />
        <SalesMetricDivider />
        <SalesMetricItem
          icon={<TrendingUp className="size-5 sm:size-6" strokeWidth={2} />}
          iconClassName="bg-amber-500/10 text-amber-400"
          label="Ticket Médio"
          value={formatCents(kpiSummary.avgTicket)}
        />
      </div>
    </div>
  );
}

function SalesMetricItem({
  icon,
  iconClassName,
  label,
  suffix,
  value,
}: {
  icon: ReactNode;
  iconClassName: string;
  label: string;
  suffix?: string;
  value: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-3 sm:gap-4">
      <div
        className={`flex size-11 shrink-0 items-center justify-center rounded-[4px] sm:size-12 ${iconClassName}`}
      >
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          {label}
        </div>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className="font-mono text-xl font-bold tracking-tight text-white sm:text-2xl">
            {value}
          </span>
          {suffix ? (
            <span className="text-xs font-medium text-neutral-400">{suffix}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SalesMetricDivider() {
  return <div className="h-10 w-px shrink-0 bg-neutral-800" />;
}

function SalesChartSection({ viewState }: { viewState: SalesViewState }) {
  const data = viewState.salesMetricsData?.dailyChart ?? [];

  if (data.length === 0) return null;

  return (
    <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-4">
      <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
        Evolução diária
      </h3>
      <SalesChart data={data} />
    </div>
  );
}

function SalesDesktopTable({ viewState }: { viewState: SalesViewState }) {
  return (
    <div className="hidden overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717] md:block">
      <div className="overflow-x-auto">
        <Table>
          <SalesTableHeader />
          <TableBody>
            <SalesTableBody viewState={viewState} />
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function SalesTableHeader() {
  return (
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
  );
}

function SalesTableBody({ viewState }: { viewState: SalesViewState }) {
  if (viewState.isLoading) {
    return <SalesTableMessage message="Carregando vendas…" isLoading />;
  }

  if (viewState.sales.length === 0) {
    return <SalesTableMessage message="Nenhuma venda encontrada" />;
  }

  return viewState.sales.map((sale) => (
    <SalesTableRow key={sale.id} sale={sale} />
  ));
}

function SalesTableMessage({
  isLoading,
  message,
}: {
  isLoading?: boolean;
  message: string;
}) {
  return (
    <TableRow>
      <TableCell colSpan={7} className="h-48 text-center text-neutral-500">
        <div className="flex flex-col items-center justify-center gap-2">
          {isLoading ? (
            <div className="size-6 animate-spin rounded-full border-2 border-neutral-500 border-t-blue-500" />
          ) : (
            <ShoppingCart className="size-8 text-neutral-700" />
          )}
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {message}
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
}

function SalesTableRow({ sale }: { sale: SaleSummary }) {
  const statusStyle = getStatusStyle(sale.status);

  return (
    <TableRow className="border-b border-neutral-800 transition-colors hover:bg-neutral-800/50">
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
          <Calendar className="mr-2 size-3.5" />
          {format(parseISO(sale.createdAt), "dd/MM/yyyy HH:mm", {
            locale: ptBR,
          })}
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
        <SaleStatusBadge sale={sale} statusStyle={statusStyle} />
      </TableCell>
      <TableCell className="py-4 text-right">
        <SaleActions sale={sale} />
      </TableCell>
    </TableRow>
  );
}

function SaleStatusBadge({
  sale,
  statusStyle,
}: {
  sale: SaleSummary;
  statusStyle: ReturnType<typeof getStatusStyle>;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-[2px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}
    >
      {SALE_STATUS_LABELS[sale.status]}
    </span>
  );
}

function SalesMobileCards({ viewState }: { viewState: SalesViewState }) {
  if (viewState.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-8 md:hidden">
        <div className="size-6 animate-spin rounded-full border-2 border-neutral-500 border-t-blue-500" />
        <span className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase">
          Carregando…
        </span>
      </div>
    );
  }

  if (viewState.sales.length === 0) {
    return (
      <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-8 text-center md:hidden">
        <span className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase">
          Nenhuma venda encontrada
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:hidden">
      {viewState.sales.map((sale) => (
        <SalesMobileCard key={sale.id} sale={sale} />
      ))}
    </div>
  );
}

function SalesMobileCard({ sale }: { sale: SaleSummary }) {
  const statusStyle = getStatusStyle(sale.status);

  return (
    <Link
      href={`/sales/${sale.id}`}
      className="flex flex-col gap-4 rounded-[4px] border border-neutral-800 bg-[#171717] p-4 transition-colors hover:bg-neutral-800/50"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-base font-bold text-white">
            {sale.code}
          </span>
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-[2px] border px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}
          >
            {sale.status === "COMPLETED" && (
              <CheckCircle2 className="size-3.5" strokeWidth={2.5} />
            )}
            {SALE_STATUS_LABELS[sale.status]}
          </span>
        </div>
        <ChevronRight className="size-4 shrink-0 text-neutral-500" strokeWidth={2.5} />
      </div>
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-1.5 text-neutral-400">
          <Calendar className="size-4" strokeWidth={2} />
          <span>
            {format(parseISO(sale.createdAt), "dd/MM/yyyy", { locale: ptBR })}
          </span>
        </div>
        <span className="text-neutral-600">&bull;</span>
        <span className="font-medium text-white">{formatCents(sale.total)}</span>
        <span className="text-neutral-600">&bull;</span>
        <div className="flex items-center gap-1.5 text-neutral-400">
          <User className="size-4" strokeWidth={2} />
          <span className="max-w-[100px] truncate sm:max-w-none">
            {sale.createdByUserName || "Admin"}
          </span>
        </div>
      </div>
    </Link>
  );
}

function SalesPagination({ viewState }: { viewState: SalesViewState }) {
  const { onPageChange, pagination } = viewState;

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-neutral-500">
        Página {pagination.page + 1} de {Math.max(1, pagination.totalPages)}
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
  );
}

function SalesMobileFiltersDrawer({
  viewState,
}: {
  viewState: SalesViewState;
}) {
  const draft = viewState.mobileFiltersDraft;

  return (
    <Drawer
      direction="bottom"
      open={viewState.isMobileFiltersOpen}
      onOpenChange={(open) => {
        if (!open) viewState.onCloseMobileFilters();
      }}
    >
      <DrawerContent
        onInteractOutside={preventDrawerDismissFromSelectPortal}
        onPointerDownOutside={preventDrawerDismissFromSelectPortal}
        className="max-h-[88vh] rounded-t-[4px] border-neutral-800 bg-[#0e0e0e] text-neutral-200 md:hidden"
      >
        <SalesMobileFiltersHeader viewState={viewState} />
        <div className="overflow-y-auto px-5 pt-3 pb-2">
          <div className="space-y-7">
            <SalesMobileStatusFilter draft={draft} viewState={viewState} />
            <SalesMobilePaymentFilter draft={draft} viewState={viewState} />
            <SalesMobileDateFilter draft={draft} viewState={viewState} />
          </div>
        </div>
        <DrawerFooter className="border-t border-neutral-800 px-5 pt-4 pb-5">
          <Button
            type="button"
            onClick={viewState.onApplyMobileFilters}
            className="h-12 w-full rounded-[4px] bg-blue-600 text-sm font-bold text-white hover:bg-blue-700"
          >
            Aplicar filtros
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function SalesMobileFiltersHeader({
  viewState,
}: {
  viewState: SalesViewState;
}) {
  return (
    <DrawerHeader className="relative px-5 pt-5 pb-2 text-left">
      <DrawerTitle className="text-xl font-bold tracking-tight text-white">
        Filtros
      </DrawerTitle>
      <DrawerDescription className="mt-1 text-xs text-neutral-500">
        Refine o histórico de vendas
      </DrawerDescription>
      <div className="absolute top-5 right-5 flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={viewState.onClearMobileFilters}
          className="h-9 rounded-[4px] px-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 hover:text-rose-400"
        >
          <Trash2 className="mr-1.5 size-3.5" />
          Limpar
        </Button>
        <DrawerClose asChild>
          <Button
            type="button"
            variant="ghost"
            className="size-9 rounded-[4px] p-0 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <X className="size-4" />
          </Button>
        </DrawerClose>
      </div>
    </DrawerHeader>
  );
}

function SalesMobileStatusFilter({
  draft,
  viewState,
}: {
  draft: SaleFilterDraft;
  viewState: SalesViewState;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-white">Status</h3>
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTER_OPTIONS.map((option) => (
          <SalesMobileFilterButton
            key={option.value}
            isSelected={draft.status === option.value}
            label={option.label}
            onClick={() => viewState.onMobileFilterDraftChange("status", option.value)}
          />
        ))}
      </div>
    </div>
  );
}

function SalesMobilePaymentFilter({
  draft,
  viewState,
}: {
  draft: SaleFilterDraft;
  viewState: SalesViewState;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-white">Pagamento</h3>
      <div className="flex flex-wrap gap-2">
        {PAYMENT_FILTER_OPTIONS.map((option) => (
          <SalesMobileFilterButton
            key={option.value}
            isSelected={draft.paymentMethod === option.value}
            label={option.label}
            onClick={() =>
              viewState.onMobileFilterDraftChange("paymentMethod", option.value)
            }
          />
        ))}
      </div>
    </div>
  );
}

function SalesMobileFilterButton({
  isSelected,
  label,
  onClick,
}: {
  isSelected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={`h-10 rounded-[4px] border px-3 text-sm font-semibold ${
        isSelected
          ? "border-blue-500 bg-blue-500/15 text-blue-300"
          : "border-neutral-700 bg-neutral-900/30 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800"
      }`}
    >
      {label}
    </Button>
  );
}

function SalesMobileDateFilter({
  draft,
  viewState,
}: {
  draft: SaleFilterDraft;
  viewState: SalesViewState;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-white">Período</h3>
      <Select
        value={draft.datePreset}
        onValueChange={(value) =>
          viewState.onMobileDatePresetChange(value as DateFilterPreset)
        }
      >
        <SelectTrigger className="h-12 rounded-[4px] border-neutral-700 bg-neutral-900/30 text-neutral-200 focus:border-blue-600 focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
          {Object.entries(DATE_PRESET_LABELS).map(([value, label]) => (
            <SelectItem
              key={value}
              value={value}
              className="focus:bg-neutral-800"
            >
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {draft.datePreset === "CUSTOM" ? (
        <SalesMobileCustomDateInputs draft={draft} viewState={viewState} />
      ) : null}
    </div>
  );
}

function SalesMobileCustomDateInputs({
  draft,
  viewState,
}: {
  draft: SaleFilterDraft;
  viewState: SalesViewState;
}) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-3">
      <SalesMobileDateInput
        id="sales-mobile-date-from"
        label="Data inicial"
        value={draft.dateFrom ?? ""}
        onChange={(value) => viewState.onMobileDateInputChange("dateFrom", value)}
      />
      <SalesMobileDateInput
        id="sales-mobile-date-to"
        label="Data final"
        value={draft.dateTo ?? ""}
        onChange={(value) => viewState.onMobileDateInputChange("dateTo", value)}
      />
    </div>
  );
}

function SalesMobileDateInput({
  id,
  label,
  onChange,
  value,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label htmlFor={id} className="space-y-1.5">
      <span className="text-xs font-medium text-neutral-400">{label}</span>
      <Input
        id={id}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-[4px] border-neutral-700 bg-neutral-900/30 text-neutral-200 [color-scheme:dark] focus-visible:border-blue-600 focus-visible:ring-0"
      />
    </label>
  );
}
