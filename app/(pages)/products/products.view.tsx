"use client";

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
  AlertCircle,
  XCircle,
  Tag,
  MoreHorizontal,
  SlidersHorizontal,
  CheckCircle2,
  TrendingDown,
  Power,
  PowerOff,
  LayoutList,
  ArrowDownUp,
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
} from "./products.types";
import { cn } from "@/lib/utils";

// ── Filter option constants ──

const STOCK_FILTER_OPTIONS: Array<{
  value: StockStatus;
  label: string;
  tone: string;
  icon: ReactNode;
}> = [
  { value: "all", label: "Todos", tone: "text-neutral-200", icon: <LayoutList className="size-3.5" strokeWidth={2.5} /> },
  { value: "inStock", label: "Com estoque", tone: "text-emerald-400", icon: <CheckCircle2 className="size-3.5" strokeWidth={2.5} /> },
  { value: "lowStock", label: "Baixo estoque", tone: "text-amber-400", icon: <TrendingDown className="size-3.5" strokeWidth={2.5} /> },
  { value: "outOfStock", label: "Sem estoque", tone: "text-rose-400", icon: <XCircle className="size-3.5" strokeWidth={2.5} /> },
];

const ACTIVE_FILTER_OPTIONS: Array<{
  value: ActiveStatus;
  label: string;
  tone: string;
  icon: ReactNode;
}> = [
  { value: "all", label: "Todos", tone: "text-neutral-200", icon: <LayoutList className="size-3.5" strokeWidth={2.5} /> },
  { value: "active", label: "Ativos", tone: "text-emerald-400", icon: <Power className="size-3.5" strokeWidth={2.5} /> },
  { value: "inactive", label: "Inativos", tone: "text-neutral-400", icon: <PowerOff className="size-3.5" strokeWidth={2.5} /> },
];

const SORT_FILTER_OPTIONS: Array<{
  value: `${SortField}-${SortOrder}`;
  label: string;
}> = [
  { value: "name-asc", label: "Nome (A-Z)" },
  { value: "name-desc", label: "Nome (Z-A)" },
  { value: "sku-asc", label: "SKU (A-Z)" },
  { value: "sku-desc", label: "SKU (Z-A)" },
  { value: "createdAt-desc", label: "Recentes" },
  { value: "createdAt-asc", label: "Antigos" },
];

// ── Label helpers ──

const getStockFilterLabel = (status: StockStatus) =>
  STOCK_FILTER_OPTIONS.find((o) => o.value === status)?.label ?? "Todos";

const getActiveFilterLabel = (status: ActiveStatus) =>
  ACTIVE_FILTER_OPTIONS.find((o) => o.value === status)?.label ?? "Todos";

const getSortLabel = (sortBy: SortField, sortOrder: SortOrder) =>
  SORT_FILTER_OPTIONS.find((o) => o.value === `${sortBy}-${sortOrder}`)
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

// ── Drawer dismiss guard ──

const preventDrawerDismissFromSelectPortal = (event: Event) => {
  const target = event.target as HTMLElement | null;
  if (
    target?.closest("[data-radix-popper-content-wrapper]") ||
    target?.closest("[data-radix-select-content]")
  ) {
    event.preventDefault();
  }
};

// ── FilterToken component ──

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

// ── Status helpers ──

const getStockStatus = (quantity: number) => {
  if (quantity === 0)
    return {
      label: "SEM ESTOQUE",
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      indicator: "bg-rose-500",
    };
  if (quantity < 10)
    return {
      label: "BAIXO",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      indicator: "bg-amber-500",
    };
  if (quantity < 50)
    return {
      label: "REGULAR",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      indicator: "bg-blue-500",
    };
  return {
    label: "ALTO",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    indicator: "bg-emerald-500",
  };
};

// ── Tone maps for filter buttons ──

const stockToneMap: Record<string, { activeBorder: string; activeBg: string; activeText: string }> = {
  all: { activeBorder: "border-neutral-500/50", activeBg: "bg-neutral-500/10", activeText: "text-neutral-100" },
  inStock: { activeBorder: "border-emerald-500/50", activeBg: "bg-emerald-500/10", activeText: "text-emerald-100" },
  lowStock: { activeBorder: "border-amber-500/50", activeBg: "bg-amber-500/10", activeText: "text-amber-100" },
  outOfStock: { activeBorder: "border-rose-500/50", activeBg: "bg-rose-500/10", activeText: "text-rose-100" },
};

const activeToneMap: Record<string, { activeBorder: string; activeBg: string; activeText: string }> = {
  all: { activeBorder: "border-neutral-500/50", activeBg: "bg-neutral-500/10", activeText: "text-neutral-100" },
  active: { activeBorder: "border-emerald-500/50", activeBg: "bg-emerald-500/10", activeText: "text-emerald-100" },
  inactive: { activeBorder: "border-neutral-500/50", activeBg: "bg-neutral-500/10", activeText: "text-neutral-300" },
};

// ── Main View ──

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
          className="cursor-pointer focus:bg-neutral-800 focus:text-white flex items-center w-full"
        >
          <Eye className="mr-2 size-3.5" /> Detalhes
        </Link>
      </DropdownMenuItem>
      <PermissionGate permission="products:update">
        <DropdownMenuItem asChild>
          <Link
            href={`/products/${product.id}/edit`}
            className="cursor-pointer focus:bg-neutral-800 focus:text-white flex items-center w-full"
          >
            <Pencil className="mr-2 size-3.5" /> Editar
          </Link>
        </DropdownMenuItem>
      </PermissionGate>
      <PermissionGate permission="products:delete">
        <DropdownMenuItem
          onClick={() => onOpenDeleteDialog(product)}
          className="cursor-pointer text-rose-500 focus:bg-rose-950/20 focus:text-rose-400"
        >
          <Trash2 className="mr-2 size-3.5" /> Excluir
        </DropdownMenuItem>
      </PermissionGate>
    </DropdownMenuContent>
  </DropdownMenu>
);

const InsightCards = ({
  totalElements,
  lowStockCount,
  outOfStockCount,
  topCategory,
}: {
  totalElements: number;
  lowStockCount: number;
  outOfStockCount: number;
  topCategory: string;
}) => (
  <>
    {/* Total Items */}
    <div className="flex min-h-[132px] flex-col justify-center rounded-[4px] border border-neutral-800 bg-[#171717] px-4 py-5 transition-colors hover:border-neutral-700 md:min-h-0 md:px-5 md:py-4">
      <div className="mb-5 flex min-w-0 items-center gap-2 md:mb-2">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[2px] border border-blue-600/20 bg-blue-600/10 md:size-6">
          <BarChart3 className="size-5 text-blue-500 md:size-3.5" />
        </div>
        <span className="min-w-0 text-[10px] font-bold uppercase leading-tight tracking-widest text-neutral-500">
          Total Geral
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tracking-tighter text-white">
          {totalElements}
        </span>
        <span className="text-[10px] font-medium uppercase text-neutral-600">
          itens
        </span>
      </div>
    </div>

    {/* Low Stock */}
    <div className="flex min-h-[132px] flex-col justify-center rounded-[4px] border border-neutral-800 bg-[#171717] px-4 py-5 transition-colors hover:border-neutral-700 md:min-h-0 md:px-5 md:py-4">
      <div className="mb-5 flex min-w-0 items-center gap-2 md:mb-2">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[2px] border border-amber-500/20 bg-amber-500/10 md:size-6">
          <AlertCircle className="size-5 text-amber-500 md:size-3.5" />
        </div>
        <span className="min-w-0 text-[10px] font-bold uppercase leading-tight tracking-widest text-neutral-500">
          Baixo Estoque
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tracking-tighter text-white">
          {lowStockCount}
        </span>
        <span className="text-[10px] font-medium uppercase text-neutral-600">
          alertas
        </span>
      </div>
    </div>

    {/* Out of Stock */}
    <div className="flex min-h-[132px] flex-col justify-center rounded-[4px] border border-neutral-800 bg-[#171717] px-4 py-5 transition-colors hover:border-neutral-700 md:min-h-0 md:px-5 md:py-4">
      <div className="mb-5 flex min-w-0 items-center gap-2 md:mb-2">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[2px] border border-rose-500/20 bg-rose-500/10 md:size-6">
          <XCircle className="size-5 text-rose-500 md:size-3.5" />
        </div>
        <span className="min-w-0 text-[10px] font-bold uppercase leading-tight tracking-widest text-neutral-500">
          Sem Estoque
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tracking-tighter text-white">
          {outOfStockCount}
        </span>
        <span className="text-[10px] font-medium uppercase text-neutral-600">
          itens
        </span>
      </div>
    </div>

    {/* Top Category */}
    <div className="flex min-h-[132px] flex-col justify-center rounded-[4px] border border-neutral-800 bg-[#171717] px-4 py-5 transition-colors hover:border-neutral-700 md:min-h-0 md:px-5 md:py-4">
      <div className="mb-5 flex min-w-0 items-center gap-2 md:mb-2">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[2px] border border-emerald-500/20 bg-emerald-500/10 md:size-6">
          <Tag className="size-5 text-emerald-500 md:size-3.5" />
        </div>
        <span className="min-w-0 text-[10px] font-bold uppercase leading-tight tracking-widest text-neutral-500">
          Top Categoria
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className="text-lg font-bold tracking-tighter text-white truncate max-w-[140px]"
          title={topCategory}
        >
          {topCategory || "—"}
        </span>
      </div>
    </div>
  </>
);

export const ProductsView = ({
  filteredProducts,
  isLoading,
  error,
  filters,
  setFilters,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onSortChange,
  isMobileFiltersOpen,
  mobileFiltersDraft,
  onMobileFiltersOpenChange,
  onOpenMobileFilters,
  onApplyMobileFilters,
  onClearFilters,
  onClearMobileFilters,
  onMobileFilterDraftChange,
  onOpenDeleteDialog,
  onConfirmDelete,
  onSecondConfirmDelete,
  onCloseDeleteDialog,
  onCloseSecondConfirm,
  deleteDialogOpen,
  secondConfirmOpen,
  deleteProduct,
  deleteBatches,
  isCheckingDeleteBatches,
  isDeletingProduct,
}: ProductsViewProps) => {
  const activeFilterCount = getActiveFilterCount(
    filters.stockStatus,
    filters.activeStatus,
    filters.sortBy,
    filters.sortOrder,
  );

  // Stats from filtered products
  const lowStockCount = filteredProducts.filter(
    (p) => p.totalQuantity > 0 && p.totalQuantity < 10,
  ).length;
  const outOfStockCount = filteredProducts.filter((p) => p.totalQuantity === 0).length;

  const categories = filteredProducts.flatMap((product) =>
    product.categoryName ? [product.categoryName] : [],
  );
  const topCategory =
    categories.length > 0
      ? categories
          .sort(
            (a, b) =>
              categories.filter((v) => v === a).length -
              categories.filter((v) => v === b).length,
          )
          .pop()
      : "N/A";

  const handleSort = (field: SortField) => {
    const newOrder: SortOrder =
      filters.sortBy === field && filters.sortOrder === "asc" ? "desc" : "asc";
    onSortChange(field, newOrder);
  };




  // ── Mobile filter drawer ──
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
            Refine os produtos por estoque, status e ordenação.
          </DrawerDescription>
        </DrawerHeader>

        <div className="max-h-[68vh] overflow-y-auto px-5 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-6">
            {/* Stock status */}
            <section className="space-y-3">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                Nível de estoque
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {STOCK_FILTER_OPTIONS.map((option) => {
                  const tones = stockToneMap[option.value];
                  const isActive = mobileFiltersDraft.stockStatus === option.value;
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant="outline"
                      onClick={() =>
                        onMobileFilterDraftChange({ stockStatus: option.value })
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

            {/* Active status */}
            <section className="space-y-3">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                Status do produto
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {ACTIVE_FILTER_OPTIONS.map((option) => {
                  const tones = activeToneMap[option.value];
                  const isActive = mobileFiltersDraft.activeStatus === option.value;
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant="outline"
                      onClick={() =>
                        onMobileFilterDraftChange({ activeStatus: option.value })
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

            {/* Sort order */}
            <section className="space-y-3">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                Ordenar por
              </h3>
              <Select
                value={`${mobileFiltersDraft.sortBy}-${mobileFiltersDraft.sortOrder}`}
                onValueChange={(value) => {
                  const [sortBy, sortOrder] = value.split("-") as [SortField, SortOrder];
                  onMobileFilterDraftChange({ sortBy, sortOrder });
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
            className="h-11 flex-[2] rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
          >
            Aplicar filtros
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );

  return (
    <>
      <div className="min-h-screen bg-[#0A0A0A] pb-20 font-sans text-neutral-200">
        <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
          {/* Main Content */}
          <div className="space-y-6">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tighter text-white">
                    Produtos
                  </h1>
                  <p className="text-sm text-neutral-500 mt-1">
                    Gerencie o inventário de produtos
                  </p>
                </div>
              </div>

              {/* Mobile Filter Tokens */}
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
                      active={filters.stockStatus !== "all"}
                      icon={<Package className="size-3.5" />}
                      label="Estoque"
                      value={getStockFilterLabel(filters.stockStatus)}
                      onClick={onOpenMobileFilters}
                    />
                    <FilterToken
                      active={filters.activeStatus !== "all"}
                      icon={<Power className="size-3.5" />}
                      label="Status"
                      value={getActiveFilterLabel(filters.activeStatus)}
                      onClick={onOpenMobileFilters}
                    />
                    <FilterToken
                      active={filters.sortBy !== "name" || filters.sortOrder !== "asc"}
                      icon={<ArrowDownUp className="size-3.5" />}
                      label="Ordem"
                      value={getSortLabel(filters.sortBy, filters.sortOrder)}
                      onClick={onOpenMobileFilters}
                    />
                  </div>
                </div>
              </div>

              {/* Row 1: Insight Cards */}
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4">
                <InsightCards totalElements={pagination.totalElements} lowStockCount={lowStockCount} outOfStockCount={outOfStockCount} topCategory={topCategory ?? "N/A"} />
              </div>

              {/* Mobile Insight Cards */}
              <div
                data-slot="mobile-product-kpis"
                className="grid grid-cols-2 gap-3 md:hidden"
              >
                <InsightCards totalElements={pagination.totalElements} lowStockCount={lowStockCount} outOfStockCount={outOfStockCount} topCategory={topCategory ?? "N/A"} />
              </div>

              {/* Row 2: Search & Filters */}
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:h-12 w-full">
                <div className="relative h-12 flex-1 min-w-[200px] flex items-center">
                  <div className="text-neutral-500 absolute left-3">
                    <Search className="size-3.5" />
                  </div>
                  <Input
                    placeholder="Pesquisar no inventário (nome, SKU, código)..."
                    value={filters.searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full rounded-[4px] border-neutral-800 bg-[#171717] pl-10 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-blue-600 focus:ring-0 transition-all hover:border-neutral-700"
                  />
                </div>

                {/* Desktop filters */}
                <div className="hidden flex-col items-center gap-2 h-auto md:flex md:h-12 md:flex-row">
                  <Select
                    value={filters.stockStatus}
                    onValueChange={(value) =>
                      setFilters((current) => ({
                        ...current,
                        stockStatus: value as StockStatus,
                      }))
                    }
                  >
                    <SelectTrigger className="h-12 w-full md:w-[150px] rounded-[4px] border-neutral-800 bg-[#171717] text-[10px] font-bold uppercase tracking-widest text-neutral-400 focus:border-blue-600 focus:ring-0 hover:border-neutral-700 transition-colors">
                      <div className="flex items-center gap-2">
                        <Package className="size-3.5 text-neutral-500" />
                        <SelectValue placeholder="Estoque" />
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
                        value="inStock"
                        className="text-[9px] font-bold uppercase focus:bg-neutral-800 text-emerald-500"
                      >
                        Com estoque
                      </SelectItem>
                      <SelectItem
                        value="lowStock"
                        className="text-[9px] font-bold uppercase focus:bg-neutral-800 text-amber-500"
                      >
                        Baixo estoque
                      </SelectItem>
                      <SelectItem
                        value="outOfStock"
                        className="text-[9px] font-bold uppercase focus:bg-neutral-800 text-rose-500"
                      >
                        Sem estoque
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onValueChange={(value) => {
                      const [field, order] = value.split("-") as [
                        SortField,
                        SortOrder,
                      ];
                      onSortChange(field, order);
                    }}
                  >
                    <SelectTrigger className="h-12 w-full md:w-[150px] rounded-[4px] border-neutral-800 bg-[#171717] text-[10px] font-bold uppercase tracking-widest text-neutral-400 focus:border-blue-600 focus:ring-0 hover:border-neutral-700 transition-colors">
                      <div className="flex items-center gap-2">
                        <Filter className="size-3.5 text-neutral-500" />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
                      <SelectItem
                        value="name-asc"
                        className="text-[12px] font-bold uppercase focus:bg-neutral-800"
                      >
                        Nome (A-Z)
                      </SelectItem>
                      <SelectItem
                        value="name-desc"
                        className="text-[12px] font-bold uppercase focus:bg-neutral-800"
                      >
                        Nome (Z-A)
                      </SelectItem>
                      <SelectItem
                        value="sku-asc"
                        className="text-[12px] font-bold uppercase focus:bg-neutral-800"
                      >
                        SKU (A-Z)
                      </SelectItem>
                      <SelectItem
                        value="sku-desc"
                        className="text-[12px] font-bold uppercase focus:bg-neutral-800"
                      >
                        SKU (Z-A)
                      </SelectItem>
                      <SelectItem
                        value="createdAt-desc"
                        className="text-[12px] font-bold uppercase focus:bg-neutral-800"
                      >
                        Recentes
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.pageSize.toString()}
                    onValueChange={(value) => onPageSizeChange(Number(value))}
                  >
                    <SelectTrigger className="h-12 w-full md:w-[75px] rounded-[4px] border-neutral-800 bg-[#171717] text-[12px] font-bold uppercase tracking-widest text-neutral-400 focus:border-blue-600 focus:ring-0 hover:border-neutral-700 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
                      <SelectItem
                        value="10"
                        className="text-[12px] font-bold uppercase focus:bg-neutral-800"
                      >
                        10
                      </SelectItem>
                      <SelectItem
                        value="20"
                        className="text-[12px] font-bold uppercase focus:bg-neutral-800"
                      >
                        20
                      </SelectItem>
                      <SelectItem
                        value="50"
                        className="text-[12px] font-bold uppercase focus:bg-neutral-800"
                      >
                        50
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {(filters.stockStatus !== "all" ||
                    filters.activeStatus !== "all" ||
                    filters.searchQuery ||
                    filters.sortBy !== "name" ||
                    filters.sortOrder !== "asc") && (
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
                    Carregando dados…
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
                      Não foi possível carregar a lista de produtos
                    </p>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && filteredProducts.length === 0 && (
                <div className="flex h-96 w-full flex-col items-center justify-center gap-6 rounded-[4px] border border-dashed border-neutral-800 bg-[#171717]/30">
                  <div className="flex size-20 items-center justify-center rounded-full bg-neutral-900 ring-1 ring-neutral-800">
                    <Package className="size-8 text-neutral-600" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-300">
                      {filters.searchQuery || filters.stockStatus !== "all" || filters.activeStatus !== "all"
                        ? "Nenhum resultado encontrado"
                        : "Nenhum produto cadastrado"}
                    </h3>
                    <p className="mt-1 max-w-xs text-xs text-neutral-500">
                      {filters.searchQuery || filters.stockStatus !== "all" || filters.activeStatus !== "all"
                        ? "Tente ajustar seus termos de busca ou filtros."
                        : "O inventário deste armazém está vazio. Comece adicionando produtos."}
                    </p>
                  </div>
                  {filters.searchQuery || filters.stockStatus !== "all" || filters.activeStatus !== "all" ? (
                    <Button
                      variant="outline"
                      onClick={onClearFilters}
                      className="rounded-[4px] border-neutral-700 text-xs uppercase text-neutral-300 hover:bg-neutral-800"
                    >
                      Limpar Filtros
                    </Button>
                  ) : null}
                </div>
              )}

              {/* Table View (Desktop) */}
              {!isLoading && !error && filteredProducts.length > 0 && (
                <>
                  <div className="hidden overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717] md:block">
                    <Table>
                      <TableHeader className="bg-neutral-900">
                        <TableRow className="border-b border-neutral-800 hover:bg-neutral-900">
                          <TableHead
                            className="h-10 cursor-pointer text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white"
                            onClick={() => handleSort("name")}
                          >
                            <div className="flex items-center gap-1">
                              Nome <SortIcon field="name" sortBy={filters.sortBy} sortOrder={filters.sortOrder} />
                            </div>
                          </TableHead>
                          <TableHead
                            className="h-10 cursor-pointer text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white"
                            onClick={() => handleSort("sku")}
                          >
                            <div className="flex items-center gap-1">
                              SKU <SortIcon field="sku" sortBy={filters.sortBy} sortOrder={filters.sortOrder} />
                            </div>
                          </TableHead>
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
                        {filteredProducts.map((product) => {
                          const stockStatus = getStockStatus(
                            product.totalQuantity,
                          );
                          return (
                            <TableRow
                              key={product.id}
                              className="group border-b border-neutral-800/50 hover:bg-neutral-800/50 transition-colors"
                            >
                              <TableCell className="py-3">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-medium text-white">
                                    {product.name}
                                  </span>
                                  {product.barcode && (
                                    <span className="font-mono text-[10px] text-neutral-500">
                                      {product.barcode}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-3 font-mono text-xs text-neutral-400">
                                {product.sku || "—"}
                              </TableCell>
                              <TableCell className="py-3">
                                <div className="flex flex-col text-xs">
                                  <span className="text-neutral-300">
                                    {product.categoryName || "—"}
                                  </span>
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
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "rounded-[2px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                    stockStatus.bg,
                                    stockStatus.color,
                                    stockStatus.border,
                                  )}
                                >
                                  {stockStatus.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-3 text-right">
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
                                      <Link
                                        href={`/products/${product.id}/edit`}
                                      >
                                        <Pencil className="size-4" />
                                      </Link>
                                    </Button>
                                  </PermissionGate>
                                  <PermissionGate permission="products:delete">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        onOpenDeleteDialog(product)
                                      }
                                      className="size-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-rose-500"
                                    >
                                      <Trash2 className="size-4" />
                                    </Button>
                                  </PermissionGate>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Grid */}
                  <div className="grid gap-3 md:hidden">
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product.totalQuantity);
                      return (
                        <div
                          key={product.id}
                          className="relative flex flex-col gap-3 rounded-[4px] border border-neutral-800 bg-[#171717] p-4 transition-colors hover:border-neutral-700"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 pr-2">
                              <h3 className="font-semibold text-white">
                                {product.name}
                              </h3>
                              <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                                <span className="font-mono">
                                  {product.sku || "SEM SKU"}
                                </span>
                                <span>•</span>
                                <span>{product.categoryName}</span>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "rounded-[2px] border px-1.5 py-0.5 text-[10px] font-bold uppercase",
                                  stockStatus.bg,
                                  stockStatus.color,
                                  stockStatus.border,
                                )}
                              >
                                {product.totalQuantity} un
                              </Badge>
                              <ProductActions product={product} onOpenDeleteDialog={onOpenDeleteDialog} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-neutral-800 pt-6">
                      <div className="text-xs text-neutral-500">
                        Mostrando {pagination.page * pagination.pageSize + 1} a{" "}
                        {Math.min(
                          (pagination.page + 1) * pagination.pageSize,
                          pagination.totalElements,
                        )}{" "}
                        de {pagination.totalElements} produtos
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPageChange(pagination.page - 1)}
                          disabled={pagination.page === 0}
                          className="size-8 rounded-[4px] border-neutral-800 bg-[#171717] p-0 hover:bg-neutral-800 disabled:opacity-30"
                        >
                          <ChevronLeft className="size-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPageChange(pagination.page + 1)}
                          disabled={
                            pagination.page >= pagination.totalPages - 1
                          }
                          className="size-8 rounded-[4px] border-neutral-800 bg-[#171717] p-0 hover:bg-neutral-800 disabled:opacity-30"
                        >
                          <ChevronRight className="size-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFiltersPanel}

      {/* Delete Confirmation Modals */}
      <ResponsiveModal
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) onCloseDeleteDialog();
        }}
        title="Confirmar exclusão"
        description={`Tem certeza que deseja excluir o produto ${deleteProduct?.name}? Esta ação removerá o produto e todos os lotes associados.`}
        maxWidth="sm:max-w-[450px]"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={onCloseDeleteDialog}
              className="rounded-[4px] border-neutral-700 bg-transparent text-xs uppercase hover:bg-neutral-800 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={onConfirmDelete}
              disabled={isCheckingDeleteBatches || isDeletingProduct}
              className="rounded-[4px] bg-rose-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-rose-700"
            >
              {isDeletingProduct ? (
                <>
                  <Loader2 className="mr-2 size-3.5 animate-spin" />
                  Removendo…
                </>
              ) : (
                "Excluir"
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {isCheckingDeleteBatches && (
            <div className="flex items-center gap-2 rounded-[4px] border border-blue-900/30 bg-blue-950/10 px-3 py-2 text-xs text-blue-500">
              <Loader2 className="size-3.5 animate-spin" />
              Verificando estoque…
            </div>
          )}

          {!isCheckingDeleteBatches && deleteBatches.length > 0 && (
            <div className="rounded-[4px] border border-amber-900/30 bg-amber-950/10 p-3 text-xs text-amber-500">
              <div className="flex items-center gap-2 font-bold uppercase tracking-wide">
                <AlertTriangle className="size-3.5" />
                Estoque Existente
              </div>
              <p className="mt-1 opacity-90">
                Ainda existe estoque deste produto. A exclusão irá apagar todos
                os lotes associados.
              </p>
              <div className="mt-2 space-y-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                {deleteBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="flex items-center justify-between"
                  >
                    <span>Lote {batch.id.slice(0, 8)}</span>
                    <span>{batch.quantity} un</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ResponsiveModal>

      <ResponsiveModal
        open={secondConfirmOpen}
        onOpenChange={(open) => {
          if (!open) onCloseSecondConfirm();
        }}
        title="Confirmação Final"
        description={`Tem certeza que deseja excluir? O produto ${deleteProduct?.name} será removido do sistema.`}
        maxWidth="sm:max-w-[400px]"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={onCloseSecondConfirm}
              className="rounded-[4px] border-neutral-700 bg-transparent text-xs uppercase hover:bg-neutral-800 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={onSecondConfirmDelete}
              disabled={isDeletingProduct}
              className="rounded-[4px] bg-rose-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-rose-700"
            >
              {isDeletingProduct ? (
                <>
                  <Loader2 className="mr-2 size-3.5 animate-spin" />
                  Removendo…
                </>
              ) : (
                "Confirmar Exclusão"
              )}
            </Button>
          </>
        }
      >
        <div className="py-2">
          <p className="text-xs text-neutral-500">
            Esta é a última confirmação antes de remover o produto e seus lotes
            do sistema.
          </p>
        </div>
      </ResponsiveModal>
    </>
  );
};
