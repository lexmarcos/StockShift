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
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  Layers,
  Calendar,
  Eye,
  MoreHorizontal,
  ChevronDown,
  ArrowUpDown,
  CalendarDays,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { PermissionGate } from "@/components/permission-gate";
import {
  StockMovementsViewProps,
  StockMovement,
  SortField,
  SortOrder,
  StockMovementType,
  DateFilterPreset,
} from "./stock-movements.types";
import {
  MANUAL_IN_MOVEMENT_TYPES,
  MANUAL_MOVEMENT_TYPE_LABELS,
  MANUAL_OUT_MOVEMENT_TYPES,
} from "./stock-movements.constants";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const getSortLabel = (sortBy: SortField, sortOrder: SortOrder) => {
  const option = SORT_OPTIONS.find(
    (item) => item.value === `${sortBy}-${sortOrder}`,
  );

  return option?.label ?? "Ordenação";
};

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

  if (isSelectPortal) {
    event.preventDefault();
  }
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
          className="cursor-pointer focus:bg-neutral-800 focus:text-white flex items-center w-full"
        >
          <Eye className="mr-2 size-3.5" /> Ver Detalhes
        </Link>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const CreateMovementDropdown = ({
  label,
  direction,
  types,
}: {
  label: string;
  direction: "IN" | "OUT";
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

export const StockMovementsView = ({
  movements,
  isLoading,
  filters,
  mobileFiltersDraft,
  isMobileFiltersOpen,
  pagination,
  onPageChange,
  onFilterChange,
  onSortChange,
  onDatePresetChange,
  onDateInputChange,
  onOpenMobileFilters,
  onCloseMobileFilters,
  onApplyMobileFilters,
  onClearMobileFilters,
  onMobileDatePresetChange,
  onMobileDateInputChange,
  onMobileFilterDraftChange,
}: StockMovementsViewProps) => {
  const getDirectionStatus = (direction: "IN" | "OUT") => {
    if (direction === "IN") {
      return {
        label: "ENTRADA",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        icon: <ArrowDownRight className="size-3.5 mr-1" />,
      };
    }
    return {
      label: "SAÍDA",
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      icon: <ArrowUpRight className="size-3.5 mr-1" />,
    };
  };





  const draft = mobileFiltersDraft;
  const mobileFiltersPanel = (
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
          <DrawerHeader className="px-5 pb-2 pt-5 text-left">
            <DrawerTitle className="text-xl font-bold tracking-tight text-white">
              Filtros
            </DrawerTitle>
            <DrawerDescription className="mt-1 text-[11px] text-neutral-500">
              Refine a listagem de movimentações
            </DrawerDescription>
          </DrawerHeader>

          <div className="overflow-y-auto px-5 pb-2 pt-2">
            <div className="space-y-6">
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
                        onClick={() =>
                          onMobileFilterDraftChange("type", option.value)
                        }
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

              <div>
                <span className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  Período
                </span>
                <Select
                  value={draft.datePreset}
                  onValueChange={(value) =>
                    onMobileDatePresetChange(value as DateFilterPreset)
                  }
                >
                  <SelectTrigger className="h-11 w-full rounded-[4px] border-neutral-800 bg-[#171717] text-xs font-semibold text-neutral-300 focus:border-blue-600 focus:ring-0 hover:border-neutral-700 transition-colors">
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
                    <label
                      htmlFor="stock-movements-mobile-date-from"
                      className="space-y-1.5"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                        Data inicial
                      </span>
                      <Input
                        id="stock-movements-mobile-date-from"
                        type="date"
                        value={draft.dateFrom ?? ""}
                        onChange={(event) =>
                          onMobileDateInputChange("dateFrom", event.target.value)
                        }
                        className="h-11 w-full rounded-[4px] border-neutral-800 bg-[#171717] text-xs font-semibold text-neutral-300 [color-scheme:dark] focus-visible:border-blue-600 focus-visible:ring-0 hover:border-neutral-700 transition-colors"
                      />
                    </label>
                    <label
                      htmlFor="stock-movements-mobile-date-to"
                      className="space-y-1.5"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                        Data final
                      </span>
                      <Input
                        id="stock-movements-mobile-date-to"
                        type="date"
                        value={draft.dateTo ?? ""}
                        onChange={(event) =>
                          onMobileDateInputChange("dateTo", event.target.value)
                        }
                        className="h-11 w-full rounded-[4px] border-neutral-800 bg-[#171717] text-xs font-semibold text-neutral-300 [color-scheme:dark] focus-visible:border-blue-600 focus-visible:ring-0 hover:border-neutral-700 transition-colors"
                      />
                    </label>
                  </div>
                ) : null}
              </div>

              <div>
                <span className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  Ordenar por
                </span>
                <Select
                  value={`${draft.sortBy}-${draft.sortOrder}`}
                  onValueChange={(value) => {
                    const [field, order] = value.split("-") as [
                      SortField,
                      SortOrder,
                    ];
                    onMobileFilterDraftChange("sortBy", field);
                    onMobileFilterDraftChange("sortOrder", order);
                  }}
                >
                  <SelectTrigger className="h-11 w-full rounded-[4px] border-neutral-800 bg-[#171717] text-xs font-semibold text-neutral-300 focus:border-blue-600 focus:ring-0 hover:border-neutral-700 transition-colors">
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
            </div>
          </div>

          <DrawerFooter className="flex-row gap-3 border-t border-neutral-800 px-5 pb-6 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClearMobileFilters}
              className="h-12 flex-1 rounded-[4px] border-neutral-800 bg-[#171717] text-xs font-bold uppercase tracking-widest text-neutral-400 hover:border-neutral-700 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
            >
              <Trash2 className="mr-2 size-3.5" />
              Limpar
            </Button>
            <Button
              type="button"
              onClick={onApplyMobileFilters}
              className="h-12 flex-[2] rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-widest text-white hover:bg-blue-700 transition-colors"
            >
              Aplicar filtros
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
  );

  const activeFilterCount = getActiveFilterCount(filters);

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 font-sans text-neutral-200">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-5">
            {/* Actions Bar */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tighter text-white">
                  Movimentações
                </h1>
                <p className="text-sm text-neutral-500 mt-1">
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

            <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max gap-2">
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

            {/* Desktop Filters */}
            <div className="hidden w-full gap-3 md:flex md:h-12 md:flex-row md:items-center">
              <div className="flex h-12 w-full items-center gap-2">
                <Select
                  value={filters.type || "ALL"}
                  onValueChange={(value) =>
                    onFilterChange("type", value as StockMovementType | "ALL")
                  }
                >
                  <SelectTrigger className="h-12 w-full md:w-[200px] rounded-[4px] border-neutral-800 bg-[#171717] text-[12px] font-bold uppercase tracking-widest text-neutral-400 focus:border-blue-600 focus:ring-0 hover:border-neutral-700 transition-colors">
                    <div className="flex items-center gap-2">
                      <Filter className="size-3.5 text-neutral-500" />
                      <SelectValue placeholder="Tipo" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
                    <SelectItem
                      value="ALL"
                      className="text-[12px] font-bold uppercase focus:bg-neutral-800"
                    >
                      Todos os Tipos
                    </SelectItem>
                    {Object.entries(MOVEMENT_TYPE_LABELS).map(
                      ([key, label]) => (
                        <SelectItem
                          key={key}
                          value={key}
                          className="text-[12px] font-bold uppercase focus:bg-neutral-800"
                        >
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.datePreset}
                  onValueChange={(value) =>
                    onDatePresetChange(value as DateFilterPreset)
                  }
                >
                  <SelectTrigger className="h-12 w-full rounded-[4px] border-neutral-800 bg-[#171717] text-[12px] font-bold uppercase tracking-widest text-neutral-400 transition-colors hover:border-neutral-700 focus:border-blue-600 focus:ring-0 md:w-[190px]">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="size-3.5 text-neutral-500" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
                    {Object.entries(DATE_PRESET_LABELS).map(
                      ([value, label]) => (
                        <SelectItem
                          key={value}
                          value={value}
                          className="text-[12px] font-bold uppercase focus:bg-neutral-800"
                        >
                          {label}
                        </SelectItem>
                      ),
                    )}
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
                  <SelectTrigger className="h-12 w-full md:w-[200px] rounded-[4px] border-neutral-800 bg-[#171717] text-[12px] font-bold uppercase tracking-widest text-neutral-400 focus:border-blue-600 focus:ring-0 hover:border-neutral-700 transition-colors">
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
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
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
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-48 text-center text-neutral-500"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="size-6 animate-spin rounded-full border-2 border-neutral-500 border-t-blue-500" />
                          <span className="text-[10px] uppercase font-bold tracking-widest">
                            Carregando movimentações…
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : movements.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-48 text-center text-neutral-500"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Layers className="size-8 text-neutral-700" />
                          <span className="text-[10px] uppercase font-bold tracking-widest">
                            Nenhuma movimentação encontrada
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    movements.map((movement) => {
                      const dirStatus = getDirectionStatus(movement.direction);
                      return (
                        <TableRow
                          key={movement.id}
                          className="border-b border-neutral-800 transition-colors hover:bg-neutral-800/50"
                        >
                          <TableCell className="py-4">
                            <span className="font-mono text-sm font-bold text-white">
                              {movement.code}
                            </span>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center text-sm text-neutral-400">
                              <Calendar className="mr-2 size-3.5" />
                              {format(
                                parseISO(movement.createdAt),
                                "dd/MM/yyyy HH:mm",
                                {
                                  locale: ptBR,
                                },
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="text-sm font-medium text-neutral-300">
                              {MOVEMENT_TYPE_LABELS[movement.type] ||
                                movement.type}
                            </span>
                          </TableCell>
                          <TableCell className="py-4">
                            <span
                              className={`inline-flex items-center rounded-[2px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${dirStatus.bg} ${dirStatus.color} ${dirStatus.border}`}
                            >
                              {dirStatus.icon}
                              {dirStatus.label}
                            </span>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="text-sm font-medium text-neutral-300">
                              {movement.items?.reduce(
                                (acc, item) => acc + item.quantity,
                                0,
                              ) || 0}{" "}
                              un. ({movement.items?.length || 0} prod.)
                            </span>
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <MovementActions movement={movement} />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-8 gap-2">
                <div className="size-6 animate-spin rounded-full border-2 border-neutral-500 border-t-blue-500" />
                <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">
                  Carregando…
                </span>
              </div>
            ) : movements.length === 0 ? (
              <div className="p-8 text-center bg-[#171717] rounded-[4px] border border-neutral-800">
                <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">
                  Nenhuma movimentação encontrada
                </span>
              </div>
            ) : (
              movements.map((movement) => {
                const dirStatus = getDirectionStatus(movement.direction);
                return (
                  <div
                    key={movement.id}
                    className="flex flex-col gap-3 rounded-[4px] border border-neutral-800 bg-[#171717] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-white">
                          {movement.code}
                        </span>
                      </div>
                      <MovementActions movement={movement} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                          Data
                        </span>
                        <span className="text-sm text-neutral-300 mt-0.5">
                          {format(parseISO(movement.createdAt), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                          Quantidade
                        </span>
                        <span className="text-sm text-neutral-300 mt-0.5">
                          {movement.items?.reduce(
                            (acc, item) => acc + item.quantity,
                            0,
                          ) || 0}{" "}
                          un.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-neutral-800">
                      <span className="text-xs font-medium text-neutral-400">
                        {MOVEMENT_TYPE_LABELS[movement.type] || movement.type}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-[2px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${dirStatus.bg} ${dirStatus.color} ${dirStatus.border}`}
                      >
                        {dirStatus.icon}
                        {dirStatus.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

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
      {mobileFiltersPanel}
    </div>
  );
};
