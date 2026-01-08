"use client";

import Link from "next/link";
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
import { Plus, Search } from "lucide-react";
import type { StockMovement, MovementFilters, SortConfig } from "./stock-movements.types";

interface StockMovementsViewProps {
  movements: StockMovement[];
  isLoading: boolean;
  error: any;
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
  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-20 border-b border-border/40 bg-card">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
          <div>
            <h1 className="text-base font-semibold uppercase tracking-wide">Movimentações</h1>
            <p className="text-xs text-muted-foreground hidden md:block mt-0.5">
              Controle de entradas e saídas
            </p>
          </div>
          <Link href="/stock-movements/create">
            <Button className="rounded-sm bg-foreground text-background hover:bg-foreground/90">
              <Plus className="mr-2 h-3.5 w-3.5" />
              Nova Movimentação
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <Card className="border border-border/50 bg-card/80 rounded-sm">
          <CardHeader className="border-b border-border/30">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
              Lista de Movimentações
            </CardTitle>
            <CardDescription className="text-xs">
              {movements.length} registros
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  placeholder="Buscar por nota, produto ou lote..."
                  value={filters.searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-9 h-9 rounded-sm border-border/40 text-xs bg-background"
                />
              </div>
              <Select
                value={filters.movementType}
                onValueChange={(value) =>
                  setMovementType(value as MovementFilters["movementType"])
                }
              >
                <SelectTrigger className="h-9 rounded-sm border-border/40 text-xs">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="rounded-sm">
                  <SelectItem value="all" className="text-xs">
                    Todos
                  </SelectItem>
                  <SelectItem value="ENTRY" className="text-xs">
                    Entrada
                  </SelectItem>
                  <SelectItem value="EXIT" className="text-xs">
                    Saída
                  </SelectItem>
                  <SelectItem value="TRANSFER" className="text-xs">
                    Transferência
                  </SelectItem>
                  <SelectItem value="ADJUSTMENT" className="text-xs">
                    Ajuste
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setStatus(value as MovementFilters["status"])
                }
              >
                <SelectTrigger className="h-9 rounded-sm border-border/40 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-sm">
                  <SelectItem value="all" className="text-xs">
                    Todos
                  </SelectItem>
                  <SelectItem value="PENDING" className="text-xs">
                    Pendente
                  </SelectItem>
                  <SelectItem value="COMPLETED" className="text-xs">
                    Concluído
                  </SelectItem>
                  <SelectItem value="CANCELLED" className="text-xs">
                    Cancelado
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading && (
              <div className="py-10 text-center text-xs text-muted-foreground">
                Carregando movimentações...
              </div>
            )}

            {error && (
              <div className="py-10 text-center text-xs text-muted-foreground">
                Erro ao carregar movimentações
              </div>
            )}

            {!isLoading && !error && movements.length === 0 && (
              <div className="py-10 text-center text-xs text-muted-foreground">
                Nenhuma movimentação encontrada
              </div>
            )}

            {!isLoading && !error && movements.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Tipo</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Notas</TableHead>
                      <TableHead className="text-xs">Criado em</TableHead>
                      <TableHead className="text-xs text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell className="text-xs">
                          {movement.movementType}
                        </TableCell>
                        <TableCell className="text-xs">
                          {movement.status}
                        </TableCell>
                        <TableCell className="text-xs">
                          {movement.notes || "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {new Date(movement.createdAt).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          <Link
                            href={`/stock-movements/${movement.id}`}
                            className="text-foreground/80 hover:text-foreground"
                          >
                            Ver
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
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
