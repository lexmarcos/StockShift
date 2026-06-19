"use client";

import { RemoteImage } from "@/components/ui/remote-image";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
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
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { PermissionGate } from "@/components/permission-gate";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import {
  ProductsViewProps,
  SortField,
  SortOrder,
  Product,
  StockStatus,
  ActiveStatus,
  ProductFilters,
  LatestBatchPrice,
} from "./products.types";
import { buildCategoryBadgeStyle } from "@/lib/category-color";
import { cn } from "@/lib/utils";

const STOCK_FILTER_OPTIONS: Array<{
  value: StockStatus;
  label: string;
  tone: string;
  icon: ReactNode;
}> = [
  {
    value: "all",
    label: "Todos",
    tone: "text-neutral-200",
    icon: <LayoutList className="size-3.5" strokeWidth={2.5} />,
  },
  {
    value: "inStock",
    label: "Com estoque",
    tone: "text-emerald-400",
    icon: <CheckCircle2 className="size-3.5" strokeWidth={2.5} />,
  },
  {
    value: "lowStock",
    label: "Baixo estoque",
    tone: "text-amber-400",
    icon: <TrendingDown className="size-3.5" strokeWidth={2.5} />,
  },
  {
    value: "outOfStock",
    label: "Sem estoque",
    tone: "text-rose-400",
    icon: <XCircle className="size-3.5" strokeWidth={2.5} />,
  },
];

const ACTIVE_FILTER_OPTIONS: Array<{
  value: ActiveStatus;
  label: string;
  tone: string;
  icon: ReactNode;
}> = [
  {
    value: "all",
    label: "Todos",
    tone: "text-neutral-200",
    icon: <LayoutList className="size-3.5" strokeWidth={2.5} />,
  },
  {
    value: "active",
    label: "Ativos",
    tone: "text-emerald-400",
    icon: <Power className="size-3.5" strokeWidth={2.5} />,
  },
  {
    value: "inactive",
    label: "Inativos",
    tone: "text-neutral-400",
    icon: <PowerOff className="size-3.5" strokeWidth={2.5} />,
  },
];

const SORT_FILTER_OPTIONS: Array<{
  value: `${SortField}-${SortOrder}`;
  label: string;
}> = [
  { value: "name-asc", label: "Nome (A-Z)" },
  { value: "name-desc", label: "Nome (Z-A)" },
  { value: "barcode-asc", label: "Código de barras (A-Z)" },
  { value: "barcode-desc", label: "Código de barras (Z-A)" },
  { value: "createdAt-desc", label: "Recentes" },
  { value: "createdAt-asc", label: "Antigos" },
];

const getStockFilterLabel = (status: StockStatus) =>
  STOCK_FILTER_OPTIONS.find((option) => option.value === status)?.label ??
  "Todos";

const getActiveFilterLabel = (status: ActiveStatus) =>
  ACTIVE_FILTER_OPTIONS.find((option) => option.value === status)?.label ??
  "Todos";

const getSortLabel = (sortBy: SortField, sortOrder: SortOrder) =>
  SORT_FILTER_OPTIONS.find((option) => option.value === `${sortBy}-${sortOrder}`)
    ?.label ?? "Nome (A-Z)";

const getActiveFilterCount = (
  stockStatus: StockStatus,
  activeStatus: ActiveStatus,
  sortBy: SortField,
  sortOrder: SortOrder,
) => {
  let count = 0;
  if (stockStatus !== "all") count += 1;
  if (activeStatus !== "all") count += 1;
  if (sortBy !== "name" || sortOrder !== "asc") count += 1;
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

const getStockStatus = (quantity: number) => {
  if (quantity === 0) {
    return {
      label: "SEM ESTOQUE",
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      indicator: "bg-rose-500",
    };
  }

  if (quantity < 10) {
    return {
      label: "BAIXO",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      indicator: "bg-amber-500",
    };
  }

  if (quantity < 50) {
    return {
      label: "REGULAR",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      indicator: "bg-blue-500",
    };
  }

  return {
    label: "ALTO",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    indicator: "bg-emerald-500",
  };
};

const stockToneMap: Record<
  string,
  { activeBorder: string; activeBg: string; activeText: string }
> = {
  all: {
    activeBorder: "border-neutral-500/50",
    activeBg: "bg-neutral-500/10",
    activeText: "text-neutral-100",
  },
  inStock: {
    activeBorder: "border-emerald-500/50",
    activeBg: "bg-emerald-500/10",
    activeText: "text-emerald-100",
  },
  lowStock: {
    activeBorder: "border-amber-500/50",
    activeBg: "bg-amber-500/10",
    activeText: "text-amber-100",
  },
  outOfStock: {
    activeBorder: "border-rose-500/50",
    activeBg: "bg-rose-500/10",
    activeText: "text-rose-100",
  },
};

const activeToneMap: Record<
  string,
  { activeBorder: string; activeBg: string; activeText: string }
> = {
  all: {
    activeBorder: "border-neutral-500/50",
    activeBg: "bg-neutral-500/10",
    activeText: "text-neutral-100",
  },
  active: {
    activeBorder: "border-emerald-500/50",
    activeBg: "bg-emerald-500/10",
    activeText: "text-emerald-100",
  },
  inactive: {
    activeBorder: "border-neutral-500/50",
    activeBg: "bg-neutral-500/10",
    activeText: "text-neutral-300",
  },
};

const hasVisibleProductFilters = (filters: ProductFilters) =>
  filters.stockStatus !== "all" ||
  filters.activeStatus !== "all" ||
  Boolean(filters.searchQuery) ||
  filters.sortBy !== "name" ||
  filters.sortOrder !== "asc";

export const ProductsView = (props: ProductsViewProps) => {
  const activeFilterCount = getActiveFilterCount(
    props.filters.stockStatus,
    props.filters.activeStatus,
    props.filters.sortBy,
    props.filters.sortOrder,
  );
  const outOfStockCount = props.filteredProducts.filter(
    (product) => product.totalQuantity === 0,
  ).length;
  const summary = { activeFilterCount, outOfStockCount };

  return (
    <>
      <div className="min-h-screen bg-[#0A0A0A] pb-20 font-sans text-neutral-200">
        <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
          <div className="space-y-6">
            <ProductsHeaderPanel props={props} summary={summary} />
            <ProductsDataDisplay props={props} />
          </div>
        </main>
      </div>
      <ProductsMobileFiltersDrawer props={props} />
      <ProductDeleteDialog props={props} />
      <ProductSecondConfirmDialog props={props} />
    </>
  );
};

type ProductsSummary = {
  activeFilterCount: number;
  outOfStockCount: number;
};

const SortIcon = ({
  field,
  sortBy,
  sortOrder,
}: {
  field: SortField;
  sortBy: SortField;
  sortOrder: SortOrder;
}) => {
  if (sortBy !== field) return <div className="size-3 opacity-0" />;

  return sortOrder === "asc" ? (
    <ArrowUp className="ml-1 size-3 text-blue-500" />
  ) : (
    <ArrowDown className="ml-1 size-3 text-blue-500" />
  );
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

const ProductsHeaderPanel = ({
  props,
  summary,
}: {
  props: ProductsViewProps;
  summary: ProductsSummary;
}) => (
  <div className="flex flex-col gap-5">
    <ProductsPageTitle />
    <ProductsMobileFilterTokens props={props} summary={summary} />
    <ProductsKpiArea props={props} summary={summary} />
    <ProductsToolbar props={props} />
  </div>
);

const ProductsPageTitle = () => (
  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
      <h1 className="text-2xl font-semibold tracking-tighter text-white">
        Produtos
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Gerencie o inventário de produtos
      </p>
    </div>
  </div>
);

const ProductsMobileFilterTokens = ({
  props,
  summary,
}: {
  props: ProductsViewProps;
  summary: ProductsSummary;
}) => (
  <div className="md:hidden">
    <div className="relative -mx-4">
      <div className="overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-2 pb-1 pr-8">
          <FilterToken
            active={summary.activeFilterCount > 0}
            count={summary.activeFilterCount}
            icon={<SlidersHorizontal className="size-3.5" />}
            label="Filtros"
            onClick={props.onOpenMobileFilters}
          />
          <FilterToken
            active={props.filters.stockStatus !== "all"}
            icon={<Package className="size-3.5" />}
            label="Estoque"
            value={getStockFilterLabel(props.filters.stockStatus)}
            onClick={props.onOpenMobileFilters}
          />
          <FilterToken
            active={props.filters.activeStatus !== "all"}
            icon={<Power className="size-3.5" />}
            label="Status"
            value={getActiveFilterLabel(props.filters.activeStatus)}
            onClick={props.onOpenMobileFilters}
          />
          <FilterToken
            active={
              props.filters.sortBy !== "name" ||
              props.filters.sortOrder !== "asc"
            }
            icon={<ArrowDownUp className="size-3.5" />}
            label="Ordem"
            value={getSortLabel(props.filters.sortBy, props.filters.sortOrder)}
            onClick={props.onOpenMobileFilters}
          />
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-0 right-0 top-0 w-12 bg-gradient-to-l from-[#0A0A0A] to-transparent" />
    </div>
  </div>
);

const ProductsKpiArea = ({
  props,
  summary,
}: {
  props: ProductsViewProps;
  summary: ProductsSummary;
}) => (
  <>
    <div className="hidden md:block">
      <InsightCards
        totalElements={props.pagination.totalElements}
        outOfStockCount={summary.outOfStockCount}
        isOutOfStockActive={props.filters.stockStatus === "outOfStock"}
        onOutOfStockKpiClick={props.onOutOfStockKpiClick}
      />
    </div>
    <div
      data-slot="mobile-product-kpis"
      className="grid grid-cols-2 gap-2 md:hidden"
    >
      <MobileInsightCards
        totalElements={props.pagination.totalElements}
        outOfStockCount={summary.outOfStockCount}
        isOutOfStockActive={props.filters.stockStatus === "outOfStock"}
        onOutOfStockKpiClick={props.onOutOfStockKpiClick}
      />
    </div>
  </>
);

const InsightCards = ({
  totalElements,
  outOfStockCount,
  isOutOfStockActive,
  onOutOfStockKpiClick,
}: {
  totalElements: number;
  outOfStockCount: number;
  isOutOfStockActive: boolean;
  onOutOfStockKpiClick: () => void;
}) => (
  <div className="flex items-center justify-between gap-6 overflow-x-auto rounded-[4px] border border-neutral-800 bg-[#171717] p-4 [scrollbar-width:none] sm:p-5 [&::-webkit-scrollbar]:hidden">
    <div className="flex shrink-0 items-center gap-3 sm:gap-4">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-[4px] border border-blue-500/30 bg-blue-500/10 sm:size-12">
        <BarChart3 className="size-5 text-blue-500 sm:size-6" strokeWidth={2} />
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          Total Geral
        </div>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className="font-mono text-xl font-bold tracking-tight text-white sm:text-2xl">
            {totalElements}
          </span>
          <span className="text-xs font-medium text-neutral-400">itens</span>
        </div>
      </div>
    </div>
    <div className="h-10 w-px shrink-0 bg-neutral-800" />
    <button
      type="button"
      onClick={onOutOfStockKpiClick}
      className="flex shrink-0 items-center gap-3 text-left sm:gap-4"
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-[4px] border border-rose-500/30 bg-rose-500/10 sm:size-12">
        <XCircle className="size-5 text-rose-500 sm:size-6" strokeWidth={2} />
      </div>
      <div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          Sem Estoque
          {isOutOfStockActive && (
            <span className="size-1.5 shrink-0 rounded-[1px] bg-blue-500" />
          )}
        </div>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className="font-mono text-xl font-bold tracking-tight text-white sm:text-2xl">
            {outOfStockCount}
          </span>
          <span className="text-xs font-medium text-neutral-400">itens</span>
        </div>
      </div>
    </button>
  </div>
);

const MobileInsightCards = ({
  totalElements,
  outOfStockCount,
  isOutOfStockActive,
  onOutOfStockKpiClick,
}: {
  totalElements: number;
  outOfStockCount: number;
  isOutOfStockActive: boolean;
  onOutOfStockKpiClick: () => void;
}) => (
  <>
    <div className="flex items-center gap-3 rounded-[4px] border border-neutral-800 bg-[#171717] p-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-[4px] border border-blue-500/30 bg-blue-500/10">
        <BarChart3 className="size-5 text-blue-500" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          Total Geral
        </div>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className="font-mono text-xl font-bold tracking-tight text-white">
            {totalElements}
          </span>
          <span className="text-xs font-medium text-neutral-400">itens</span>
        </div>
      </div>
    </div>
    <button
      type="button"
      onClick={onOutOfStockKpiClick}
      className="flex items-center gap-3 rounded-[4px] border border-neutral-800 bg-[#171717] p-3 text-left"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-[4px] border border-rose-500/30 bg-rose-500/10">
        <XCircle className="size-5 text-rose-500" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          Sem Estoque
          {isOutOfStockActive && (
            <span className="size-1.5 shrink-0 rounded-[1px] bg-blue-500" />
          )}
        </div>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className="font-mono text-xl font-bold tracking-tight text-white">
            {outOfStockCount}
          </span>
          <span className="text-xs font-medium text-neutral-400">itens</span>
        </div>
      </div>
    </button>
  </>
);

const ProductsToolbar = ({ props }: { props: ProductsViewProps }) => (
  <div className="flex w-full flex-col gap-3 md:h-12 md:flex-row md:items-center">
    <ProductsSearchInput props={props} />
    <ProductsDesktopFilters props={props} />
  </div>
);

const ProductsSearchInput = ({ props }: { props: ProductsViewProps }) => (
  <div className="relative flex h-12 min-w-[200px] flex-1 items-center">
    <div className="absolute left-3 text-neutral-500">
      <Search className="size-3.5" />
    </div>
    <Input
      placeholder="Pesquisar no inventário (nome, SKU, código)..."
      value={props.filters.searchQuery}
      onChange={(event) => props.onSearchChange(event.target.value)}
      className="w-full rounded-[4px] border-neutral-800 bg-[#171717] pl-10 pr-10 text-sm text-neutral-200 placeholder:text-neutral-600 transition-all hover:border-neutral-700 focus:border-blue-600 focus:ring-0"
    />
    {props.filters.searchQuery && (
      <button
        type="button"
        onClick={() => props.onSearchChange("")}
        aria-label="Limpar pesquisa"
        className="absolute right-3 flex items-center justify-center text-neutral-500 transition-colors hover:text-neutral-200"
      >
        <X className="size-4" strokeWidth={2.5} />
      </button>
    )}
  </div>
);

const ProductsDesktopFilters = ({ props }: { props: ProductsViewProps }) => (
  <div className="hidden h-auto flex-col items-center gap-2 md:flex md:h-12 md:flex-row">
    <ProductsStockSelect props={props} />
    <ProductsSortSelect props={props} />
    <ProductsPageSizeSelect props={props} />
    {hasVisibleProductFilters(props.filters) && (
      <Button
        variant="outline"
        onClick={props.onClearFilters}
        className="w-full rounded-[4px] border-neutral-800 bg-[#171717] text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:bg-neutral-800 hover:text-white md:w-auto"
      >
        Limpar
      </Button>
    )}
  </div>
);

const ProductsStockSelect = ({ props }: { props: ProductsViewProps }) => (
  <Select
    value={props.filters.stockStatus}
    onValueChange={(value) =>
      props.setFilters((current) => ({
        ...current,
        stockStatus: value as StockStatus,
      }))
    }
  >
    <SelectTrigger className="h-12 w-full rounded-[4px] border-neutral-800 bg-[#171717] text-[10px] font-bold uppercase tracking-widest text-neutral-400 transition-colors hover:border-neutral-700 focus:border-blue-600 focus:ring-0 md:w-[150px]">
      <div className="flex items-center gap-2">
        <Package className="size-3.5 text-neutral-500" />
        <SelectValue placeholder="Estoque" />
      </div>
    </SelectTrigger>
    <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
      {STOCK_FILTER_OPTIONS.map((option) => (
        <SelectItem
          key={option.value}
          value={option.value}
          className={cn(
            "text-[9px] font-bold uppercase focus:bg-neutral-800",
            option.tone,
          )}
        >
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

const ProductsSortSelect = ({ props }: { props: ProductsViewProps }) => (
  <Select
    value={`${props.filters.sortBy}-${props.filters.sortOrder}`}
    onValueChange={(value) => {
      const [field, order] = value.split("-") as [SortField, SortOrder];
      props.onSortChange(field, order);
    }}
  >
    <SelectTrigger className="h-12 w-full rounded-[4px] border-neutral-800 bg-[#171717] text-[10px] font-bold uppercase tracking-widest text-neutral-400 transition-colors hover:border-neutral-700 focus:border-blue-600 focus:ring-0 md:w-[150px]">
      <div className="flex items-center gap-2">
        <Filter className="size-3.5 text-neutral-500" />
        <SelectValue />
      </div>
    </SelectTrigger>
    <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
      {SORT_FILTER_OPTIONS.map((option) => (
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

const ProductsPageSizeSelect = ({ props }: { props: ProductsViewProps }) => (
  <Select
    value={props.filters.pageSize.toString()}
    onValueChange={(value) => props.onPageSizeChange(Number(value))}
  >
    <SelectTrigger className="h-12 w-full rounded-[4px] border-neutral-800 bg-[#171717] text-[12px] font-bold uppercase tracking-widest text-neutral-400 transition-colors hover:border-neutral-700 focus:border-blue-600 focus:ring-0 md:w-[75px]">
      <SelectValue />
    </SelectTrigger>
    <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
      {["10", "20", "50"].map((pageSize) => (
        <SelectItem
          key={pageSize}
          value={pageSize}
          className="text-[12px] font-bold uppercase focus:bg-neutral-800"
        >
          {pageSize}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

const ProductsDataDisplay = ({ props }: { props: ProductsViewProps }) => {
  if (props.isLoading) return <ProductsLoadingState />;
  if (props.error) return <ProductsErrorState />;
  if (props.filteredProducts.length === 0) return <ProductsEmptyState props={props} />;

  return (
    <div className="min-h-[400px]">
      <ProductsTable props={props} />
      <ProductsMobileCards props={props} />
      <ProductsPagination props={props} />
    </div>
  );
};

const ProductsLoadingState = () => (
  <div className="min-h-[400px]">
    <div className="flex h-64 w-full flex-col items-center justify-center gap-4 rounded-[4px] border border-neutral-800 bg-[#171717]/50">
      <Loader2 className="size-8 animate-spin text-blue-600" />
      <span className="text-xs uppercase tracking-wide text-neutral-500">
        Carregando dados…
      </span>
    </div>
  </div>
);

const ProductsErrorState = () => (
  <div className="min-h-[400px]">
    <div className="flex h-64 w-full flex-col items-center justify-center gap-4 rounded-[4px] border border-rose-900/30 bg-rose-950/10">
      <AlertTriangle className="size-8 text-rose-500" />
      <div className="text-center">
        <h3 className="text-sm font-semibold uppercase text-rose-500">
          Falha na conexão
        </h3>
        <p className="text-xs text-rose-500/70">
          Não foi possível carregar a lista de produtos
        </p>
      </div>
    </div>
  </div>
);

const ProductsEmptyState = ({ props }: { props: ProductsViewProps }) => {
  const hasFilters = hasVisibleProductFilters(props.filters);

  return (
    <div className="min-h-[400px]">
      <div className="flex h-96 w-full flex-col items-center justify-center gap-6 rounded-[4px] border border-dashed border-neutral-800 bg-[#171717]/30">
        <div className="flex size-20 items-center justify-center rounded-[4px] bg-neutral-900 ring-1 ring-neutral-800">
          <Package className="size-8 text-neutral-600" />
        </div>
        <div className="text-center">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-300">
            {hasFilters ? "Nenhum resultado encontrado" : "Nenhum produto cadastrado"}
          </h3>
          <p className="mt-1 max-w-xs text-xs text-neutral-500">
            {hasFilters
              ? "Tente ajustar seus termos de busca ou filtros."
              : "O inventário deste armazém está vazio. Comece adicionando produtos."}
          </p>
        </div>
        {hasFilters ? (
          <Button
            variant="outline"
            onClick={props.onClearFilters}
            className="rounded-[4px] border-neutral-700 text-xs uppercase text-neutral-300 hover:bg-neutral-800"
          >
            Limpar Filtros
          </Button>
        ) : null}
      </div>
    </div>
  );
};

const ProductsTable = ({ props }: { props: ProductsViewProps }) => {
  const handleSort = (field: SortField) => {
    const nextOrder: SortOrder =
      props.filters.sortBy === field && props.filters.sortOrder === "asc"
        ? "desc"
        : "asc";
    props.onSortChange(field, nextOrder);
  };

  return (
    <div className="hidden overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717] md:block">
      <Table>
        <TableHeader className="bg-neutral-900">
          <TableRow className="border-b border-neutral-800 hover:bg-neutral-900">
            <ProductSortableHead
              field="name"
              label="Nome"
              filters={props.filters}
              onSort={handleSort}
            />
            <ProductSortableHead
              field="barcode"
              label="Código de barras"
              filters={props.filters}
              onSort={handleSort}
            />
            <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
              Categoria / Marca
            </TableHead>
            <TableHead className="h-10 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">
              Estoque
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
          {props.filteredProducts.map((product) => (
            <ProductTableRow
              key={product.id}
              product={product}
              onOpenDeleteDialog={props.onOpenDeleteDialog}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const ProductSortableHead = ({
  field,
  filters,
  label,
  onSort,
}: {
  field: SortField;
  filters: ProductFilters;
  label: string;
  onSort: (field: SortField) => void;
}) => (
  <TableHead
    className="h-10 cursor-pointer text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white"
    onClick={() => onSort(field)}
  >
    <div className="flex items-center gap-1">
      {label}
      <SortIcon field={field} sortBy={filters.sortBy} sortOrder={filters.sortOrder} />
    </div>
  </TableHead>
);

const ProductTableRow = ({
  product,
  onOpenDeleteDialog,
}: {
  product: Product;
  onOpenDeleteDialog: (product: Product) => void;
}) => {
  const stockStatus = getStockStatus(product.totalQuantity);

  return (
    <TableRow className="group border-b border-neutral-800/50 transition-colors hover:bg-neutral-800/50">
      <TableCell className="py-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-white">{product.name}</span>
        </div>
      </TableCell>
      <TableCell className="py-3 font-mono text-xs text-neutral-400">
        {product.barcode || "—"}
      </TableCell>
      <TableCell className="py-3">
        <div className="flex flex-col text-xs">
          <span className="text-neutral-300">{product.categoryName || "—"}</span>
          <span className="text-[10px] text-neutral-600">
            {product.brand?.name || "—"}
          </span>
        </div>
      </TableCell>
      <TableCell className="py-3 text-right">
        <span className="font-mono text-sm font-bold tracking-tighter text-white">
          {product.totalQuantity}
        </span>
      </TableCell>
      <TableCell className="py-3 text-center">
        <ProductStockBadge label={stockStatus.label} stockStatus={stockStatus} />
      </TableCell>
      <TableCell className="py-3 text-right">
        <ProductTableActions product={product} onOpenDeleteDialog={onOpenDeleteDialog} />
      </TableCell>
    </TableRow>
  );
};

const ProductStockBadge = ({
  label,
  stockStatus,
}: {
  label: string;
  stockStatus: ReturnType<typeof getStockStatus>;
}) => (
  <Badge
    variant="outline"
    className={cn(
      "rounded-[2px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
      stockStatus.bg,
      stockStatus.color,
      stockStatus.border,
    )}
  >
    {label}
  </Badge>
);

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

const ProductsMobileCards = ({ props }: { props: ProductsViewProps }) => (
  <div className="grid gap-2 md:hidden">
    {props.filteredProducts.map((product) => (
      <ProductMobileCard
        key={product.id}
        product={product}
        latestBatchPrice={props.latestBatchPriceByProduct[product.id] ?? null}
        onOpenDeleteDialog={props.onOpenDeleteDialog}
      />
    ))}
  </div>
);

const ProductMobileCard = ({
  product,
  latestBatchPrice,
  onOpenDeleteDialog,
}: {
  product: Product;
  latestBatchPrice: LatestBatchPrice | null;
  onOpenDeleteDialog: (product: Product) => void;
}) => {
  const priceLabel = latestBatchPrice?.sellingPriceLabel ?? "Sem preço";

  return (
    <div
      data-testid="product-mobile-card"
      className="flex max-w-full items-start gap-2.5 overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717] p-2.5 transition-colors hover:border-neutral-700"
    >
      <ProductCardImage product={product} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="truncate text-sm font-semibold text-white">
          {product.name}
        </h3>
        <ProductCategoryBadge name={product.categoryName} />
        <span className="font-mono text-xs font-medium text-neutral-300">
          {priceLabel} • {product.totalQuantity} Unids
        </span>
      </div>
      <div className="flex shrink-0 self-start">
        <ProductActions product={product} onOpenDeleteDialog={onOpenDeleteDialog} />
      </div>
    </div>
  );
};

const ProductCardImage = ({ product }: { product: Product }) => {
  if (product.imageUrl) {
    return (
      <span className="relative block w-10 h-15 shrink-0 overflow-hidden rounded-[4px] border border-neutral-800 bg-neutral-900">
        <RemoteImage
          src={product.imageUrl}
          alt={`Foto de ${product.name}`}
          fill
          sizes="120px"
          className="object-cover"
        />
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label="Produto sem foto"
      className="flex size-10 shrink-0 items-center justify-center rounded-[4px] border border-neutral-800 bg-neutral-900 text-neutral-600"
    >
      <Package className="size-4" strokeWidth={2} />
    </span>
  );
};

const ProductCategoryBadge = ({ name }: { name: string | null }) => {
  const trimmedName = name?.trim();
  if (!trimmedName) return null;
  return (
    <span
      className="w-fit break-words rounded-[4px] border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider leading-tight"
      style={buildCategoryBadgeStyle(trimmedName)}
    >
      {trimmedName}
    </span>
  );
};

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

const ProductsPagination = ({ props }: { props: ProductsViewProps }) => {
  if (props.pagination.totalPages <= 1) return null;

  const firstVisibleItem = props.pagination.page * props.pagination.pageSize + 1;
  const lastVisibleItem = Math.min(
    (props.pagination.page + 1) * props.pagination.pageSize,
    props.pagination.totalElements,
  );

  return (
    <div className="flex items-center justify-between border-t border-neutral-800 pt-6">
      <div className="text-xs text-neutral-500">
        Mostrando {firstVisibleItem} a {lastVisibleItem} de{" "}
        {props.pagination.totalElements} produtos
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => props.onPageChange(props.pagination.page - 1)}
          disabled={props.pagination.page === 0}
          className="size-8 rounded-[4px] border-neutral-800 bg-[#171717] p-0 hover:bg-neutral-800 disabled:opacity-30"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => props.onPageChange(props.pagination.page + 1)}
          disabled={props.pagination.page >= props.pagination.totalPages - 1}
          className="size-8 rounded-[4px] border-neutral-800 bg-[#171717] p-0 hover:bg-neutral-800 disabled:opacity-30"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
};

const ProductsMobileFiltersDrawer = ({ props }: { props: ProductsViewProps }) => (
  <Drawer
    open={props.isMobileFiltersOpen}
    onOpenChange={props.onMobileFiltersOpenChange}
  >
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
          Refine os produtos por estoque, status e ordenação.
        </DrawerDescription>
      </DrawerHeader>
      <ProductsMobileFilterBody props={props} />
      <DrawerFooter className="flex-row gap-3 border-t border-neutral-800 px-5 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={props.onClearMobileFilters}
          className="h-11 flex-1 rounded-[4px] border-neutral-700 bg-transparent text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:bg-neutral-800 hover:text-white"
        >
          <Trash2 className="mr-2 size-3.5" />
          Limpar
        </Button>
        <Button
          type="button"
          onClick={props.onApplyMobileFilters}
          className="h-11 flex-[2] rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
        >
          Aplicar filtros
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
);

const ProductsMobileFilterBody = ({ props }: { props: ProductsViewProps }) => (
  <div className="max-h-[68vh] overflow-y-auto px-5 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    <div className="space-y-6">
      <ProductStockMobileFilter props={props} />
      <div className="h-px bg-neutral-800/60" />
      <ProductActiveMobileFilter props={props} />
      <div className="h-px bg-neutral-800/60" />
      <ProductSortMobileFilter props={props} />
    </div>
  </div>
);

const ProductStockMobileFilter = ({ props }: { props: ProductsViewProps }) => (
  <section className="space-y-3">
    <h3 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
      Nível de estoque
    </h3>
    <div className="grid grid-cols-2 gap-2">
      {STOCK_FILTER_OPTIONS.map((option) => {
        const tones = stockToneMap[option.value];
        const selected = props.mobileFiltersDraft.stockStatus === option.value;
        return (
          <ProductMobileFilterButton
            key={option.value}
            selected={selected}
            tones={tones}
            icon={option.icon}
            label={option.label}
            onClick={() =>
              props.onMobileFilterDraftChange({ stockStatus: option.value })
            }
          />
        );
      })}
    </div>
  </section>
);

const ProductActiveMobileFilter = ({ props }: { props: ProductsViewProps }) => (
  <section className="space-y-3">
    <h3 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
      Status do produto
    </h3>
    <div className="grid grid-cols-3 gap-2">
      {ACTIVE_FILTER_OPTIONS.map((option) => {
        const tones = activeToneMap[option.value];
        const selected = props.mobileFiltersDraft.activeStatus === option.value;
        return (
          <ProductMobileFilterButton
            key={option.value}
            selected={selected}
            tones={tones}
            icon={option.icon}
            label={option.label}
            onClick={() =>
              props.onMobileFilterDraftChange({ activeStatus: option.value })
            }
          />
        );
      })}
    </div>
  </section>
);

const ProductMobileFilterButton = ({
  icon,
  label,
  onClick,
  selected,
  tones,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  selected: boolean;
  tones: { activeBorder: string; activeBg: string; activeText: string };
}) => (
  <Button
    type="button"
    variant="outline"
    onClick={onClick}
    className={cn(
      "h-10 w-full rounded-[4px] border text-xs font-bold transition-colors",
      selected
        ? cn(tones.activeBorder, tones.activeBg, tones.activeText)
        : "border-neutral-800 bg-neutral-950/50 text-neutral-500 hover:border-neutral-700 hover:bg-neutral-900 hover:text-white",
    )}
  >
    {icon}
    {label}
  </Button>
);

const ProductSortMobileFilter = ({ props }: { props: ProductsViewProps }) => (
  <section className="space-y-3">
    <h3 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
      Ordenar por
    </h3>
    <Select
      value={`${props.mobileFiltersDraft.sortBy}-${props.mobileFiltersDraft.sortOrder}`}
      onValueChange={(value) => {
        const [sortBy, sortOrder] = value.split("-") as [SortField, SortOrder];
        props.onMobileFilterDraftChange({ sortBy, sortOrder });
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
);

const ProductDeleteDialog = ({ props }: { props: ProductsViewProps }) => (
  <ResponsiveModal
    open={props.deleteDialogOpen}
    onOpenChange={(open) => {
      if (!open) props.onCloseDeleteDialog();
    }}
    title="Confirmar exclusão"
    description={`Tem certeza que deseja remover ${props.deleteProduct?.name} deste armazém? Esta ação apagará os lotes associados ao armazém atual.`}
    maxWidth="sm:max-w-[450px]"
    footer={<ProductDeleteDialogFooter props={props} />}
  >
    <ProductDeleteDialogBody props={props} />
  </ResponsiveModal>
);

const ProductDeleteDialogFooter = ({ props }: { props: ProductsViewProps }) => (
  <>
    <Button
      variant="ghost"
      onClick={props.onCloseDeleteDialog}
      className="rounded-[4px] border-neutral-700 bg-transparent text-xs uppercase hover:bg-neutral-800 hover:text-white"
    >
      Cancelar
    </Button>
    <Button
      type="button"
      onClick={props.onConfirmDelete}
      disabled={props.isCheckingDeleteBatches || props.isDeletingProduct}
      className="rounded-[4px] bg-rose-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-rose-700"
    >
      {props.isDeletingProduct ? (
        <>
          <Loader2 className="mr-2 size-3.5 animate-spin" />
          Removendo…
        </>
      ) : (
        "Remover"
      )}
    </Button>
  </>
);

const ProductDeleteDialogBody = ({ props }: { props: ProductsViewProps }) => (
  <div className="space-y-4">
    {props.isCheckingDeleteBatches && (
      <div className="flex items-center gap-2 rounded-[4px] border border-blue-900/30 bg-blue-950/10 px-3 py-2 text-xs text-blue-500">
        <Loader2 className="size-3.5 animate-spin" />
        Verificando estoque…
      </div>
    )}
    {!props.isCheckingDeleteBatches && props.deleteBatches.length > 0 && (
      <ProductExistingStockWarning props={props} />
    )}
  </div>
);

const ProductExistingStockWarning = ({ props }: { props: ProductsViewProps }) => (
  <div className="rounded-[4px] border border-amber-900/30 bg-amber-950/10 p-3 text-xs text-amber-500">
    <div className="flex items-center gap-2 font-bold uppercase tracking-wide">
      <AlertTriangle className="size-3.5" />
      Estoque Existente
    </div>
    <p className="mt-1 opacity-90">
      Ainda existe estoque deste produto neste armazém. A remoção irá apagar os
      lotes associados ao armazém atual.
    </p>
    <div className="mt-2 space-y-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
      {props.deleteBatches.map((batch) => (
        <div key={batch.id} className="flex items-center justify-between">
          <span>Lote {batch.id.slice(0, 8)}</span>
          <span>{batch.quantity} un</span>
        </div>
      ))}
    </div>
  </div>
);

const ProductSecondConfirmDialog = ({ props }: { props: ProductsViewProps }) => (
  <ResponsiveModal
    open={props.secondConfirmOpen}
    onOpenChange={(open) => {
      if (!open) props.onCloseSecondConfirm();
    }}
    title="Confirmação Final"
    description={`Tem certeza que deseja remover ${props.deleteProduct?.name} deste armazém?`}
    maxWidth="sm:max-w-[400px]"
    footer={<ProductSecondConfirmFooter props={props} />}
  >
    <div className="py-2">
      <p className="text-xs text-neutral-500">
        Esta é a última confirmação antes de apagar os lotes deste produto no
        armazém atual.
      </p>
    </div>
  </ResponsiveModal>
);

const ProductSecondConfirmFooter = ({ props }: { props: ProductsViewProps }) => (
  <>
    <Button
      variant="ghost"
      onClick={props.onCloseSecondConfirm}
      className="rounded-[4px] border-neutral-700 bg-transparent text-xs uppercase hover:bg-neutral-800 hover:text-white"
    >
      Cancelar
    </Button>
    <Button
      onClick={props.onSecondConfirmDelete}
      disabled={props.isDeletingProduct}
      className="rounded-[4px] bg-rose-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-rose-700"
    >
      {props.isDeletingProduct ? (
        <>
          <Loader2 className="mr-2 size-3.5 animate-spin" />
          Removendo…
        </>
      ) : (
        "Confirmar Remoção"
      )}
    </Button>
  </>
);
