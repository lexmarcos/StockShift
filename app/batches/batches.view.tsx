"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Package,
  Plus,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Batch, BatchFilters, SortConfig } from "./batches.types";
import { deriveBatchStatus } from "./batches.model";
import type { Warehouse } from "../warehouses/warehouses.types";

interface BatchesViewProps {
  batches: Batch[];
  isLoading: boolean;
  error: any;
  filters: BatchFilters;
  sortConfig: SortConfig;
  warehouses: Warehouse[];
  statusCounts: { expired: number; expiring: number; low: number };
  setSearchQuery: (value: string) => void;
  setWarehouseId: (value: string) => void;
  setStatus: (value: BatchFilters["status"]) => void;
  setSortConfig: (value: SortConfig) => void;
  onClearFilters: () => void;
}

const statusStyles: Record<string, string> = {
  expired: "border-border/60 bg-muted/30 text-foreground",
  expiring: "border-border/50 bg-muted/20 text-foreground",
  low: "border-border/50 bg-muted/10 text-foreground",
  ok: "border-border/30 bg-transparent text-foreground/80",
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
  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-20 border-b border-border/40 bg-card">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
          <div>
            <h1 className="text-base font-semibold uppercase tracking-wide">Batches</h1>
            <p className="text-xs text-muted-foreground hidden md:block mt-0.5">
              Controle de lotes e validade
            </p>
          </div>
          <Link href="/batches/create">
            <Button className="rounded-sm bg-foreground text-background hover:bg-foreground/90">
              <Plus className="mr-2 h-3.5 w-3.5" />
              Novo Batch
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <Card className="border border-border/50 bg-card/80 rounded-sm">
          <CardHeader className="border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-foreground/5 border border-border/30">
                <Package className="h-4 w-4 text-foreground/70" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                  Lista de Batches
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {batches.length} {batches.length === 1 ? "batch" : "batches"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  placeholder="Buscar por produto, SKU ou batch..."
                  value={filters.searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-9 h-9 rounded-sm border-border/40 text-xs bg-background"
                />
              </div>

              <Select
                value={filters.warehouseId || "all"}
                onValueChange={(value) => setWarehouseId(value === "all" ? "" : value)}
              >
                <SelectTrigger className="h-9 rounded-sm border-border/40 text-xs">
                  <SelectValue placeholder="Warehouse" />
                </SelectTrigger>
                <SelectContent className="rounded-sm">
                  <SelectItem value="all" className="text-xs">Todos</SelectItem>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id} className="text-xs">
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.status}
                onValueChange={(value) => setStatus(value as BatchFilters["status"])}
              >
                <SelectTrigger className="h-9 rounded-sm border-border/40 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-sm">
                  <SelectItem value="all" className="text-xs">Todos</SelectItem>
                  <SelectItem value="expired" className="text-xs">Expirado</SelectItem>
                  <SelectItem value="expiring" className="text-xs">Expirando</SelectItem>
                  <SelectItem value="low" className="text-xs">Baixo Estoque</SelectItem>
                  <SelectItem value="ok" className="text-xs">OK</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={`${sortConfig.key}-${sortConfig.direction}`}
                onValueChange={(value) => {
                  const [key, direction] = value.split("-") as [
                    SortConfig["key"],
                    SortConfig["direction"]
                  ];
                  setSortConfig({ key, direction });
                }}
              >
                <SelectTrigger className="h-9 rounded-sm border-border/40 text-xs">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent className="rounded-sm">
                  <SelectItem value="createdAt-desc" className="text-xs">Mais recentes</SelectItem>
                  <SelectItem value="createdAt-asc" className="text-xs">Mais antigos</SelectItem>
                  <SelectItem value="expiration-asc" className="text-xs">Validade (asc)</SelectItem>
                  <SelectItem value="expiration-desc" className="text-xs">Validade (desc)</SelectItem>
                  <SelectItem value="quantity-desc" className="text-xs">Quantidade (alta)</SelectItem>
                  <SelectItem value="quantity-asc" className="text-xs">Quantidade (baixa)</SelectItem>
                  <SelectItem value="product-asc" className="text-xs">Produto (A-Z)</SelectItem>
                  <SelectItem value="product-desc" className="text-xs">Produto (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-sm border-border/40 text-xs">
                <Calendar className="mr-1 h-3 w-3" />
                Expirados: {statusCounts.expired}
              </Badge>
              <Badge variant="outline" className="rounded-sm border-border/40 text-xs">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Expirando (30d): {statusCounts.expiring}
              </Badge>
              <Badge variant="outline" className="rounded-sm border-border/40 text-xs">
                <Package className="mr-1 h-3 w-3" />
                Baixo estoque: {statusCounts.low}
              </Badge>
              {(filters.searchQuery || filters.warehouseId || filters.status !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-sm border-border/40 text-xs"
                  onClick={onClearFilters}
                >
                  Limpar filtros
                </Button>
              )}
            </div>

            {isLoading && (
              <div className="py-10 text-center text-xs text-muted-foreground">
                Carregando batches...
              </div>
            )}

            {error && (
              <div className="py-10 text-center text-xs text-muted-foreground">
                Erro ao carregar batches
              </div>
            )}

            {!isLoading && !error && batches.length === 0 && (
              <div className="py-10 text-center text-xs text-muted-foreground">
                Nenhum batch encontrado
              </div>
            )}

            {!isLoading && !error && batches.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Produto</TableHead>
                      <TableHead className="text-xs">Batch</TableHead>
                      <TableHead className="text-xs">Warehouse</TableHead>
                      <TableHead className="text-xs">Quantidade</TableHead>
                      <TableHead className="text-xs">Validade</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((batch) => {
                      const status = deriveBatchStatus(batch, {
                        lowStockThreshold: filters.lowStockThreshold,
                      });
                      return (
                        <TableRow key={batch.id}>
                          <TableCell className="text-xs">
                            <div className="font-semibold">{batch.productName}</div>
                            <div className="text-muted-foreground">{batch.productSku || "-"}</div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {batch.batchNumber || batch.batchCode || "-"}
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="font-semibold">{batch.warehouseName}</div>
                            <div className="text-muted-foreground">{batch.warehouseCode || "-"}</div>
                          </TableCell>
                          <TableCell className="text-xs">{batch.quantity}</TableCell>
                          <TableCell className="text-xs">{formatDate(batch.expirationDate)}</TableCell>
                          <TableCell className="text-xs">
                            <span
                              className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] uppercase ${statusStyles[status.kind]}`}
                            >
                              {status.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-right">
                            <Link
                              href={`/batches/${batch.id}`}
                              className="text-foreground/80 hover:text-foreground"
                            >
                              Ver
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
