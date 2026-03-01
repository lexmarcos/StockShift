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
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  Layers,
  Calendar,
  Eye,
  Plus,
  ArrowDown,
  ArrowUp,
  Warehouse,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { PermissionGate } from "@/components/permission-gate";
import {
  StockMovementsViewProps,
  StockMovement,
  SortField,
  SortOrder,
  StockMovementType,
} from "./stock-movements.types";
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

const MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  USAGE: "Uso",
  GIFT: "Presente",
  LOSS: "Perda",
  DAMAGE: "Dano",
  ADJUSTMENT_OUT: "Ajuste Saída",
  PURCHASE_IN: "Compra",
  ADJUSTMENT_IN: "Ajuste Entrada",
  TRANSFER_IN: "Transf. Entrada",
  TRANSFER_OUT: "Transf. Saída",
};

export const StockMovementsView = ({
  movements,
  isLoading,
  error,
  filters,
  pagination,
  onPageChange,
  onPageSizeChange,
  onFilterChange,
  onSortChange,
}: StockMovementsViewProps) => {
  const getDirectionStatus = (direction: "IN" | "OUT") => {
    if (direction === "IN") {
      return {
        label: "ENTRADA",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        icon: <ArrowDownRight className="w-3.5 h-3.5 mr-1" />,
      };
    }
    return {
      label: "SAÍDA",
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      icon: <ArrowUpRight className="w-3.5 h-3.5 mr-1" />,
    };
  };

  const MovementActions = ({ movement }: { movement: StockMovement }) => (
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
            href={`/stock-movements/${movement.id}`}
            className="cursor-pointer focus:bg-neutral-800 focus:text-white flex items-center w-full"
          >
            <Eye className="mr-2 h-3.5 w-3.5" /> Ver Detalhes
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 font-sans text-neutral-200">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-5">
            {/* Actions Bar */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tighter text-white">
                  Movimentações
                </h1>
                <p className="text-sm text-neutral-500 mt-1">
                  Gerencie as entradas e saídas de estoque
                </p>
              </div>
              <div className="flex items-center gap-3">
                <PermissionGate permission="stock_movements:create">
                  <Link href="/stock-movements/create">
                    <Button className="h-10 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)]">
                      <Plus className="mr-2 h-4 w-4" />
                      Nova Movimentação
                    </Button>
                  </Link>
                </PermissionGate>
              </div>
            </div>

            {/* Row 2: Search & Filters */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:h-12 w-full">
              <div className="flex flex-col md:flex-row items-center gap-2 h-auto md:h-12 w-full md:w-auto">
                <Select
                  value={filters.type || "ALL"}
                  onValueChange={(value) => onFilterChange("type", value)}
                >
                  <SelectTrigger className="h-12 w-full md:w-[200px] rounded-[4px] border-neutral-800 bg-[#171717] text-[12px] font-bold uppercase tracking-widest text-neutral-400 focus:border-blue-600 focus:ring-0 hover:border-neutral-700 transition-colors">
                    <div className="flex items-center gap-2">
                      <Filter className="h-3.5 w-3.5 text-neutral-500" />
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
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onValueChange={(value) => {
                    const [field, order] = value.split("-") as [
                      SortField,
                      SortOrder,
                    ];
                    onSortChange(field, order);
                  }}
                >
                  <SelectTrigger className="h-12 w-full md:w-[150px] rounded-[4px] border-neutral-800 bg-[#171717] text-[12px] font-bold uppercase tracking-widest text-neutral-400 focus:border-blue-600 focus:ring-0 hover:border-neutral-700 transition-colors">
                    <div className="flex items-center gap-2">
                      <Filter className="h-3.5 w-3.5 text-neutral-500" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
                    <SelectItem
                      value="createdAt-desc"
                      className="text-[12px] font-bold uppercase focus:bg-neutral-800"
                    >
                      Data (Mais Novo)
                    </SelectItem>
                    <SelectItem
                      value="createdAt-asc"
                      className="text-[12px] font-bold uppercase focus:bg-neutral-800"
                    >
                      Data (Mais Antigo)
                    </SelectItem>
                    <SelectItem
                      value="type-asc"
                      className="text-[12px] font-bold uppercase focus:bg-neutral-800"
                    >
                      Tipo (A-Z)
                    </SelectItem>
                    <SelectItem
                      value="direction-asc"
                      className="text-[12px] font-bold uppercase focus:bg-neutral-800"
                    >
                      Direção (In-Out)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block rounded-[4px] border-l-4 border-l-blue-600 border border-neutral-800 bg-[#171717] overflow-hidden">
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
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-500 border-t-blue-500" />
                          <span className="text-[10px] uppercase font-bold tracking-widest">
                            Carregando movimentações...
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
                          <Layers className="h-8 w-8 text-neutral-700" />
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
                              <Calendar className="mr-2 h-3.5 w-3.5" />
                              {format(
                                new Date(movement.createdAt),
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
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-500 border-t-blue-500" />
                <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">
                  Carregando...
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
                    className="flex flex-col gap-3 rounded-[4px] border-l-4 border-l-neutral-700 border-y border-r border-y-neutral-800 border-r-neutral-800 bg-[#171717] p-4"
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
                          {format(new Date(movement.createdAt), "dd/MM/yyyy", {
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
    </div>
  );
};
