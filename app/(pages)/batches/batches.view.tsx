"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Layers,
  LayoutList,
  Loader2,
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  TrendingDown,
  XCircle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type {
  Batch,
  BatchFilterDraft,
  BatchFilters,
  ProductBatchesGroup,
  SortConfig,
} from "./batches.types";
import { deriveBatchStatus } from "./batches.model";

import { cn } from "@/lib/utils";
import { PermissionGate } from "@/components/permission-gate";

interface BatchesViewProps {
  batches: Batch[];
  groupedByProduct: ProductBatchesGroup[];
  isLoading: boolean;
  error: Error | null;
  filters: BatchFilters;
  sortConfig: SortConfig;
  isGroupedByProduct: boolean;
  isMobileFiltersOpen: boolean;
  mobileFiltersDraft: BatchFilterDraft;
  statusCounts: { expired: number; expiring: number; low: number };
  setSearchQuery: (value: string) => void;
  setStatus: (value: BatchFilters["status"]) => void;
  onGroupedByProductChange: (value: boolean) => void;
  onSortChange: (value: SortConfig["key"]) => void;
  onMobileFiltersOpenChange: (open: boolean) => void;
  onOpenMobileFilters: () => void;
  onApplyMobileFilters: () => void;
  onClearFilters: () => void;
  onClearMobileFilters: () => void;
  onMobileFilterDraftChange: (patch: Partial<BatchFilterDraft>) => void;
}

const getStatusStyle = (kind: string) => {
  switch (kind) {
    case "expired":
      return {
        label: "EXPIRADO",
        color: "text-rose-500",
        bg: "bg-rose-500/10",
        border: "border-rose-500/20",
        indicator: "bg-rose-500",
      };
    case "expiring":
      return {
        label: "EXPIRANDO",
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        indicator: "bg-amber-500",
      };
    case "low":
      return {
        label: "BAIXO ESTOQUE",
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        indicator: "bg-blue-500",
      };
    default:
      return {
        label: "REGULAR",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        indicator: "bg-emerald-500",
      };
  }
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  try {
    return format(new Date(value), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return value;
  }
};

const DEFAULT_LOW_STOCK_THRESHOLD = 10;

const STATUS_FILTER_OPTIONS: Array<{
  value: BatchFilters["status"];
  label: string;
  tone: string;
  icon: ReactNode;
}> = [
  { value: "all", label: "Todos", tone: "text-neutral-200", icon: <LayoutList className="size-3.5" strokeWidth={2.5} /> },
  { value: "expired", label: "Expirado", tone: "text-rose-400", icon: <XCircle className="size-3.5" strokeWidth={2.5} /> },
  { value: "expiring", label: "Expirando", tone: "text-amber-400", icon: <Clock className="size-3.5" strokeWidth={2.5} /> },
  { value: "low", label: "Baixo estoque", tone: "text-blue-400", icon: <TrendingDown className="size-3.5" strokeWidth={2.5} /> },
  { value: "ok", label: "Regular", tone: "text-emerald-400", icon: <CheckCircle2 className="size-3.5" strokeWidth={2.5} /> },
];

const SORT_FILTER_OPTIONS: Array<{
  value: `${SortConfig["key"]}:${SortConfig["direction"]}`;
  label: string;
}> = [
  { value: "createdAt:desc", label: "Mais recentes" },
  { value: "createdAt:asc", label: "Mais antigos" },
  { value: "expiration:asc", label: "Validade mais próxima" },
  { value: "expiration:desc", label: "Validade mais distante" },
  { value: "quantity:asc", label: "Menor quantidade" },
  { value: "quantity:desc", label: "Maior quantidade" },
  { value: "product:asc", label: "Produto A-Z" },
  { value: "product:desc", label: "Produto Z-A" },
];

const getStatusFilterLabel = (status: BatchFilters["status"]) =>
  STATUS_FILTER_OPTIONS.find((option) => option.value === status)?.label ??
  "Todos";

const getSortLabel = (sortConfig: SortConfig) =>
  SORT_FILTER_OPTIONS.find(
    (option) => option.value === `${sortConfig.key}:${sortConfig.direction}`,
  )?.label ?? "Mais recentes";

const getActiveFilterCount = (
  filters: BatchFilters,
  sortConfig: SortConfig,
  isGroupedByProduct: boolean,
) => {
  let count = 0;

  if (filters.status !== "all") count += 1;
  if (filters.lowStockThreshold !== DEFAULT_LOW_STOCK_THRESHOLD) count += 1;
  if (sortConfig.key !== "createdAt" || sortConfig.direction !== "desc") {
    count += 1;
  }
  if (isGroupedByProduct) count += 1;

  return count;
};

const preventDrawerDismissFromSelectPortal = (event: Event) => {
  const target = event.target as HTMLElement | null;

  if (
    target?.closest("[data-radix-popper-content-wrapper]") ||
    target?.closest("[data-radix-select-content]")
  ) {
    event.preventDefault();
  }
};

const FilterToken = ({
  active,
  count,
  icon,
  label,
  onClick,
  value,
}: {
  active?: boolean;
  count?: number;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  value?: string;
}) => (
  <Button
    type="button"
    variant="outline"
    onClick={onClick}
    className={cn(
      "h-9 shrink-0 gap-2 rounded-[4px] border-neutral-800 bg-[#171717] px-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:border-neutral-700 hover:bg-neutral-900 hover:text-white",
      active &&
        "border-blue-500/50 bg-blue-500/10 text-blue-100 hover:border-blue-500/70 hover:bg-blue-500/15",
    )}
  >
    {icon}
    <span>{label}</span>
    {value && (
      <span className="max-w-[120px] truncate text-neutral-200">{value}</span>
    )}
    {Boolean(count) && (
      <span className="min-w-5 rounded-[4px] bg-blue-600 px-1.5 py-0.5 text-center text-[10px] font-black leading-none text-white">
        {count}
      </span>
    )}
  </Button>
);

const SortIcon = ({
  field,
  sortConfig,
}: {
  field: SortConfig["key"];
  sortConfig: SortConfig;
}) => {
  if (sortConfig.key !== field) return <div className="size-3 opacity-0" />;
  return sortConfig.direction === "asc" ? (
    <ArrowUp className="ml-1 size-3 text-blue-500" />
  ) : (
    <ArrowDown className="ml-1 size-3 text-blue-500" />
  );
};

export const BatchesView = ({
  batches,
  groupedByProduct,
  isLoading,
  error,
  filters,
  sortConfig,
  isGroupedByProduct,
  isMobileFiltersOpen,
  mobileFiltersDraft,
  statusCounts,
  setSearchQuery,
  setStatus,
  onGroupedByProductChange,
  onSortChange,
  onMobileFiltersOpenChange,
  onOpenMobileFilters,
  onApplyMobileFilters,
  onClearFilters,
  onClearMobileFilters,
  onMobileFilterDraftChange,
}: BatchesViewProps) => {
  const activeFilterCount = getActiveFilterCount(
    filters,
    sortConfig,
    isGroupedByProduct,
  );


  const statusToneMap: Record<string, { activeBorder: string; activeBg: string; activeText: string }> = {
    all: { activeBorder: "border-neutral-500/50", activeBg: "bg-neutral-500/10", activeText: "text-neutral-100" },
    expired: { activeBorder: "border-rose-500/50", activeBg: "bg-rose-500/10", activeText: "text-rose-100" },
    expiring: { activeBorder: "border-amber-500/50", activeBg: "bg-amber-500/10", activeText: "text-amber-100" },
    low: { activeBorder: "border-blue-500/50", activeBg: "bg-blue-500/10", activeText: "text-blue-100" },
    ok: { activeBorder: "border-emerald-500/50", activeBg: "bg-emerald-500/10", activeText: "text-emerald-100" },
  };

  const draft = mobileFiltersDraft;
  const mobileFiltersPanel = (
    <Drawer open={isMobileFiltersOpen} onOpenChange={onMobileFiltersOpenChange}>
      <DrawerContent
        className="border-neutral-800 bg-[#171717] text-neutral-100"
        onInteractOutside={preventDrawerDismissFromSelectPortal}
        onPointerDownOutside={preventDrawerDismissFromSelectPortal}
      >
        <DrawerHeader className="px-5 pb-2 text-left">
          <DrawerTitle className="text-lg font-black tracking-tight text-white">
            Filtros
          </DrawerTitle>
          <DrawerDescription className="text-xs text-neutral-500">
            Refine os lotes por status, agrupamento e regra de estoque.
          </DrawerDescription>
        </DrawerHeader>

        <div className="max-h-[68vh] overflow-y-auto px-5 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                Status do lote
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {STATUS_FILTER_OPTIONS.map((option) => {
                  const tones = statusToneMap[option.value];
                  const isActive = draft.status === option.value;
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant="outline"
                      onClick={() =>
                        onMobileFilterDraftChange({ status: option.value })
                      }
                      className={cn(
                        "h-10 w-full rounded-[4px] border text-xs font-bold transition-colors",
                        isActive
                          ? cn(tones.activeBorder, tones.activeBg, tones.activeText)
                          : "border-neutral-800 bg-neutral-950/50 text-neutral-500 hover:border-neutral-700 hover:bg-neutral-900 hover:text-white",
                      )}
                    >
                      {option.icon}
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </section>

            <div className="h-px bg-neutral-800/60" />

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                  Baixo estoque
                </h3>
                <span className="rounded-[4px] border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 font-mono text-xs font-black text-blue-300">
                  {draft.lowStockThreshold} un.
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-neutral-500">
                Lotes com quantidade ≤ limite entram no status de baixo estoque.
              </p>
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={draft.lowStockThreshold}
                onChange={(event) =>
                  onMobileFilterDraftChange({
                    lowStockThreshold: Number(event.target.value),
                  })
                }
                className="h-1.5 w-full cursor-pointer rounded-[4px] bg-neutral-800 accent-blue-500"
              />
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                <span>1 un.</span>
                <span>100 un.</span>
              </div>
            </section>

            <div className="h-px bg-neutral-800/60" />

            <section className="space-y-3">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                Visualização
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    onMobileFilterDraftChange({ isGroupedByProduct: false })
                  }
                  className={cn(
                    "h-10 w-full rounded-[4px] border text-xs font-bold transition-colors",
                    !draft.isGroupedByProduct
                      ? "border-blue-500/50 bg-blue-500/10 text-blue-100"
                      : "border-neutral-800 bg-neutral-950/50 text-neutral-500 hover:border-neutral-700 hover:bg-neutral-900 hover:text-white",
                  )}
                >
                  <Layers className="mr-2 size-3.5" />
                  Lista
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    onMobileFilterDraftChange({ isGroupedByProduct: true })
                  }
                  className={cn(
                    "h-10 w-full rounded-[4px] border text-xs font-bold transition-colors",
                    draft.isGroupedByProduct
                      ? "border-blue-500/50 bg-blue-500/10 text-blue-100"
                      : "border-neutral-800 bg-neutral-950/50 text-neutral-500 hover:border-neutral-700 hover:bg-neutral-900 hover:text-white",
                  )}
                >
                  <Package className="mr-2 size-3.5" />
                  Agrupar
                </Button>
              </div>
            </section>

            <div className="h-px bg-neutral-800/60" />

            <section className="space-y-3">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                Ordenar por
              </h3>
              <Select
                value={`${draft.sortKey}:${draft.sortDirection}`}
                onValueChange={(value) => {
                  const [sortKey, sortDirection] = value.split(":") as [
                    SortConfig["key"],
                    SortConfig["direction"],
                  ];
                  onMobileFilterDraftChange({ sortKey, sortDirection });
                }}
              >
                <SelectTrigger className="h-10 w-full rounded-[4px] border-neutral-800 bg-neutral-950/50 text-xs text-neutral-300 focus:border-blue-600 focus:ring-0">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
                  {SORT_FILTER_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="text-xs focus:bg-neutral-800"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>
          </div>
        </div>

        <DrawerFooter className="flex-row gap-3 border-t border-neutral-800 px-5 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClearMobileFilters}
            className="h-11 flex-1 rounded-[4px] border-neutral-700 bg-transparent text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <Trash2 className="mr-2 size-3.5" />
            Limpar
          </Button>
          <Button
            type="button"
            onClick={onApplyMobileFilters}
            className="h-11 flex-[2] rounded-[4px] bg-blue-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-blue-500"
          >
            Aplicar filtros
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 font-sans text-neutral-200">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tighter text-white">
                  Lotes
                </h1>
                <p className="text-sm text-neutral-500 mt-1">
                  Controle lotes e validades
                </p>
              </div>
              <PermissionGate permission="batches:create">
                <Link href="/batches/create" className="w-full md:w-auto">
                  <Button className="h-10 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)] md:w-auto">
                    <Plus className="mr-2 size-4" />
                    Novo Lote
                  </Button>
                </Link>
              </PermissionGate>
            </div>

            <div className="md:hidden">
              <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex min-w-max gap-2 pb-1">
                  <FilterToken
                    active={activeFilterCount > 0}
                    count={activeFilterCount}
                    icon={<SlidersHorizontal className="size-3.5" />}
                    label="Filtros"
                    onClick={onOpenMobileFilters}
                  />
                  <FilterToken
                    active={filters.status !== "all"}
                    icon={<Filter className="size-3.5" />}
                    label="Status"
                    value={getStatusFilterLabel(filters.status)}
                    onClick={onOpenMobileFilters}
                  />
                  <FilterToken
                    active={
                      sortConfig.key !== "createdAt" ||
                      sortConfig.direction !== "desc"
                    }
                    icon={<ArrowDown className="size-3.5" />}
                    label="Ordem"
                    value={getSortLabel(sortConfig)}
                    onClick={onOpenMobileFilters}
                  />
                  <FilterToken
                    active={isGroupedByProduct}
                    icon={<Layers className="size-3.5" />}
                    label="Visão"
                    value={
                      isGroupedByProduct ? "Agrupado" : "Lista completa"
                    }
                    onClick={onOpenMobileFilters}
                  />
                  <FilterToken
                    active={
                      filters.lowStockThreshold !==
                      DEFAULT_LOW_STOCK_THRESHOLD
                    }
                    icon={<Package className="size-3.5" />}
                    label="Baixo"
                    value={`<= ${filters.lowStockThreshold} un.`}
                    onClick={onOpenMobileFilters}
                  />
                </div>
              </div>
            </div>

            {/* Row 1: Insight Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Batches */}
              <div className="flex flex-col justify-center rounded-[4px] border border-neutral-800 bg-[#171717] px-5 py-4 transition-colors hover:border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex size-6 items-center justify-center rounded-[2px] bg-neutral-800 border border-neutral-700">
                    <Layers className="size-3.5 text-neutral-400" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    Total de Lotes
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tighter text-white">
                    {batches.length}
                  </span>
                  <span className="text-[10px] font-medium uppercase text-neutral-600">
                    ativos
                  </span>
                </div>
              </div>

              {/* Expired */}
              <div className="flex flex-col justify-center rounded-[4px] border border-neutral-800 bg-[#171717] px-5 py-4 transition-colors hover:border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex size-6 items-center justify-center rounded-[2px] bg-rose-500/10 border border-rose-500/20">
                    <XCircle className="size-3.5 text-rose-500" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    Expirados
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tighter text-white">
                    {statusCounts.expired}
                  </span>
                  <span className="text-[10px] font-medium uppercase text-neutral-600">
                    lotes
                  </span>
                </div>
              </div>

              {/* Expiring */}
              <div className="flex flex-col justify-center rounded-[4px] border border-neutral-800 bg-[#171717] px-5 py-4 transition-colors hover:border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex size-6 items-center justify-center rounded-[2px] bg-amber-500/10 border border-amber-500/20">
                    <Calendar className="size-3.5 text-amber-500" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    Expirando (30d)
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tighter text-white">
                    {statusCounts.expiring}
                  </span>
                  <span className="text-[10px] font-medium uppercase text-neutral-600">
                    alertas
                  </span>
                </div>
              </div>

              {/* Low Stock */}
              <div className="flex flex-col justify-center rounded-[4px] border border-neutral-800 bg-[#171717] px-5 py-4 transition-colors hover:border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex size-6 items-center justify-center rounded-[2px] bg-blue-500/10 border border-blue-500/20">
                    <Package className="size-3.5 text-blue-500" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    Baixo Estoque
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tighter text-white">
                    {statusCounts.low}
                  </span>
                  <span className="text-[10px] font-medium uppercase text-neutral-600">
                    lotes
                  </span>
                </div>
              </div>
            </div>

            {/* Row 2: Search & Filters */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:h-12 w-full">
              <div className="relative h-12 flex-1 min-w-[200px] flex items-center">
                <div className="text-neutral-500 absolute left-3">
                  <Search className="size-3.5" />
                </div>
                <Input
                  placeholder="Buscar por produto, SKU ou lote…"
                  value={filters.searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-[4px] border-neutral-800 bg-[#171717] pl-10 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-blue-600 focus:ring-0 transition-all hover:border-neutral-700"
                />
              </div>

              <div className="hidden flex-col items-center gap-2 h-auto md:flex md:h-12 md:flex-row">
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setStatus(value as BatchFilters["status"])
                  }
                >
                  <SelectTrigger className="h-12 w-full md:w-[150px] rounded-[4px] border-neutral-800 bg-[#171717] text-[10px] font-bold uppercase tracking-widest text-neutral-400 focus:border-blue-600 focus:ring-0 hover:border-neutral-700 transition-colors">
                    <div className="flex items-center gap-2">
                      <Filter className="size-3.5 text-neutral-500" />
                      <SelectValue placeholder="Status" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
                    <SelectItem
                      value="all"
                      className="text-[9px] font-bold uppercase focus:bg-neutral-800"
                    >
                      Todos
                    </SelectItem>
                    <SelectItem
                      value="expired"
                      className="text-[9px] font-bold uppercase focus:bg-neutral-800 text-rose-500"
                    >
                      Expirado
                    </SelectItem>
                    <SelectItem
                      value="expiring"
                      className="text-[9px] font-bold uppercase focus:bg-neutral-800 text-amber-500"
                    >
                      Expirando
                    </SelectItem>
                    <SelectItem
                      value="low"
                      className="text-[9px] font-bold uppercase focus:bg-neutral-800 text-blue-500"
                    >
                      Baixo Estoque
                    </SelectItem>
                    <SelectItem
                      value="ok"
                      className="text-[9px] font-bold uppercase focus:bg-neutral-800 text-emerald-500"
                    >
                      Regular
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    onGroupedByProductChange(!isGroupedByProduct)
                  }
                  className={cn(
                    "w-full md:w-auto rounded-[4px] border-neutral-800 bg-[#171717] text-[10px] font-bold uppercase tracking-widest",
                    isGroupedByProduct
                      ? "border-blue-600 bg-blue-950/20 text-blue-500 hover:bg-blue-950/30"
                      : "text-neutral-400 hover:bg-neutral-800 hover:text-white",
                  )}
                >
                  <Layers className="size-3.5" />
                  {isGroupedByProduct
                    ? "Lista Completa"
                    : "Agrupar por Produto"}
                </Button>

                {(filters.searchQuery ||
                  filters.status !== "all" ||
                  filters.lowStockThreshold !==
                    DEFAULT_LOW_STOCK_THRESHOLD ||
                  isGroupedByProduct ||
                  sortConfig.key !== "createdAt" ||
                  sortConfig.direction !== "desc") && (
                  <Button
                    variant="outline"
                    onClick={onClearFilters}
                    className="w-full md:w-auto rounded-[4px] border-neutral-800 bg-[#171717] text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:bg-neutral-800 hover:text-white"
                  >
                    Limpar
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Data Display */}
          <div className="min-h-[400px]">
            {/* Loading */}
            {isLoading && (
              <div className="flex h-64 w-full flex-col items-center justify-center gap-4 rounded-[4px] border border-neutral-800 bg-[#171717]/50">
                <Loader2 className="size-8 animate-spin text-blue-600" />
                <span className="text-xs uppercase tracking-wide text-neutral-500">
                  Carregando lotes…
                </span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex h-64 w-full flex-col items-center justify-center gap-4 rounded-[4px] border border-rose-900/30 bg-rose-950/10">
                <AlertTriangle className="size-8 text-rose-500" />
                <div className="text-center">
                  <h3 className="text-sm font-semibold uppercase text-rose-500">
                    Falha na conexão
                  </h3>
                  <p className="text-xs text-rose-500/70">
                    Não foi possível carregar a lista de lotes
                  </p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && batches.length === 0 && (
              <div className="flex h-96 w-full flex-col items-center justify-center gap-6 rounded-[4px] border border-dashed border-neutral-800 bg-[#171717]/30">
                <div className="flex size-20 items-center justify-center rounded-full bg-neutral-900 ring-1 ring-neutral-800">
                  <Layers className="size-8 text-neutral-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-300">
                    {filters.searchQuery || filters.status !== "all"
                      ? "Nenhum resultado encontrado"
                      : "Nenhum lote cadastrado"}
                  </h3>
                  <p className="mt-1 max-w-xs text-xs text-neutral-500">
                    {filters.searchQuery || filters.status !== "all"
                      ? "Tente ajustar seus termos de busca ou filtros."
                      : "O inventário de lotes está vazio. Comece adicionando um novo lote."}
                  </p>
                </div>
                {filters.searchQuery || filters.status !== "all" ? (
                  <Button
                    variant="outline"
                    onClick={onClearFilters}
                    className="rounded-[4px] border-neutral-700 text-xs uppercase text-neutral-300 hover:bg-neutral-800"
                  >
                    Limpar Filtros
                  </Button>
                ) : (
                  <PermissionGate permission="batches:create">
                    <Link href="/batches/create">
                      <Button className="rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700">
                        <Plus className="mr-2 size-3.5" />
                        Primeiro Lote
                      </Button>
                    </Link>
                  </PermissionGate>
                )}
              </div>
            )}

            {/* Table View (Desktop) */}
            {!isLoading && !error && batches.length > 0 && (
              <>
                {isGroupedByProduct && (
                  <Accordion type="multiple" className="space-y-3">
                    {groupedByProduct.map((group) => (
                      <AccordionItem
                        key={group.key}
                        value={group.key}
                        className="rounded-[4px] border border-neutral-800 bg-[#171717] px-4"
                      >
                        <AccordionTrigger className="py-3 text-left hover:no-underline">
                          <div className="flex w-full items-center justify-between gap-3 pr-2">
                            <div className="space-y-0.5">
                              <h3 className="text-sm font-semibold text-white">
                                {group.productName}
                              </h3>
                              <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                                {group.productSku || "SEM SKU"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                                {group.batches.length}{" "}
                                {group.batches.length === 1 ? "lote" : "lotes"}
                              </p>
                              <p className="text-sm font-bold tracking-tighter text-white">
                                {group.totalQuantity} un
                              </p>
                            </div>
                          </div>
                        </AccordionTrigger>

                        <AccordionContent className="pb-0">
                          <div className="divide-y divide-neutral-800/60 border-t border-neutral-800">
                            {group.batches.map((batch) => {
                              const status = deriveBatchStatus(batch, {
                                lowStockThreshold: filters.lowStockThreshold,
                              });
                              const style = getStatusStyle(status.kind);

                              return (
                                <div
                                  key={batch.id}
                                  className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between"
                                >
                                  <div className="grid gap-1 text-xs">
                                    <div className="flex items-center gap-2 text-neutral-300">
                                      <span className="font-mono text-[11px]">
                                        {batch.batchNumber || "SEM LOTE"}
                                      </span>
                                      {batch.batchCode && (
                                        <>
                                          <span className="text-neutral-700">
                                            •
                                          </span>
                                          <span className="font-mono text-[10px] text-neutral-500">
                                            {batch.batchCode}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-neutral-500">
                                      <span>{batch.warehouseName}</span>
                                      <span className="text-neutral-700">
                                        •
                                      </span>
                                      <span>Qtd: {batch.quantity}</span>
                                      <span className="text-neutral-700">
                                        •
                                      </span>
                                      <span>
                                        Val: {formatDate(batch.expirationDate)}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "rounded-[2px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                        style.bg,
                                        style.color,
                                        style.border,
                                      )}
                                    >
                                      {status.label}
                                    </Badge>
                                    <Link href={`/batches/${batch.id}`}>
                                      <Button
                                        variant="outline"
                                        className="h-8 rounded-[4px] border-neutral-800 bg-neutral-900 px-3 text-[10px] font-bold uppercase tracking-wide text-neutral-300 hover:bg-neutral-800 hover:text-white"
                                      >
                                        Detalhes
                                      </Button>
                                    </Link>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}

                {!isGroupedByProduct && (
                  <div className="hidden overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717] md:block">
                    <Table>
                      <TableHeader className="bg-neutral-900">
                        <TableRow className="border-b border-neutral-800 hover:bg-neutral-900">
                          <TableHead
                            className="h-10 cursor-pointer text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white"
                            onClick={() => onSortChange("product")}
                          >
                            <div className="flex items-center gap-1">
                              Produto <SortIcon field="product" sortConfig={sortConfig} />
                            </div>
                          </TableHead>
                          <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                            Código / Lote
                          </TableHead>
                          <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                            Armazém
                          </TableHead>
                          <TableHead
                            className="h-10 text-right cursor-pointer text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white"
                            onClick={() => onSortChange("quantity")}
                          >
                            <div className="flex items-center justify-end gap-1">
                              Qtd. <SortIcon field="quantity" sortConfig={sortConfig} />
                            </div>
                          </TableHead>
                          <TableHead
                            className="h-10 text-center cursor-pointer text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white"
                            onClick={() => onSortChange("expiration")}
                          >
                            <div className="flex items-center justify-center gap-1">
                              Validade <SortIcon field="expiration" sortConfig={sortConfig} />
                            </div>
                          </TableHead>
                          <TableHead className="h-10 text-center text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                            Status
                          </TableHead>
                          <TableHead className="h-10 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                            Ações
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batches.map((batch) => {
                          const status = deriveBatchStatus(batch, {
                            lowStockThreshold: filters.lowStockThreshold,
                          });
                          const style = getStatusStyle(status.kind);
                          return (
                            <TableRow
                              key={batch.id}
                              className="group border-b border-neutral-800/50 hover:bg-neutral-800/50 transition-colors"
                            >
                              <TableCell className="py-3">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-medium text-white">
                                    {batch.productName}
                                  </span>
                                  <span className="font-mono text-[10px] text-neutral-500">
                                    {batch.productSku || "SEM SKU"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="py-3">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-mono text-xs text-neutral-300">
                                    {batch.batchNumber || "—"}
                                  </span>
                                  {batch.batchCode && (
                                    <span className="font-mono text-[10px] text-neutral-600">
                                      {batch.batchCode}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-3">
                                <div className="flex flex-col text-xs">
                                  <span className="text-neutral-300">
                                    {batch.warehouseName}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="py-3 text-right">
                                <span className="font-mono text-sm font-bold tracking-tighter text-white">
                                  {batch.quantity}
                                </span>
                              </TableCell>
                              <TableCell className="py-3 text-center">
                                <span className="font-mono text-xs text-neutral-400">
                                  {formatDate(batch.expirationDate)}
                                </span>
                              </TableCell>
                              <TableCell className="py-3 text-center">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "rounded-[2px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                    style.bg,
                                    style.color,
                                    style.border,
                                  )}
                                >
                                  {status.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-3">
                                <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                  <Link href={`/batches/${batch.id}`}>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 rounded-[4px] hover:bg-neutral-800 text-neutral-400 hover:text-white"
                                      aria-label="Ver detalhes"
                                    >
                                      <Eye className="size-4" />
                                    </Button>
                                  </Link>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Mobile Grid */}
                {!isGroupedByProduct && (
                  <div className="grid gap-3 md:hidden">
                    {batches.map((batch) => {
                      const status = deriveBatchStatus(batch, {
                        lowStockThreshold: filters.lowStockThreshold,
                      });
                      const style = getStatusStyle(status.kind);

                      return (
                        <div
                          key={batch.id}
                          className={cn(
                            "flex flex-col gap-3 rounded-[4px] border border-neutral-800 bg-[#171717] p-4",
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-white">
                                {batch.productName}
                              </h3>
                              <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                                <span className="font-mono">
                                  {batch.batchNumber || "SEM LOTE"}
                                </span>
                                <span>•</span>
                                <span>{batch.warehouseName}</span>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-[2px] border px-1.5 py-0.5 text-[10px] font-bold uppercase",
                                style.bg,
                                style.color,
                                style.border,
                              )}
                            >
                              {batch.quantity} un
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between text-xs border-t border-neutral-800 pt-3 mt-1">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                                Validade
                              </span>
                              <span className="text-neutral-300 font-mono">
                                {formatDate(batch.expirationDate)}
                              </span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                                Status
                              </span>
                              <span
                                className={cn(
                                  "font-bold uppercase",
                                  style.color,
                                )}
                              >
                                {status.label}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2">
                            <Link
                              href={`/batches/${batch.id}`}
                              className="flex-1"
                            >
                              <Button
                                variant="outline"
                                className="h-8 w-full rounded-[4px] border-neutral-800 bg-neutral-900 text-xs font-medium uppercase text-neutral-300 hover:bg-neutral-800 hover:text-white"
                              >
                                Detalhes
                              </Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {mobileFiltersPanel}
    </div>
  );
};
