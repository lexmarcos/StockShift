"use client";

import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ShoppingCart, Plus, Calendar, Eye, MoreHorizontal, Filter,
} from "lucide-react";
import Link from "next/link";
import { PermissionGate } from "@/components/permission-gate";
import {
  SaleSummary, SaleStatus, PAYMENT_METHOD_LABELS,
  SALE_STATUS_LABELS, formatCents,
} from "./sales.types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SalesViewProps {
  sales: SaleSummary[];
  isLoading: boolean;
  error: Error | null;
  filters: { status: string; paymentMethod: string };
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalElements: number;
  };
  onPageChange: (page: number) => void;
  onFilterChange: (key: string, value: string) => void;
}

const getStatusStyle = (status: SaleStatus) =>
  status === "COMPLETED"
    ? { color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" }
    : { color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" };

export const SalesView = ({
  sales, isLoading, filters, pagination, onPageChange, onFilterChange,
}: SalesViewProps) => {
  const SaleActions = ({ sale }: { sale: SaleSummary }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-200 shadow-xl">
        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Ações</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-neutral-800" />
        <DropdownMenuItem asChild>
          <Link href={`/sales/${sale.id}`} className="cursor-pointer focus:bg-neutral-800 focus:text-white flex items-center w-full">
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tighter text-white">Vendas</h1>
                <p className="text-sm text-neutral-500 mt-1">Histórico de vendas realizadas</p>
              </div>
              <PermissionGate permission="sales:create">
                <Link href="/sales/pdv">
                  <Button className="h-10 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)]">
                    <Plus className="mr-2 h-4 w-4" /> Nova Venda
                  </Button>
                </Link>
              </PermissionGate>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:h-12 w-full">
              <Select value={filters.status || "ALL"} onValueChange={(value) => onFilterChange("status", value)}>
                <SelectTrigger className="h-12 w-full md:w-[200px] rounded-[4px] border-neutral-800 bg-[#171717] text-[12px] font-bold uppercase tracking-widest text-neutral-400 focus:border-blue-600 focus:ring-0 hover:border-neutral-700">
                  <div className="flex items-center gap-2"><Filter className="h-3.5 w-3.5 text-neutral-500" /><SelectValue placeholder="Status" /></div>
                </SelectTrigger>
                <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
                  <SelectItem value="ALL" className="text-[12px] font-bold uppercase focus:bg-neutral-800">Todos</SelectItem>
                  <SelectItem value="COMPLETED" className="text-[12px] font-bold uppercase focus:bg-neutral-800">Concluída</SelectItem>
                  <SelectItem value="CANCELLED" className="text-[12px] font-bold uppercase focus:bg-neutral-800">Cancelada</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.paymentMethod || "ALL"} onValueChange={(value) => onFilterChange("paymentMethod", value)}>
                <SelectTrigger className="h-12 w-full md:w-[200px] rounded-[4px] border-neutral-800 bg-[#171717] text-[12px] font-bold uppercase tracking-widest text-neutral-400 focus:border-blue-600 focus:ring-0 hover:border-neutral-700">
                  <div className="flex items-center gap-2"><Filter className="h-3.5 w-3.5 text-neutral-500" /><SelectValue placeholder="Pagamento" /></div>
                </SelectTrigger>
                <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
                  <SelectItem value="ALL" className="text-[12px] font-bold uppercase focus:bg-neutral-800">Todos</SelectItem>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="text-[12px] font-bold uppercase focus:bg-neutral-800">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block rounded-[4px] border-l-4 border-l-blue-600 border border-neutral-800 bg-[#171717] overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900/50">
                    <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Código</TableHead>
                    <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Data</TableHead>
                    <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Pagamento</TableHead>
                    <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Total</TableHead>
                    <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Status</TableHead>
                    <TableHead className="py-4 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={6} className="h-48 text-center text-neutral-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-500 border-t-blue-500" />
                        <span className="text-[10px] uppercase font-bold tracking-widest">Carregando vendas...</span>
                      </div>
                    </TableCell></TableRow>
                  ) : sales.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="h-48 text-center text-neutral-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ShoppingCart className="h-8 w-8 text-neutral-700" />
                        <span className="text-[10px] uppercase font-bold tracking-widest">Nenhuma venda encontrada</span>
                      </div>
                    </TableCell></TableRow>
                  ) : (
                    sales.map((sale) => {
                      const s = getStatusStyle(sale.status);
                      return (
                        <TableRow key={sale.id} className="border-b border-neutral-800 transition-colors hover:bg-neutral-800/50">
                          <TableCell className="py-4"><Link href={`/sales/${sale.id}`} className="font-mono text-sm font-bold text-white hover:text-blue-400">{sale.code}</Link></TableCell>
                          <TableCell className="py-4"><div className="flex items-center text-sm text-neutral-400"><Calendar className="mr-2 h-3.5 w-3.5" />{format(new Date(sale.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div></TableCell>
                          <TableCell className="py-4"><span className="text-sm font-medium text-neutral-300">{PAYMENT_METHOD_LABELS[sale.paymentMethod]}</span></TableCell>
                          <TableCell className="py-4"><span className="font-mono text-sm font-bold text-white">{formatCents(sale.total)}</span></TableCell>
                          <TableCell className="py-4"><span className={`inline-flex items-center rounded-[2px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${s.bg} ${s.color} ${s.border}`}>{SALE_STATUS_LABELS[sale.status]}</span></TableCell>
                          <TableCell className="py-4 text-right"><SaleActions sale={sale} /></TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-8 gap-2"><div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-500 border-t-blue-500" /><span className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Carregando...</span></div>
            ) : sales.length === 0 ? (
              <div className="p-8 text-center bg-[#171717] rounded-[4px] border border-neutral-800"><span className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Nenhuma venda encontrada</span></div>
            ) : (
              sales.map((sale) => {
                const s = getStatusStyle(sale.status);
                return (
                  <div key={sale.id} className="flex flex-col gap-3 rounded-[4px] border-l-4 border-l-blue-600 border-y border-r border-y-neutral-800 border-r-neutral-800 bg-[#171717] p-4">
                    <div className="flex items-center justify-between">
                      <Link href={`/sales/${sale.id}`} className="font-mono text-base font-bold text-white hover:text-blue-400">{sale.code}</Link>
                      <SaleActions sale={sale} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="flex flex-col"><span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Data</span><span className="text-sm text-neutral-300 mt-0.5">{format(new Date(sale.createdAt), "dd/MM/yyyy", { locale: ptBR })}</span></div>
                      <div className="flex flex-col"><span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Total</span><span className="text-sm font-bold text-white mt-0.5">{formatCents(sale.total)}</span></div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-neutral-800">
                      <span className="text-xs font-medium text-neutral-400">{PAYMENT_METHOD_LABELS[sale.paymentMethod]}</span>
                      <span className={`inline-flex items-center rounded-[2px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${s.bg} ${s.color} ${s.border}`}>{SALE_STATUS_LABELS[sale.status]}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-neutral-500">Página {pagination.page + 1} de {Math.max(1, pagination.totalPages)}</p>
            <div className="flex gap-2">
              <Button variant="outline" disabled={pagination.page === 0} onClick={() => onPageChange(pagination.page - 1)} className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-400 hover:bg-neutral-800 hover:text-white">Anterior</Button>
              <Button variant="outline" disabled={pagination.page >= pagination.totalPages - 1} onClick={() => onPageChange(pagination.page + 1)} className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-400 hover:bg-neutral-800 hover:text-white">Próxima</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
