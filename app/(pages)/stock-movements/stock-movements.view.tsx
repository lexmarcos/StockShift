"use client";

import Link from "next/link";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRightLeft,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  Loader2,
  AlertTriangle,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  Scale,
  Calendar,
  Clock,
  Eye
} from "lucide-react";
import type { StockMovement, MovementFilters, SortConfig, MovementType, MovementStatus } from "./stock-movements.types";
import { cn } from "@/lib/utils";

interface StockMovementsViewProps {
  movements: StockMovement[];
  isLoading: boolean;
  error: Error | null;
  filters: MovementFilters;
  sortConfig: SortConfig;
  setSearchQuery: (value: string) => void;
  setStatus: (value: MovementFilters["status"]) => void;
  setMovementType: (value: MovementFilters["movementType"]) => void;
  setWarehouseId: (value: string) => void;
  setSortConfig: (value: SortConfig) => void;
}

export const StockMovementsView = ({
  movements,
  isLoading,
  error,
  filters,
  sortConfig,
  setSearchQuery,
  setStatus,
  setMovementType,
  setWarehouseId,
  setSortConfig,
}: StockMovementsViewProps) => {

  // Calculate Client-Side Stats
  const stats = {
    total: movements.length,
    entries: movements.filter(m => m.movementType === "ENTRY").length,
    exits: movements.filter(m => m.movementType === "EXIT").length,
    pending: movements.filter(m => m.status === "PENDING").length
  };

  const getMovementStyle = (type: MovementType) => {
    switch (type) {
      case "ENTRY":
        return {
          label: "ENTRADA",
          icon: ArrowDownToLine,
          color: "text-emerald-500",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/20",
          indicator: "bg-emerald-500"
        };
      case "EXIT":
        return {
          label: "SAÍDA",
          icon: ArrowUpFromLine,
          color: "text-rose-500",
          bg: "bg-rose-500/10",
          border: "border-rose-500/20",
          indicator: "bg-rose-500"
        };
      case "TRANSFER":
        return {
          label: "TRANSF.",
          icon: RefreshCw,
          color: "text-blue-500",
          bg: "bg-blue-500/10",
          border: "border-blue-500/20",
          indicator: "bg-blue-500"
        };
      case "ADJUSTMENT":
        return {
          label: "AJUSTE",
          icon: Scale,
          color: "text-amber-500",
          bg: "bg-amber-500/10",
          border: "border-amber-500/20",
          indicator: "bg-amber-500"
        };
      default:
        return {
          label: type,
          icon: ArrowRightLeft,
          color: "text-neutral-500",
          bg: "bg-neutral-500/10",
          border: "border-neutral-500/20",
          indicator: "bg-neutral-500"
        };
    }
  };

  const getStatusStyle = (status: MovementStatus) => {
    switch (status) {
      case "COMPLETED":
        return { label: "CONCLUÍDO", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
      case "PENDING":
        return { label: "PENDENTE", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" };
      case "CANCELLED":
        return { label: "CANCELADO", color: "text-neutral-500", bg: "bg-neutral-500/10", border: "border-neutral-500/20" };
      default:
        return { label: status, color: "text-neutral-500", bg: "bg-neutral-500/10", border: "border-neutral-500/20" };
    }
  };

  const handleSort = (key: SortConfig["key"]) => {
    const newDirection = sortConfig.key === key && sortConfig.direction === "desc" ? "asc" : "desc";
    setSortConfig({ key, direction: newDirection });
  };

  const SortIcon = ({ colKey }: { colKey: SortConfig["key"] }) => {
    if (sortConfig.key !== colKey) return <div className="w-3 h-3 opacity-0" />;
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 text-blue-500" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-blue-500" />
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 font-sans text-neutral-200">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-5">
            {/* Actions Bar */}
            <div className="flex items-center justify-end">
              <Link href="/stock-movements/create">
                <Button className="h-10 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)]">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Movimentação
                </Button>
              </Link>
            </div>

            {/* Row 1: Insight Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total */}
              <div className="flex flex-col justify-center rounded-[4px] border border-neutral-800 bg-[#171717] px-5 py-4 transition-colors hover:border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-[2px] bg-blue-600/10 border border-blue-600/20">
                    <ArrowRightLeft className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Total</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tighter text-white">{stats.total}</span>
                  <span className="text-[10px] font-medium uppercase text-neutral-600">registros</span>
                </div>
              </div>

              {/* Entries */}
              <div className="flex flex-col justify-center rounded-[4px] border border-neutral-800 bg-[#171717] px-5 py-4 transition-colors hover:border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-[2px] bg-emerald-500/10 border border-emerald-500/20">
                    <ArrowDownToLine className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Entradas</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tighter text-white">{stats.entries}</span>
                  <span className="text-[10px] font-medium uppercase text-neutral-600">movimentos</span>
                </div>
              </div>

              {/* Exits */}
              <div className="flex flex-col justify-center rounded-[4px] border border-neutral-800 bg-[#171717] px-5 py-4 transition-colors hover:border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-[2px] bg-rose-500/10 border border-rose-500/20">
                    <ArrowUpFromLine className="h-3.5 w-3.5 text-rose-500" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Saídas</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tighter text-white">{stats.exits}</span>
                  <span className="text-[10px] font-medium uppercase text-neutral-600">movimentos</span>
                </div>
              </div>

              {/* Pending */}
              <div className="flex flex-col justify-center rounded-[4px] border border-neutral-800 bg-[#171717] px-5 py-4 transition-colors hover:border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-[2px] bg-amber-500/10 border border-amber-500/20">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Pendentes</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tighter text-white">{stats.pending}</span>
                  <span className="text-[10px] font-medium uppercase text-neutral-600">ações</span>
                </div>
              </div>
            </div>

            {/* Row 2: Search & Filters */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:h-12 w-full">
              <div className="relative h-12 flex-1 min-w-[200px] flex items-center">
                <div className="text-neutral-500 absolute left-3">
                  <Search className="h-3.5 w-3.5" />
                </div>
                <Input
                  placeholder="Buscar por nota, produto ou lote..."
                  value={filters.searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-[4px] border-neutral-800 bg-[#171717] pl-10 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-blue-600 focus:ring-0 transition-all hover:border-neutral-700"
                />
              </div>

              <div className="flex flex-col md:flex-row items-center gap-2 h-auto md:h-12">
                <Select
                  value={filters.movementType}
                  onValueChange={(value) => setMovementType(value as MovementFilters["movementType"])}
                >
                  <SelectTrigger className="h-12 w-full md:w-[150px] rounded-[4px] border-neutral-800 bg-[#171717] text-[10px] font-bold uppercase tracking-widest text-neutral-400 focus:border-blue-600 focus:ring-0 hover:border-neutral-700 transition-colors">
                    <div className="flex items-center gap-2">
                      <Filter className="h-3.5 w-3.5 text-neutral-500" />
                      <SelectValue placeholder="TIPO" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
                    <SelectItem value="all" className="text-[9px] font-bold uppercase focus:bg-neutral-800">Todos</SelectItem>
                    <SelectItem value="ENTRY" className="text-[9px] font-bold uppercase focus:bg-neutral-800">Entrada</SelectItem>
                    <SelectItem value="EXIT" className="text-[9px] font-bold uppercase focus:bg-neutral-800">Saída</SelectItem>
                    <SelectItem value="TRANSFER" className="text-[9px] font-bold uppercase focus:bg-neutral-800">Transf.</SelectItem>
                    <SelectItem value="ADJUSTMENT" className="text-[9px] font-bold uppercase focus:bg-neutral-800">Ajuste</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.status}
                  onValueChange={(value) => setStatus(value as MovementFilters["status"])}
                >
                  <SelectTrigger className="h-12 w-full md:w-[150px] rounded-[4px] border-neutral-800 bg-[#171717] text-[10px] font-bold uppercase tracking-widest text-neutral-400 focus:border-blue-600 focus:ring-0 hover:border-neutral-700 transition-colors">
                    <SelectValue placeholder="STATUS" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
                    <SelectItem value="all" className="text-[9px] font-bold uppercase focus:bg-neutral-800">Todos</SelectItem>
                    <SelectItem value="PENDING" className="text-[9px] font-bold uppercase focus:bg-neutral-800">Pendente</SelectItem>
                    <SelectItem value="COMPLETED" className="text-[9px] font-bold uppercase focus:bg-neutral-800">Concluído</SelectItem>
                    <SelectItem value="CANCELLED" className="text-[9px] font-bold uppercase focus:bg-neutral-800">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Data Display */}
          <div className="min-h-[400px]">
            {/* Loading */}
            {isLoading && (
              <div className="flex h-64 w-full flex-col items-center justify-center gap-4 rounded-[4px] border border-neutral-800 bg-[#171717]/50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="text-xs uppercase tracking-wide text-neutral-500">Carregando movimentações...</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex h-64 w-full flex-col items-center justify-center gap-4 rounded-[4px] border border-rose-900/30 bg-rose-950/10">
                <AlertTriangle className="h-8 w-8 text-rose-500" />
                <div className="text-center">
                  <h3 className="text-sm font-bold uppercase text-rose-500">Falha na conexão</h3>
                  <p className="text-xs text-rose-500/70">Não foi possível carregar as movimentações</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && movements.length === 0 && (
              <div className="flex h-96 w-full flex-col items-center justify-center gap-6 rounded-[4px] border border-dashed border-neutral-800 bg-[#171717]/30">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900 ring-1 ring-neutral-800">
                  <ArrowRightLeft className="h-8 w-8 text-neutral-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-300">
                    {filters.searchQuery ? "Nenhum resultado encontrado" : "Nenhuma movimentação"}
                  </h3>
                  <p className="mt-1 max-w-xs text-xs text-neutral-500">
                    {filters.searchQuery 
                      ? "Tente ajustar seus termos de busca ou filtros." 
                      : "O histórico de movimentações está vazio."}
                  </p>
                </div>
                {filters.searchQuery ? (
                  <Button
                    variant="outline"
                    onClick={() => setSearchQuery("")}
                    className="rounded-[4px] border-neutral-700 text-xs uppercase text-neutral-300 hover:bg-neutral-800"
                  >
                    Limpar Filtros
                  </Button>
                ) : (
                  <Link href="/stock-movements/create">
                    <Button className="rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700">
                      <Plus className="mr-2 h-3.5 w-3.5" />
                      Nova Movimentação
                    </Button>
                  </Link>
                )}
              </div>
            )}

            {/* Table View (Desktop) */}
            {!isLoading && !error && movements.length > 0 && (
              <>
                <div className="hidden overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717] md:block">
                  <Table>
                    <TableHeader className="bg-neutral-900">
                      <TableRow className="border-b border-neutral-800 hover:bg-neutral-900">
                        <TableHead
                          className="h-10 cursor-pointer text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white"
                          onClick={() => handleSort("createdAt")}
                        >
                          <div className="flex items-center gap-1">Data <SortIcon colKey="createdAt" /></div>
                        </TableHead>
                        <TableHead
                          className="h-10 cursor-pointer text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white"
                          onClick={() => handleSort("movementType")}
                        >
                          <div className="flex items-center gap-1">Tipo <SortIcon colKey="movementType" /></div>
                        </TableHead>
                        <TableHead
                          className="h-10 cursor-pointer text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white"
                          onClick={() => handleSort("status")}
                        >
                          <div className="flex items-center gap-1">Status <SortIcon colKey="status" /></div>
                        </TableHead>
                        <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                          Detalhes
                        </TableHead>
                        <TableHead className="h-10 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                          Ações
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.map((movement) => {
                        const style = getMovementStyle(movement.movementType);
                        const statusStyle = getStatusStyle(movement.status);
                        
                        return (
                          <TableRow
                            key={movement.id}
                            className="group border-b border-neutral-800/50 hover:bg-neutral-800/50 transition-colors"
                          >
                            <TableCell className="py-3">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-neutral-600" />
                                <span className="font-mono text-xs text-neutral-300">
                                  {new Date(movement.createdAt).toLocaleDateString("pt-BR")}
                                </span>
                                <span className="text-[10px] text-neutral-600">
                                  {new Date(movement.createdAt).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "rounded-[2px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider gap-1.5",
                                  style.bg,
                                  style.color,
                                  style.border
                                )}
                              >
                                <style.icon className="h-3 w-3" />
                                {style.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3">
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "rounded-[2px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                  statusStyle.bg,
                                  statusStyle.color,
                                  statusStyle.border
                                )}
                              >
                                {statusStyle.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="flex flex-col gap-0.5 max-w-[200px]">
                                <span className="text-xs text-neutral-300 truncate">
                                  {movement.notes || "—"}
                                </span>
                                <span className="text-[10px] text-neutral-600">
                                  Por: {movement.createdByName || "Sistema"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                <Link href={`/stock-movements/${movement.id}`}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-[4px] hover:bg-neutral-800 text-neutral-400 hover:text-white"
                                  >
                                    <Eye className="h-4 w-4" />
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

                {/* Mobile Grid */}
                <div className="grid gap-3 md:hidden">
                  {movements.map((movement) => {
                    const style = getMovementStyle(movement.movementType);
                    const statusStyle = getStatusStyle(movement.status);

                    return (
                      <div
                        key={movement.id}
                        className={cn(
                          "flex flex-col gap-3 rounded-[4px] border border-neutral-800 bg-[#171717] p-4",
                          "border-l-4",
                          style.indicator.replace("bg-", "border-")
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "rounded-[2px] border px-1.5 py-0.5 text-[9px] font-bold uppercase",
                                  style.bg,
                                  style.color,
                                  style.border
                                )}
                              >
                                {style.label}
                              </Badge>
                              <span className="text-xs font-mono text-neutral-500">
                                {new Date(movement.createdAt).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                            {movement.notes && (
                              <p className="text-sm font-medium text-white line-clamp-1">{movement.notes}</p>
                            )}
                          </div>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "rounded-[2px] border px-1.5 py-0.5 text-[9px] font-bold uppercase",
                              statusStyle.bg,
                              statusStyle.color,
                              statusStyle.border
                            )}
                          >
                            {statusStyle.label}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
                          <Link href={`/stock-movements/${movement.id}`} className="flex-1">
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
              </>
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Buttons - Mobile */}
      <Link href="/stock-movements/create">
        <Button
          className="fixed bottom-6 right-4 h-12 w-12 rounded-[4px] bg-blue-600 text-white shadow-lg hover:bg-blue-700 md:hidden"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  );
};
