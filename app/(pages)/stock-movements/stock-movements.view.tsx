"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowDownRight,
  ArrowUpDown,
  ArrowUpRight,
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Eye,
  Filter,
  Layers,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { PermissionGate } from "@/components/permission-gate";
import { Button } from "@/components/ui/button";
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
import {
  MANUAL_IN_MOVEMENT_TYPES,
  MANUAL_MOVEMENT_TYPE_LABELS,
  MANUAL_OUT_MOVEMENT_TYPES,
} from "./stock-movements.constants";
import type {
  DateFilterPreset,
  SortField,
  SortOrder,
  StockMovement,
  StockMovementsViewProps,
  StockMovementType,
} from "./stock-movements.types";

type StockMovementsViewState = StockMovementsViewProps;

interface MovementTagStyle {
  bg: string;
  border: string;
  color: string;
  icon: ReactNode;
  label: string;
}

const MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  ...MANUAL_MOVEMENT_TYPE_LABELS,
  SALE: "Venda",
  TRANSFER_IN: "Transf. Entrada",
  TRANSFER_OUT: "Transf. Saída",
};

const DATE_PRESET_LABELS: Record<DateFilterPreset, string> = {
  ALL: "Todos períodos",
  TODAY: "Hoje",
  LAST_7_DAYS: "Últimos 7 dias",
  THIS_MONTH: "Este mês",
  CUSTOM: "Personalizado",
};

const SORT_OPTIONS: {
  value: `${SortField}-${SortOrder}`;
  label: string;
}[] = [
  { value: "createdAt-desc", label: "Mais recentes" },
  { value: "createdAt-asc", label: "Mais antigos" },
  { value: "type-asc", label: "Tipo A-Z" },
  { value: "direction-asc", label: "Direção In-Out" },
];

const TYPE_FILTER_OPTIONS: {
  value: StockMovementType | "ALL";
  label: string;
}[] = [
  { value: "ALL", label: "Todos" },
  ...Object.entries(MOVEMENT_TYPE_LABELS).map(([value, label]) => ({
    value: value as StockMovementType,
    label,
  })),
];

const getSortLabel = (sortBy: SortField, sortOrder: SortOrder) =>
  SORT_OPTIONS.find((item) => item.value === `${sortBy}-${sortOrder}`)
    ?.label ?? "Ordenação";

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

const getActiveFilterCount = (filters: StockMovementsViewProps["filters"]) => {
  const hasType = filters.type && filters.type !== "ALL";
  const hasDate = filters.datePreset !== "ALL";

  return Number(hasType) + Number(hasDate);
};

const preventDrawerDismissFromSelectPortal = (event: Event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) return;

  const isSelectPortal =
    target.closest('[data-slot="select-content"]') ||
    target.closest("[data-radix-popper-content-wrapper]");

  if (isSelectPortal) event.preventDefault();
};

const getMovementTag = (type: StockMovementType): MovementTagStyle => {
  const green = {
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: <ArrowDownRight className="mr-1 size-3.5" />,
  };
  const red = {
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    icon: <ArrowUpRight className="mr-1 size-3.5" />,
  };
  const tagMap: Record<StockMovementType, MovementTagStyle> = {
    PURCHASE_IN: { label: "COMPRA", ...green },
    ADJUSTMENT_IN: { label: "ENTRADA", ...green },
    TRANSFER_IN: { label: "TRANSF. IN", ...green },
    USAGE: { label: "USO", ...red },
    ADJUSTMENT_OUT: { label: "SAÍDA", ...red },
    SALE: { label: "VENDA", ...red },
    GIFT: { label: "PRESENTE", ...red },
    LOSS: { label: "PERDA", ...red },
    DAMAGE: { label: "DANO", ...red },
    TRANSFER_OUT: { label: "TRANSF. OUT", ...red },
  };

  return tagMap[type];
};

const MovementActions = ({ movement }: { movement: StockMovement }) => (
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
          href={`/stock-movements/${movement.id}`}
          className="flex w-full cursor-pointer items-center focus:bg-neutral-800 focus:text-white"
        >
          <Eye className="mr-2 size-3.5" /> Ver Detalhes
        </Link>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const CreateMovementDropdown = ({
  direction,
  label,
  types,
}: {
  direction: "IN" | "OUT";
  label: string;
  types: readonly (keyof typeof MANUAL_MOVEMENT_TYPE_LABELS)[];
}) => {
  const isIn = direction === "IN";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={`h-11 w-full justify-center rounded-[4px] text-xs font-bold uppercase tracking-wide text-white shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)] md:h-10 md:w-auto ${
            isIn
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-rose-600 hover:bg-rose-700"
          }`}
        >
          {isIn ? (
            <ArrowDownRight className="mr-2 size-4" />
          ) : (
            <ArrowUpRight className="mr-2 size-4" />
          )}
          {label}
          <ChevronDown className="ml-2 size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-200 shadow-xl"
      >
        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          Tipo de movimentação
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-neutral-800" />
        {types.map((type) => (
          <DropdownMenuItem key={type} asChild>
            <Link
              href={`/stock-movements/create?type=${type}`}
              className="flex w-full cursor-pointer items-center focus:bg-neutral-800 focus:text-white"
            >
              {isIn ? (
                <ArrowDownRight className="mr-2 size-3.5 text-emerald-500" />
              ) : (
                <ArrowUpRight className="mr-2 size-3.5 text-rose-500" />
              )}
              {MANUAL_MOVEMENT_TYPE_LABELS[type]}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const CreateMovementActions = () => (
  <PermissionGate permission="stock_movements:create">
    <CreateMovementDropdown
      label="Movimentação de Entrada"
      direction="IN"
      types={MANUAL_IN_MOVEMENT_TYPES}
    />
    <CreateMovementDropdown
      label="Movimentação de Saída"
      direction="OUT"
      types={MANUAL_OUT_MOVEMENT_TYPES}
    />
  </PermissionGate>
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

export const StockMovementsView = (props: StockMovementsViewProps) => {
  const viewState: StockMovementsViewState = props;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 font-sans text-neutral-200">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <div className="space-y-6">
          <StockMovementsHeader viewState={viewState} />
          <StockMovementsDesktopTable viewState={viewState} />
          <StockMovementsMobileCards viewState={viewState} />
          <StockMovementsPagination viewState={viewState} />
        </div>
      </main>
      <StockMovementsMobileFiltersDrawer viewState={viewState} />
    </div>
  );
};

function StockMovementsHeader({
  viewState,
}: {
  viewState: StockMovementsViewState;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tighter text-white">
            Movimentações
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Gerencie as entradas e saídas de estoque
          </p>
        </div>
        <div className="hidden flex-col gap-2 md:flex md:flex-row md:items-center">
          <CreateMovementActions />
        </div>
      </div>
      <div className="flex flex-col gap-2 md:hidden">
        <CreateMovementActions />
      </div>
      <StockMovementsMobileFilterTokens viewState={viewState} />
      <StockMovementsDesktopFilters viewState={viewState} />
    </div>
  );
}

function StockMovementsMobileFilterTokens({
  viewState,
}: {
  viewState: StockMovementsViewState;
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
            icon={<ArrowUpDown className="size-3.5" />}
            label={getSortLabel(filters.sortBy, filters.sortOrder)}
            onClick={onOpenMobileFilters}
          />
        </div>
      </div>
      <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-l from-[#0A0A0A] to-transparent" />
    </div>
  );
}

function StockMovementsDesktopFilters({
  viewState,
}: {
  viewState: StockMovementsViewState;
}) {
  const {
    filters,
    onDateInputChange,
    onDatePresetChange,
    onFilterChange,
    onSortChange,
  } = viewState;

  return (
    <div className="hidden w-full gap-3 md:flex md:h-12 md:flex-row md:items-center">
      <div className="flex h-12 w-full items-center gap-2">
        <MovementTypeFilter filters={filters} onFilterChange={onFilterChange} />
        <MovementDateFilter
          filters={filters}
          onDatePresetChange={onDatePresetChange}
        />
        {filters.datePreset === "CUSTOM" ? (
          <MovementCustomDateInputs
            filters={filters}
            onDateInputChange={onDateInputChange}
          />
        ) : null}
        <MovementSortFilter filters={filters} onSortChange={onSortChange} />
      </div>
    </div>
  );
}

function MovementTypeFilter({
  filters,
  onFilterChange,
}: {
  filters: StockMovementsViewProps["filters"];
  onFilterChange: StockMovementsViewProps["onFilterChange"];
}) {
  return (
    <Select
      value={filters.type || "ALL"}
      onValueChange={(value) =>
        onFilterChange("type", value as StockMovementType | "ALL")
      }
    >
      <SelectTrigger className="h-12 w-full rounded-[4px] border-neutral-800 bg-[#171717] text-[12px] font-bold uppercase tracking-widest text-neutral-400 transition-colors hover:border-neutral-700 focus:border-blue-600 focus:ring-0 md:w-[200px]">
        <div className="flex items-center gap-2">
          <Filter className="size-3.5 text-neutral-500" />
          <SelectValue placeholder="Tipo" />
        </div>
      </SelectTrigger>
      <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
        {TYPE_FILTER_OPTIONS.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="text-[12px] font-bold uppercase focus:bg-neutral-800"
          >
            {option.value === "ALL" ? "Todos os Tipos" : option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function MovementDateFilter({
  filters,
  onDatePresetChange,
}: {
  filters: StockMovementsViewProps["filters"];
  onDatePresetChange: (preset: DateFilterPreset) => void;
}) {
  return (
    <Select
      value={filters.datePreset}
      onValueChange={(value) => onDatePresetChange(value as DateFilterPreset)}
    >
      <SelectTrigger className="h-12 w-full rounded-[4px] border-neutral-800 bg-[#171717] text-[12px] font-bold uppercase tracking-widest text-neutral-400 transition-colors hover:border-neutral-700 focus:border-blue-600 focus:ring-0 md:w-[190px]">
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

function MovementCustomDateInputs({
  filters,
  onDateInputChange,
}: {
  filters: StockMovementsViewProps["filters"];
  onDateInputChange: StockMovementsViewProps["onDateInputChange"];
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

function MovementSortFilter({
  filters,
  onSortChange,
}: {
  filters: StockMovementsViewProps["filters"];
  onSortChange: (sortBy: SortField, sortOrder: SortOrder) => void;
}) {
  return (
    <Select
      value={`${filters.sortBy}-${filters.sortOrder}`}
      onValueChange={(value) => {
        const [field, order] = value.split("-") as [SortField, SortOrder];
        onSortChange(field, order);
      }}
    >
      <SelectTrigger className="h-12 w-full rounded-[4px] border-neutral-800 bg-[#171717] text-[12px] font-bold uppercase tracking-widest text-neutral-400 transition-colors hover:border-neutral-700 focus:border-blue-600 focus:ring-0 md:w-[200px]">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="size-3.5 text-neutral-500" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
        {SORT_OPTIONS.map((option) => (
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

function StockMovementsDesktopTable({
  viewState,
}: {
  viewState: StockMovementsViewState;
}) {
  return (
    <div className="hidden overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717] md:block">
      <div className="overflow-x-auto">
        <Table>
          <MovementTableHeader />
          <TableBody>
            <MovementTableBody viewState={viewState} />
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function MovementTableHeader() {
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
          Tipo
        </TableHead>
        <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          Direção
        </TableHead>
        <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          Itens
        </TableHead>
        <TableHead className="py-4 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          Ações
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}

function MovementTableBody({
  viewState,
}: {
  viewState: StockMovementsViewState;
}) {
  if (viewState.isLoading) {
    return <MovementTableMessage message="Carregando movimentações…" isLoading />;
  }

  if (viewState.movements.length === 0) {
    return <MovementTableMessage message="Nenhuma movimentação encontrada" />;
  }

  return viewState.movements.map((movement) => (
    <MovementTableRow key={movement.id} movement={movement} />
  ));
}

function MovementTableMessage({
  isLoading,
  message,
}: {
  isLoading?: boolean;
  message: string;
}) {
  return (
    <TableRow>
      <TableCell colSpan={6} className="h-48 text-center text-neutral-500">
        <div className="flex flex-col items-center justify-center gap-2">
          {isLoading ? (
            <div className="size-6 animate-spin rounded-full border-2 border-neutral-500 border-t-blue-500" />
          ) : (
            <Layers className="size-8 text-neutral-700" />
          )}
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {message}
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
}

function MovementTableRow({ movement }: { movement: StockMovement }) {
  const tag = getMovementTag(movement.type);

  return (
    <TableRow className="border-b border-neutral-800 transition-colors hover:bg-neutral-800/50">
      <TableCell className="py-4">
        <span className="font-mono text-sm font-bold text-white">
          {movement.code}
        </span>
      </TableCell>
      <TableCell className="py-4">
        <div className="flex items-center text-sm text-neutral-400">
          <Calendar className="mr-2 size-3.5" />
          {format(parseISO(movement.createdAt), "dd/MM/yyyy HH:mm", {
            locale: ptBR,
          })}
        </div>
      </TableCell>
      <TableCell className="py-4">
        <span className="text-sm font-medium text-neutral-300">
          {MOVEMENT_TYPE_LABELS[movement.type] || movement.type}
        </span>
      </TableCell>
      <TableCell className="py-4">
        <MovementTag tag={tag} />
      </TableCell>
      <TableCell className="py-4">
        <span className="text-sm font-medium text-neutral-300">
          {getMovementItemQuantity(movement)} un. (
          {movement.items?.length || 0} prod.)
        </span>
      </TableCell>
      <TableCell className="py-4 text-right">
        <MovementActions movement={movement} />
      </TableCell>
    </TableRow>
  );
}

function getMovementItemQuantity(movement: StockMovement) {
  return movement.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
}

function MovementTag({ tag }: { tag: MovementTagStyle }) {
  return (
    <span
      className={`inline-flex items-center rounded-[2px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${tag.bg} ${tag.color} ${tag.border}`}
    >
      {tag.icon}
      {tag.label}
    </span>
  );
}

function StockMovementsMobileCards({
  viewState,
}: {
  viewState: StockMovementsViewState;
}) {
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

  if (viewState.movements.length === 0) {
    return (
      <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-8 text-center md:hidden">
        <span className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase">
          Nenhuma movimentação encontrada
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:hidden">
      {viewState.movements.map((movement) => (
        <MovementMobileCard key={movement.id} movement={movement} />
      ))}
    </div>
  );
}

function MovementMobileCard({ movement }: { movement: StockMovement }) {
  const tag = getMovementTag(movement.type);

  return (
    <Link
      href={`/stock-movements/${movement.id}`}
      className="flex flex-col gap-4 rounded-[4px] border border-neutral-800 bg-[#171717] p-4 transition-colors hover:bg-neutral-800/50"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-base font-bold text-white">
          {movement.code}
        </span>
        <ChevronRight className="size-4 text-neutral-500" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm text-neutral-400">
          <span>
            {format(parseISO(movement.createdAt), "dd/MM/yyyy", {
              locale: ptBR,
            })}
          </span>
          <span className="text-neutral-600">&bull;</span>
          <span>{getMovementItemQuantity(movement)} un.</span>
        </div>
        <MovementTag tag={tag} />
      </div>
    </Link>
  );
}

function StockMovementsPagination({
  viewState,
}: {
  viewState: StockMovementsViewState;
}) {
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

function StockMovementsMobileFiltersDrawer({
  viewState,
}: {
  viewState: StockMovementsViewState;
}) {
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
        <DrawerHeader className="px-5 pt-5 pb-2 text-left">
          <DrawerTitle className="text-xl font-bold tracking-tight text-white">
            Filtros
          </DrawerTitle>
          <DrawerDescription className="mt-1 text-[11px] text-neutral-500">
            Refine a listagem de movimentações
          </DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-5 pt-2 pb-2">
          <div className="space-y-6">
            <MobileMovementTypeFilter viewState={viewState} />
            <MobileMovementDateFilter viewState={viewState} />
            <MobileMovementSortFilter viewState={viewState} />
          </div>
        </div>
        <DrawerFooter className="flex-row gap-3 border-t border-neutral-800 px-5 pt-4 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={viewState.onClearMobileFilters}
            className="h-12 flex-1 rounded-[4px] border-neutral-800 bg-[#171717] text-xs font-bold tracking-widest text-neutral-400 uppercase transition-colors hover:border-neutral-700 hover:bg-neutral-800 hover:text-rose-400"
          >
            <Trash2 className="mr-2 size-3.5" />
            Limpar
          </Button>
          <Button
            type="button"
            onClick={viewState.onApplyMobileFilters}
            className="h-12 flex-[2] rounded-[4px] bg-blue-600 text-xs font-bold tracking-widest text-white uppercase transition-colors hover:bg-blue-700"
          >
            Aplicar filtros
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function MobileMovementTypeFilter({
  viewState,
}: {
  viewState: StockMovementsViewState;
}) {
  const draft = viewState.mobileFiltersDraft;

  return (
    <div>
      <span className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">
        Tipo de movimentação
      </span>
      <div className="grid grid-cols-3 gap-2">
        {TYPE_FILTER_OPTIONS.map((option) => {
          const isSelected = draft.type === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => viewState.onMobileFilterDraftChange("type", option.value)}
              className={`flex h-10 w-full items-center justify-center rounded-[4px] border text-xs font-semibold transition-colors ${
                isSelected
                  ? "border-blue-600 bg-blue-600/15 text-blue-400"
                  : "border-neutral-800 bg-[#171717] text-neutral-400 hover:border-neutral-700 hover:text-neutral-300"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MobileMovementDateFilter({
  viewState,
}: {
  viewState: StockMovementsViewState;
}) {
  const draft = viewState.mobileFiltersDraft;

  return (
    <div>
      <span className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">
        Período
      </span>
      <Select
        value={draft.datePreset}
        onValueChange={(value) =>
          viewState.onMobileDatePresetChange(value as DateFilterPreset)
        }
      >
        <SelectTrigger className="h-11 w-full rounded-[4px] border-neutral-800 bg-[#171717] text-xs font-semibold text-neutral-300 transition-colors hover:border-neutral-700 focus:border-blue-600 focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
          {Object.entries(DATE_PRESET_LABELS).map(([value, label]) => (
            <SelectItem
              key={value}
              value={value}
              className="text-xs font-semibold focus:bg-neutral-800 focus:text-white"
            >
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {draft.datePreset === "CUSTOM" ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <MobileMovementDateInput
            id="stock-movements-mobile-date-from"
            label="Data inicial"
            value={draft.dateFrom ?? ""}
            onChange={(value) =>
              viewState.onMobileDateInputChange("dateFrom", value)
            }
          />
          <MobileMovementDateInput
            id="stock-movements-mobile-date-to"
            label="Data final"
            value={draft.dateTo ?? ""}
            onChange={(value) =>
              viewState.onMobileDateInputChange("dateTo", value)
            }
          />
        </div>
      ) : null}
    </div>
  );
}

function MobileMovementDateInput({
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
      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
        {label}
      </span>
      <Input
        id={id}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-[4px] border-neutral-800 bg-[#171717] text-xs font-semibold text-neutral-300 transition-colors [color-scheme:dark] hover:border-neutral-700 focus-visible:border-blue-600 focus-visible:ring-0"
      />
    </label>
  );
}

function MobileMovementSortFilter({
  viewState,
}: {
  viewState: StockMovementsViewState;
}) {
  const draft = viewState.mobileFiltersDraft;

  return (
    <div>
      <span className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">
        Ordenar por
      </span>
      <Select
        value={`${draft.sortBy}-${draft.sortOrder}`}
        onValueChange={(value) => {
          const [field, order] = value.split("-") as [SortField, SortOrder];
          viewState.onMobileFilterDraftChange("sortBy", field);
          viewState.onMobileFilterDraftChange("sortOrder", order);
        }}
      >
        <SelectTrigger className="h-11 w-full rounded-[4px] border-neutral-800 bg-[#171717] text-xs font-semibold text-neutral-300 transition-colors hover:border-neutral-700 focus:border-blue-600 focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
          {SORT_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="text-xs font-semibold focus:bg-neutral-800 focus:text-white"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
