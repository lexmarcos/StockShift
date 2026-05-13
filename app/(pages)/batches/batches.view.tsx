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
  ChevronRight,
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

const DEFAULT_LOW_STOCK_THRESHOLD = 10;

const STATUS_FILTER_OPTIONS: Array<{
  value: BatchFilters["status"];
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
    value: "expired",
    label: "Expirado",
    tone: "text-rose-400",
    icon: <XCircle className="size-3.5" strokeWidth={2.5} />,
  },
  {
    value: "expiring",
    label: "Expirando",
    tone: "text-amber-400",
    icon: <Clock className="size-3.5" strokeWidth={2.5} />,
  },
  {
    value: "low",
    label: "Baixo estoque",
    tone: "text-blue-400",
    icon: <TrendingDown className="size-3.5" strokeWidth={2.5} />,
  },
  {
    value: "ok",
    label: "Regular",
    tone: "text-emerald-400",
    icon: <CheckCircle2 className="size-3.5" strokeWidth={2.5} />,
  },
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

const statusToneMap: Record<
  string,
  { activeBorder: string; activeBg: string; activeText: string }
> = {
  all: {
    activeBorder: "border-neutral-500/50",
    activeBg: "bg-neutral-500/10",
    activeText: "text-neutral-100",
  },
  expired: {
    activeBorder: "border-rose-500/50",
    activeBg: "bg-rose-500/10",
    activeText: "text-rose-100",
  },
  expiring: {
    activeBorder: "border-amber-500/50",
    activeBg: "bg-amber-500/10",
    activeText: "text-amber-100",
  },
  low: {
    activeBorder: "border-blue-500/50",
    activeBg: "bg-blue-500/10",
    activeText: "text-blue-100",
  },
  ok: {
    activeBorder: "border-emerald-500/50",
    activeBg: "bg-emerald-500/10",
    activeText: "text-emerald-100",
  },
};

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

const hasActiveBatchFilters = (props: BatchesViewProps) =>
  Boolean(props.filters.searchQuery) ||
  props.filters.status !== "all" ||
  props.filters.lowStockThreshold !== DEFAULT_LOW_STOCK_THRESHOLD ||
  props.isGroupedByProduct ||
  props.sortConfig.key !== "createdAt" ||
  props.sortConfig.direction !== "desc";

const preventDrawerDismissFromSelectPortal = (event: Event) => {
  const target = event.target as HTMLElement | null;

  if (
    target?.closest("[data-radix-popper-content-wrapper]") ||
    target?.closest("[data-radix-select-content]")
  ) {
    event.preventDefault();
  }
};

export const BatchesView = (props: BatchesViewProps) => {
  const activeFilterCount = getActiveFilterCount(
    props.filters,
    props.sortConfig,
    props.isGroupedByProduct,
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 font-sans text-neutral-200">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <div className="space-y-6">
          <BatchesHeaderPanel
            props={props}
            activeFilterCount={activeFilterCount}
          />
          <BatchesDataDisplay props={props} />
        </div>
      </main>
      <BatchesMobileFiltersDrawer props={props} />
    </div>
  );
};

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

const BatchesHeaderPanel = ({
  activeFilterCount,
  props,
}: {
  activeFilterCount: number;
  props: BatchesViewProps;
}) => (
  <div className="flex flex-col gap-5">
    <BatchesTitle />
    <BatchesMobileFilterTokens
      props={props}
      activeFilterCount={activeFilterCount}
    />
    <BatchesInsightCard props={props} />
    <BatchesToolbar props={props} />
  </div>
);

const BatchesTitle = () => (
  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
      <h1 className="text-2xl font-semibold tracking-tighter text-white">
        Lotes
      </h1>
      <p className="mt-1 text-sm text-neutral-500">Controle lotes e validades</p>
    </div>
    <PermissionGate permission="batches:create">
      <Link href="/batches/create" className="w-full md:w-auto">
        <Button className="h-10 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 md:w-auto">
          <Plus className="mr-2 size-4" />
          Novo Lote
        </Button>
      </Link>
    </PermissionGate>
  </div>
);

const BatchesMobileFilterTokens = ({
  activeFilterCount,
  props,
}: {
  activeFilterCount: number;
  props: BatchesViewProps;
}) => (
  <div className="relative -mx-4 md:hidden">
    <div className="overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-max gap-2 pb-1 pr-8">
        <FilterToken
          active={activeFilterCount > 0}
          count={activeFilterCount}
          icon={<SlidersHorizontal className="size-3.5" />}
          label="Filtros"
          onClick={props.onOpenMobileFilters}
        />
        <FilterToken
          active={props.filters.status !== "all"}
          icon={<Filter className="size-3.5" />}
          label="Status"
          value={getStatusFilterLabel(props.filters.status)}
          onClick={props.onOpenMobileFilters}
        />
        <FilterToken
          active={
            props.sortConfig.key !== "createdAt" ||
            props.sortConfig.direction !== "desc"
          }
          icon={<ArrowDown className="size-3.5" />}
          label="Ordem"
          value={getSortLabel(props.sortConfig)}
          onClick={props.onOpenMobileFilters}
        />
        <FilterToken
          active={props.isGroupedByProduct}
          icon={<Layers className="size-3.5" />}
          label="Visão"
          value={props.isGroupedByProduct ? "Agrupado" : "Lista completa"}
          onClick={props.onOpenMobileFilters}
        />
        <FilterToken
          active={
            props.filters.lowStockThreshold !== DEFAULT_LOW_STOCK_THRESHOLD
          }
          icon={<Package className="size-3.5" />}
          label="Baixo"
          value={`<= ${props.filters.lowStockThreshold} un.`}
          onClick={props.onOpenMobileFilters}
        />
      </div>
    </div>
    <div className="pointer-events-none absolute bottom-0 right-0 top-0 w-12 bg-gradient-to-l from-[#0A0A0A] to-transparent" />
  </div>
);

const BatchesInsightCard = ({ props }: { props: BatchesViewProps }) => (
  <div className="flex items-center justify-between gap-6 overflow-x-auto rounded-[4px] border border-neutral-800 bg-[#171717] p-4 [scrollbar-width:none] sm:p-5 [&::-webkit-scrollbar]:hidden">
    <BatchStatusKpi
      label="Expirados"
      value={props.statusCounts.expired}
      valueLabel="lotes"
      icon={<XCircle className="size-5 text-rose-500 sm:size-6" strokeWidth={2} />}
      active={props.filters.status === "expired"}
      tone="rose"
      onClick={() =>
        props.setStatus(props.filters.status === "expired" ? "all" : "expired")
      }
    />
    <div className="h-10 w-px shrink-0 bg-neutral-800" />
    <BatchStatusKpi
      label="Expirando (30d)"
      value={props.statusCounts.expiring}
      valueLabel="alertas"
      icon={<Calendar className="size-5 text-amber-500 sm:size-6" strokeWidth={2} />}
      active={props.filters.status === "expiring"}
      tone="amber"
      onClick={() =>
        props.setStatus(
          props.filters.status === "expiring" ? "all" : "expiring",
        )
      }
    />
  </div>
);

const BatchStatusKpi = ({
  active,
  icon,
  label,
  onClick,
  tone,
  value,
  valueLabel,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  tone: "amber" | "rose";
  value: number;
  valueLabel: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex shrink-0 items-center gap-3 text-left sm:gap-4"
  >
    <div
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-[4px] border sm:size-12",
        tone === "rose"
          ? "border-rose-500/30 bg-rose-500/10"
          : "border-amber-500/30 bg-amber-500/10",
      )}
    >
      {icon}
    </div>
    <div>
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
        {label}
        {active && (
          <span className="size-1.5 shrink-0 rounded-[1px] bg-blue-500" />
        )}
      </div>
      <div className="mt-0.5 flex items-baseline gap-1.5">
        <span className="font-mono text-xl font-bold tracking-tight text-white sm:text-2xl">
          {value}
        </span>
        <span className="text-xs font-medium text-neutral-400">
          {valueLabel}
        </span>
      </div>
    </div>
  </button>
);

const BatchesToolbar = ({ props }: { props: BatchesViewProps }) => (
  <div className="flex w-full flex-col gap-3 md:h-12 md:flex-row md:items-center">
    <div className="relative flex h-12 min-w-[200px] flex-1 items-center">
      <div className="absolute left-3 text-neutral-500">
        <Search className="size-3.5" />
      </div>
      <Input
        placeholder="Buscar por produto, SKU ou lote…"
        value={props.filters.searchQuery}
        onChange={(event) => props.setSearchQuery(event.target.value)}
        className="w-full rounded-[4px] border-neutral-800 bg-[#171717] pl-10 text-sm text-neutral-200 placeholder:text-neutral-600 transition-all hover:border-neutral-700 focus:border-blue-600 focus:ring-0"
      />
    </div>
    <BatchesDesktopFilters props={props} />
  </div>
);

const BatchesDesktopFilters = ({ props }: { props: BatchesViewProps }) => (
  <div className="hidden h-auto flex-col items-center gap-2 md:flex md:h-12 md:flex-row">
    <BatchStatusSelect props={props} />
    <Button
      type="button"
      variant="outline"
      onClick={() => props.onGroupedByProductChange(!props.isGroupedByProduct)}
      className={cn(
        "w-full rounded-[4px] border-neutral-800 bg-[#171717] text-[10px] font-bold uppercase tracking-widest md:w-auto",
        props.isGroupedByProduct
          ? "border-blue-600 bg-blue-950/20 text-blue-500 hover:bg-blue-950/30"
          : "text-neutral-400 hover:bg-neutral-800 hover:text-white",
      )}
    >
      <Layers className="size-3.5" />
      {props.isGroupedByProduct ? "Lista Completa" : "Agrupar por Produto"}
    </Button>
    {hasActiveBatchFilters(props) && (
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

const BatchStatusSelect = ({ props }: { props: BatchesViewProps }) => (
  <Select
    value={props.filters.status}
    onValueChange={(value) => props.setStatus(value as BatchFilters["status"])}
  >
    <SelectTrigger className="h-12 w-full rounded-[4px] border-neutral-800 bg-[#171717] text-[10px] font-bold uppercase tracking-widest text-neutral-400 transition-colors hover:border-neutral-700 focus:border-blue-600 focus:ring-0 md:w-[150px]">
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

const BatchesDataDisplay = ({ props }: { props: BatchesViewProps }) => {
  if (props.isLoading) return <BatchesLoadingState />;
  if (props.error) return <BatchesErrorState />;
  if (props.batches.length === 0) return <BatchesEmptyState props={props} />;

  return (
    <div className="min-h-[400px]">
      {props.isGroupedByProduct ? (
        <BatchesGroupedAccordion props={props} />
      ) : (
        <>
          <BatchesTable props={props} />
          <BatchesMobileCards props={props} />
        </>
      )}
    </div>
  );
};

const BatchesLoadingState = () => (
  <div className="min-h-[400px]">
    <div className="flex h-64 w-full flex-col items-center justify-center gap-4 rounded-[4px] border border-neutral-800 bg-[#171717]/50">
      <Loader2 className="size-8 animate-spin text-blue-600" />
      <span className="text-xs uppercase tracking-wide text-neutral-500">
        Carregando lotes…
      </span>
    </div>
  </div>
);

const BatchesErrorState = () => (
  <div className="min-h-[400px]">
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
  </div>
);

const BatchesEmptyState = ({ props }: { props: BatchesViewProps }) => {
  const hasFilters = Boolean(props.filters.searchQuery) || props.filters.status !== "all";

  return (
    <div className="min-h-[400px]">
      <div className="flex h-96 w-full flex-col items-center justify-center gap-6 rounded-[4px] border border-dashed border-neutral-800 bg-[#171717]/30">
        <div className="flex size-20 items-center justify-center rounded-[4px] bg-neutral-900 ring-1 ring-neutral-800">
          <Layers className="size-8 text-neutral-600" />
        </div>
        <div className="text-center">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-300">
            {hasFilters ? "Nenhum resultado encontrado" : "Nenhum lote cadastrado"}
          </h3>
          <p className="mt-1 max-w-xs text-xs text-neutral-500">
            {hasFilters
              ? "Tente ajustar seus termos de busca ou filtros."
              : "O inventário de lotes está vazio. Comece adicionando um novo lote."}
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
    </div>
  );
};

const BatchesGroupedAccordion = ({ props }: { props: BatchesViewProps }) => (
  <Accordion type="multiple" className="space-y-3">
    {props.groupedByProduct.map((group) => (
      <BatchProductGroup
        key={group.key}
        group={group}
        lowStockThreshold={props.filters.lowStockThreshold}
      />
    ))}
  </Accordion>
);

const BatchProductGroup = ({
  group,
  lowStockThreshold,
}: {
  group: ProductBatchesGroup;
  lowStockThreshold: number;
}) => (
  <AccordionItem
    value={group.key}
    className="rounded-[4px] border border-neutral-800 bg-[#171717] px-4"
  >
    <AccordionTrigger className="py-3 text-left hover:no-underline">
      <BatchProductGroupHeader group={group} />
    </AccordionTrigger>
    <AccordionContent className="pb-0">
      <div className="divide-y divide-neutral-800/60 border-t border-neutral-800">
        {group.batches.map((batch) => (
          <BatchGroupedRow
            key={batch.id}
            batch={batch}
            lowStockThreshold={lowStockThreshold}
          />
        ))}
      </div>
    </AccordionContent>
  </AccordionItem>
);

const BatchProductGroupHeader = ({
  group,
}: {
  group: ProductBatchesGroup;
}) => (
  <div className="flex w-full items-center justify-between gap-3 pr-2">
    <div className="space-y-0.5">
      <h3 className="text-sm font-semibold text-white">{group.productName}</h3>
      <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
        {group.productSku || "SEM SKU"}
      </p>
    </div>
    <div className="text-right">
      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
        {group.batches.length} {group.batches.length === 1 ? "lote" : "lotes"}
      </p>
      <p className="text-sm font-bold tracking-tighter text-white">
        {group.totalQuantity} un
      </p>
    </div>
  </div>
);

const BatchGroupedRow = ({
  batch,
  lowStockThreshold,
}: {
  batch: Batch;
  lowStockThreshold: number;
}) => {
  const status = deriveBatchStatus(batch, { lowStockThreshold });
  const style = getStatusStyle(status.kind);

  return (
    <div className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
      <div className="grid gap-1 text-xs">
        <div className="flex items-center gap-2 text-neutral-300">
          <span className="font-mono text-[11px]">
            {batch.batchNumber || "SEM LOTE"}
          </span>
          {batch.batchCode && (
            <>
              <span className="text-neutral-700">•</span>
              <span className="font-mono text-[10px] text-neutral-500">
                {batch.batchCode}
              </span>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-neutral-500">
          <span>{batch.warehouseName}</span>
          <span className="text-neutral-700">•</span>
          <span>Qtd: {batch.quantity}</span>
          <span className="text-neutral-700">•</span>
          <span>Val: {formatDate(batch.expirationDate)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <BatchStatusBadge statusLabel={status.label} style={style} />
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
};

const BatchesTable = ({ props }: { props: BatchesViewProps }) => (
  <div className="hidden overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717] md:block">
    <Table>
      <TableHeader className="bg-neutral-900">
        <TableRow className="border-b border-neutral-800 hover:bg-neutral-900">
          <BatchSortableHead
            align="left"
            field="product"
            label="Produto"
            props={props}
          />
          <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Código / Lote
          </TableHead>
          <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Armazém
          </TableHead>
          <BatchSortableHead
            align="right"
            field="quantity"
            label="Qtd."
            props={props}
          />
          <BatchSortableHead
            align="center"
            field="expiration"
            label="Validade"
            props={props}
          />
          <TableHead className="h-10 text-center text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Status
          </TableHead>
          <TableHead className="h-10 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Ações
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.batches.map((batch) => (
          <BatchTableRow
            key={batch.id}
            batch={batch}
            lowStockThreshold={props.filters.lowStockThreshold}
          />
        ))}
      </TableBody>
    </Table>
  </div>
);

const BatchSortableHead = ({
  align,
  field,
  label,
  props,
}: {
  align: "center" | "left" | "right";
  field: SortConfig["key"];
  label: string;
  props: BatchesViewProps;
}) => (
  <TableHead
    className={cn(
      "h-10 cursor-pointer text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white",
      align === "right" && "text-right",
      align === "center" && "text-center",
    )}
    onClick={() => props.onSortChange(field)}
  >
    <div
      className={cn(
        "flex items-center gap-1",
        align === "right" && "justify-end",
        align === "center" && "justify-center",
      )}
    >
      {label}
      <SortIcon field={field} sortConfig={props.sortConfig} />
    </div>
  </TableHead>
);

const BatchTableRow = ({
  batch,
  lowStockThreshold,
}: {
  batch: Batch;
  lowStockThreshold: number;
}) => {
  const status = deriveBatchStatus(batch, { lowStockThreshold });
  const style = getStatusStyle(status.kind);

  return (
    <TableRow className="group border-b border-neutral-800/50 transition-colors hover:bg-neutral-800/50">
      <TableCell className="py-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-white">{batch.productName}</span>
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
      <TableCell className="py-3 text-xs text-neutral-300">
        {batch.warehouseName}
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
        <BatchStatusBadge statusLabel={status.label} style={style} />
      </TableCell>
      <TableCell className="py-3">
        <div className="flex justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
          <Link href={`/batches/${batch.id}`}>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-[4px] text-neutral-400 hover:bg-neutral-800 hover:text-white"
              aria-label="Ver detalhes"
            >
              <Eye className="size-4" />
            </Button>
          </Link>
        </div>
      </TableCell>
    </TableRow>
  );
};

const BatchStatusBadge = ({
  statusLabel,
  style,
}: {
  statusLabel: string;
  style: ReturnType<typeof getStatusStyle>;
}) => (
  <Badge
    variant="outline"
    className={cn(
      "rounded-[2px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
      style.bg,
      style.color,
      style.border,
    )}
  >
    {statusLabel}
  </Badge>
);

const BatchesMobileCards = ({ props }: { props: BatchesViewProps }) => (
  <div className="grid gap-3 md:hidden">
    {props.batches.map((batch) => (
      <BatchMobileCard
        key={batch.id}
        batch={batch}
        lowStockThreshold={props.filters.lowStockThreshold}
      />
    ))}
  </div>
);

const BatchMobileCard = ({
  batch,
  lowStockThreshold,
}: {
  batch: Batch;
  lowStockThreshold: number;
}) => {
  const status = deriveBatchStatus(batch, { lowStockThreshold });
  const style = getStatusStyle(status.kind);

  return (
    <Link
      href={`/batches/${batch.id}`}
      className="flex flex-col gap-3 rounded-[4px] border border-neutral-800 bg-[#171717] p-4 transition-colors hover:bg-neutral-800/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-base font-semibold leading-tight text-white">
            {batch.productName}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <span className="uppercase">{batch.batchNumber || "SEM LOTE"}</span>
            <span className="text-neutral-600">&bull;</span>
            <span className="truncate">{batch.warehouseName}</span>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 rounded-[2px] border px-2 py-1 text-[10px] font-bold uppercase",
            style.bg,
            style.color,
            style.border,
          )}
        >
          {batch.quantity} un
        </Badge>
      </div>
      <div className="mt-1 flex items-center justify-between border-t border-neutral-800 pt-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500">Validade</span>
          <span className="text-sm text-neutral-400">
            {formatDate(batch.expirationDate)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end text-right">
            <span className="mb-0.5 text-[10px] font-medium leading-none text-neutral-500">
              Status
            </span>
            <span
              className={cn(
                "text-xs font-bold uppercase leading-none",
                style.color,
              )}
            >
              {status.label}
            </span>
          </div>
          <ChevronRight className="size-4 text-neutral-500" />
        </div>
      </div>
    </Link>
  );
};

const BatchesMobileFiltersDrawer = ({ props }: { props: BatchesViewProps }) => (
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
          Refine os lotes por status, agrupamento e regra de estoque.
        </DrawerDescription>
      </DrawerHeader>
      <BatchesMobileFilterBody props={props} />
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
          className="h-11 flex-[2] rounded-[4px] bg-blue-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-blue-500"
        >
          Aplicar filtros
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
);

const BatchesMobileFilterBody = ({ props }: { props: BatchesViewProps }) => (
  <div className="max-h-[68vh] overflow-y-auto px-5 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    <div className="space-y-6">
      <BatchesStatusMobileFilter props={props} />
      <div className="h-px bg-neutral-800/60" />
      <BatchesLowStockMobileFilter props={props} />
      <div className="h-px bg-neutral-800/60" />
      <BatchesViewModeMobileFilter props={props} />
      <div className="h-px bg-neutral-800/60" />
      <BatchesSortMobileFilter props={props} />
    </div>
  </div>
);

const BatchesStatusMobileFilter = ({ props }: { props: BatchesViewProps }) => (
  <section className="space-y-3">
    <h3 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
      Status do lote
    </h3>
    <div className="grid grid-cols-3 gap-2">
      {STATUS_FILTER_OPTIONS.map((option) => {
        const tones = statusToneMap[option.value];
        const selected = props.mobileFiltersDraft.status === option.value;
        return (
          <BatchMobileFilterButton
            key={option.value}
            selected={selected}
            tones={tones}
            icon={option.icon}
            label={option.label}
            onClick={() =>
              props.onMobileFilterDraftChange({ status: option.value })
            }
          />
        );
      })}
    </div>
  </section>
);

const BatchMobileFilterButton = ({
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

const BatchesLowStockMobileFilter = ({
  props,
}: {
  props: BatchesViewProps;
}) => (
  <section className="space-y-3">
    <div className="flex items-center justify-between">
      <h3 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
        Baixo estoque
      </h3>
      <span className="rounded-[4px] border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 font-mono text-xs font-black text-blue-300">
        {props.mobileFiltersDraft.lowStockThreshold} un.
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
      value={props.mobileFiltersDraft.lowStockThreshold}
      onChange={(event) =>
        props.onMobileFilterDraftChange({
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
);

const BatchesViewModeMobileFilter = ({
  props,
}: {
  props: BatchesViewProps;
}) => (
  <section className="space-y-3">
    <h3 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
      Visualização
    </h3>
    <div className="grid grid-cols-2 gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          props.onMobileFilterDraftChange({ isGroupedByProduct: false })
        }
        className={cn(
          "h-10 w-full rounded-[4px] border text-xs font-bold transition-colors",
          !props.mobileFiltersDraft.isGroupedByProduct
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
          props.onMobileFilterDraftChange({ isGroupedByProduct: true })
        }
        className={cn(
          "h-10 w-full rounded-[4px] border text-xs font-bold transition-colors",
          props.mobileFiltersDraft.isGroupedByProduct
            ? "border-blue-500/50 bg-blue-500/10 text-blue-100"
            : "border-neutral-800 bg-neutral-950/50 text-neutral-500 hover:border-neutral-700 hover:bg-neutral-900 hover:text-white",
        )}
      >
        <Package className="mr-2 size-3.5" />
        Agrupar
      </Button>
    </div>
  </section>
);

const BatchesSortMobileFilter = ({ props }: { props: BatchesViewProps }) => (
  <section className="space-y-3">
    <h3 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
      Ordenar por
    </h3>
    <Select
      value={`${props.mobileFiltersDraft.sortKey}:${props.mobileFiltersDraft.sortDirection}`}
      onValueChange={(value) => {
        const [sortKey, sortDirection] = value.split(":") as [
          SortConfig["key"],
          SortConfig["direction"],
        ];
        props.onMobileFilterDraftChange({ sortKey, sortDirection });
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
