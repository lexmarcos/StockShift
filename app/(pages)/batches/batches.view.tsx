"use client";

import Link from "next/link";
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
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Layers,
  Loader2,
  Package,
  Plus,
  Search,
  XCircle,
  ArrowUp,
  ArrowDown,
  Warehouse
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Batch, BatchFilters, SortConfig } from "./batches.types";
import { deriveBatchStatus } from "./batches.model";
import type { Warehouse as WarehouseType } from "../warehouses/warehouses.types";
import { cn } from "@/lib/utils";

interface BatchesViewProps {
  batches: Batch[];
  isLoading: boolean;
  error: any;
  filters: BatchFilters;
  sortConfig: SortConfig;
  warehouses: WarehouseType[];
  statusCounts: { expired: number; expiring: number; low: number };
  setSearchQuery: (value: string) => void;
  setWarehouseId: (value: string) => void;
  setStatus: (value: BatchFilters["status"]) => void;
  setSortConfig: (value: SortConfig) => void;
  onClearFilters: () => void;
}

const getStatusStyle = (kind: string) => {
  switch (kind) {
    case "expired":
      return {
        label: "EXPIRADO",
        color: "text-rose-500",
        bg: "bg-rose-500/10",
        border: "border-rose-500/20",
        indicator: "bg-rose-500"
      };
    case "expiring":
      return {
        label: "EXPIRANDO",
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        indicator: "bg-amber-500"
      };
    case "low":
      return {
        label: "BAIXO ESTOQUE",
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        indicator: "bg-blue-500"
      };
    default:
      return {
        label: "REGULAR",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        indicator: "bg-emerald-500"
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

export const BatchesView = ({
  batches,
  isLoading,
  error,
  filters,
  sortConfig,
  warehouses,
  statusCounts,
  setSearchQuery,
  setWarehouseId,
  setStatus,
  setSortConfig,
  onClearFilters,
}: BatchesViewProps) => {
  
  const handleSort = (key: SortConfig["key"]) => {
    if (sortConfig.key === key) {
      setSortConfig({
        key,
        direction: sortConfig.direction === "asc" ? "desc" : "asc",
      });
      return;
    }
    setSortConfig({ key, direction: "asc" });
  };

  const SortIcon = ({ field }: { field: SortConfig["key"] }) => {
    if (sortConfig.key !== field) return <div className="w-3 h-3 opacity-0" />;
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
              <Link href="/batches/create">
                <Button className="h-10 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)]">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Lote
                </Button>
              </Link>
            </div>

            {/* Row 1: Insight Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Batches */}
              <div className="flex flex-col justify-center rounded-[4px] border border-neutral-800 bg-[#171717] px-5 py-4 transition-colors hover:border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-[2px] bg-neutral-800 border border-neutral-700">
                    <Layers className="h-3.5 w-3.5 text-neutral-400" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Total de Lotes</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tighter text-white">{batches.length}</span>
                  <span className="text-[10px] font-medium uppercase text-neutral-600">ativos</span>
                </div>
              </div>

              {/* Expired */}
              <div className="flex flex-col justify-center rounded-[4px] border border-neutral-800 bg-[#171717] px-5 py-4 transition-colors hover:border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-[2px] bg-rose-500/10 border border-rose-500/20">
                    <XCircle className="h-3.5 w-3.5 text-rose-500" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Expirados</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tighter text-white">{statusCounts.expired}</span>
                  <span className="text-[10px] font-medium uppercase text-neutral-600">lotes</span>
                </div>
              </div>

              {/* Expiring */}
              <div className="flex flex-col justify-center rounded-[4px] border border-neutral-800 bg-[#171717] px-5 py-4 transition-colors hover:border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-[2px] bg-amber-500/10 border border-amber-500/20">
                    <Calendar className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Expirando (30d)</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tighter text-white">{statusCounts.expiring}</span>
                  <span className="text-[10px] font-medium uppercase text-neutral-600">alertas</span>
                </div>
              </div>

              {/* Low Stock */}
              <div className="flex flex-col justify-center rounded-[4px] border border-neutral-800 bg-[#171717] px-5 py-4 transition-colors hover:border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-[2px] bg-blue-500/10 border border-blue-500/20">
                    <Package className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Baixo Estoque</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tighter text-white">{statusCounts.low}</span>
                  <span className="text-[10px] font-medium uppercase text-neutral-600">lotes</span>
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
                  placeholder="Buscar por produto, SKU ou lote..."
                  value={filters.searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-[4px] border-neutral-800 bg-[#171717] pl-10 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-blue-600 focus:ring-0 transition-all hover:border-neutral-700"
                />
              </div>

              <div className="flex flex-col md:flex-row items-center gap-2 h-auto md:h-12">
                <Select
                  value={filters.warehouseId || "all"}
                  onValueChange={(value) => setWarehouseId(value === "all" ? "" : value)}
                >
                  <SelectTrigger className="h-12 w-full md:w-[200px] rounded-[4px] border-neutral-800 bg-[#171717] text-[10px] font-bold uppercase tracking-widest text-neutral-400 focus:border-blue-600 focus:ring-0 hover:border-neutral-700 transition-colors">
                    <div className="flex items-center gap-2 truncate">
                      <Warehouse className="h-3.5 w-3.5 text-neutral-500" />
                      <span className="truncate">{warehouses.find(w => w.id === filters.warehouseId)?.name || "Todos Armazéns"}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
                    <SelectItem value="all" className="text-[9px] font-bold uppercase focus:bg-neutral-800">Todos Armazéns</SelectItem>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id} className="text-[9px] font-bold uppercase focus:bg-neutral-800">
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.status}
                  onValueChange={(value) => setStatus(value as BatchFilters["status"])}
                >
                  <SelectTrigger className="h-12 w-full md:w-[150px] rounded-[4px] border-neutral-800 bg-[#171717] text-[10px] font-bold uppercase tracking-widest text-neutral-400 focus:border-blue-600 focus:ring-0 hover:border-neutral-700 transition-colors">
                    <div className="flex items-center gap-2">
                      <Filter className="h-3.5 w-3.5 text-neutral-500" />
                      <SelectValue placeholder="Status" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
                    <SelectItem value="all" className="text-[9px] font-bold uppercase focus:bg-neutral-800">Todos</SelectItem>
                    <SelectItem value="expired" className="text-[9px] font-bold uppercase focus:bg-neutral-800 text-rose-500">Expirado</SelectItem>
                    <SelectItem value="expiring" className="text-[9px] font-bold uppercase focus:bg-neutral-800 text-amber-500">Expirando</SelectItem>
                    <SelectItem value="low" className="text-[9px] font-bold uppercase focus:bg-neutral-800 text-blue-500">Baixo Estoque</SelectItem>
                    <SelectItem value="ok" className="text-[9px] font-bold uppercase focus:bg-neutral-800 text-emerald-500">Regular</SelectItem>
                  </SelectContent>
                </Select>
                
                {(filters.searchQuery || filters.warehouseId || filters.status !== "all") && (
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
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="text-xs uppercase tracking-wide text-neutral-500">Carregando lotes...</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex h-64 w-full flex-col items-center justify-center gap-4 rounded-[4px] border border-rose-900/30 bg-rose-950/10">
                <AlertTriangle className="h-8 w-8 text-rose-500" />
                <div className="text-center">
                  <h3 className="text-sm font-bold uppercase text-rose-500">Falha na conexão</h3>
                  <p className="text-xs text-rose-500/70">Não foi possível carregar a lista de lotes</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && batches.length === 0 && (
              <div className="flex h-96 w-full flex-col items-center justify-center gap-6 rounded-[4px] border border-dashed border-neutral-800 bg-[#171717]/30">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900 ring-1 ring-neutral-800">
                  <Layers className="h-8 w-8 text-neutral-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-300">
                    {filters.searchQuery || filters.status !== 'all' ? "Nenhum resultado encontrado" : "Nenhum lote cadastrado"}
                  </h3>
                  <p className="mt-1 max-w-xs text-xs text-neutral-500">
                    {filters.searchQuery || filters.status !== 'all'
                      ? "Tente ajustar seus termos de busca ou filtros." 
                      : "O inventário de lotes está vazio. Comece adicionando um novo lote."}
                  </p>
                </div>
                {filters.searchQuery || filters.status !== 'all' ? (
                  <Button
                    variant="outline"
                    onClick={onClearFilters}
                    className="rounded-[4px] border-neutral-700 text-xs uppercase text-neutral-300 hover:bg-neutral-800"
                  >
                    Limpar Filtros
                  </Button>
                ) : (
                  <Link href="/batches/create">
                    <Button className="rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700">
                      <Plus className="mr-2 h-3.5 w-3.5" />
                      Primeiro Lote
                    </Button>
                  </Link>
                )}
              </div>
            )}

            {/* Table View (Desktop) */}
            {!isLoading && !error && batches.length > 0 && (
              <>
                <div className="hidden overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717] md:block">
                  <Table>
                    <TableHeader className="bg-neutral-900">
                      <TableRow className="border-b border-neutral-800 hover:bg-neutral-900">
                        <TableHead
                          className="h-10 cursor-pointer text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white"
                          onClick={() => handleSort("product")}
                        >
                          <div className="flex items-center gap-1">Produto <SortIcon field="product" /></div>
                        </TableHead>
                        <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                          Código / Lote
                        </TableHead>
                        <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                          Armazém
                        </TableHead>
                        <TableHead
                          className="h-10 text-right cursor-pointer text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white"
                          onClick={() => handleSort("quantity")}
                        >
                           <div className="flex items-center justify-end gap-1">Qtd. <SortIcon field="quantity" /></div>
                        </TableHead>
                        <TableHead
                          className="h-10 text-center cursor-pointer text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white"
                          onClick={() => handleSort("expiration")}
                        >
                           <div className="flex items-center justify-center gap-1">Validade <SortIcon field="expiration" /></div>
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
                                <span className="font-medium text-white">{batch.productName}</span>
                                <span className="font-mono text-[10px] text-neutral-500">
                                  {batch.productSku || "SEM SKU"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-mono text-xs text-neutral-300">{batch.batchNumber || "—"}</span>
                                {batch.batchCode && (
                                  <span className="font-mono text-[10px] text-neutral-600">{batch.batchCode}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="flex flex-col text-xs">
                                <span className="text-neutral-300">{batch.warehouseName}</span>
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
                                  style.border
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
                                    className="h-8 w-8 rounded-[4px] hover:bg-neutral-800 text-neutral-400 hover:text-white"
                                    aria-label="Ver detalhes"
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
                          "border-l-4",
                          style.indicator.replace("bg-", "border-")
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-white">{batch.productName}</h3>
                            <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                              <span className="font-mono">{batch.batchNumber || "SEM LOTE"}</span>
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
                              style.border
                            )}
                          >
                            {batch.quantity} un
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-xs border-t border-neutral-800 pt-3 mt-1">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">Validade</span>
                            <span className="text-neutral-300 font-mono">{formatDate(batch.expirationDate)}</span>
                          </div>
                          <div className="flex flex-col items-end">
                             <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">Status</span>
                             <span className={cn("font-bold uppercase", style.color)}>{status.label}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <Link href={`/batches/${batch.id}`} className="flex-1">
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
      <Link href="/batches/create">
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
