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
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Calendar,
  Warehouse,
  CreditCard,
  ShoppingCart,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PermissionGate } from "@/components/permission-gate";
import {
  Sale,
  PAYMENT_METHOD_LABELS,
  SALE_STATUS_LABELS,
  formatCents,
} from "../sales.types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SaleDetailViewProps {
  sale: Sale | null;
  isLoading: boolean;
  isCancelling: boolean;
  cancelDialogOpen: boolean;
  setCancelDialogOpen: (open: boolean) => void;
  handleCancel: (reason: string) => void;
}

export const SaleDetailView = ({
  sale,
  isLoading,
  isCancelling,
  cancelDialogOpen,
  setCancelDialogOpen,
  handleCancel,
}: SaleDetailViewProps) => {
  const [cancelReason, setCancelReason] = useState("");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-500 border-t-blue-500" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-neutral-500">Venda não encontrada</p>
      </div>
    );
  }

  const statusStyle =
    sale.status === "COMPLETED"
      ? {
          color: "text-emerald-500",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/20",
        }
      : {
          color: "text-rose-500",
          bg: "bg-rose-500/10",
          border: "border-rose-500/20",
        };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 font-sans text-neutral-200">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
              <Link href="/sales">
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-1 h-8 w-8 shrink-0 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-bold tracking-tighter text-white break-all">
                    {sale.code}
                  </h1>
                  <span
                    className={`inline-flex items-center rounded-[2px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest shrink-0 ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}
                  >
                    {SALE_STATUS_LABELS[sale.status]}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm text-neutral-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    {format(new Date(sale.createdAt), "dd/MM/yyyy HH:mm", {
                      locale: ptBR,
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Warehouse className="h-3.5 w-3.5 shrink-0" />
                    {sale.warehouseName}
                  </span>
                </div>
              </div>
            </div>
            {sale.status === "COMPLETED" && (
              <PermissionGate permission="sales:cancel">
                <Button
                  onClick={() => setCancelDialogOpen(true)}
                  variant="outline"
                  className="w-full md:w-auto h-10 rounded-[4px] border-rose-800/50 bg-rose-950/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 text-xs font-bold uppercase tracking-wide"
                >
                  <XCircle className="mr-2 h-4 w-4 shrink-0" /> Cancelar Venda
                </Button>
              </PermissionGate>
            )}
          </div>

          {/* Payment info */}
          <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-4 md:p-5">
            <div className="flex items-center gap-3 border-b border-neutral-800/50 pb-3 mb-4">
              <CreditCard
                className="h-5 w-5 shrink-0 text-blue-400"
                strokeWidth={2}
              />
              <p className="text-sm font-bold text-white">
                Informações de Pagamento
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  Forma
                </p>
                <p className="text-sm font-medium text-white">
                  {PAYMENT_METHOD_LABELS[sale.paymentMethod]}
                </p>
              </div>
              {sale.installments && (
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    Parcelas
                  </p>
                  <p className="text-sm font-medium text-white">
                    {sale.installments}x
                  </p>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  Subtotal
                </p>
                <p className="text-sm font-medium text-white">
                  {formatCents(sale.subtotal)}
                </p>
              </div>
              {sale.discountPercentage != null &&
                sale.discountPercentage > 0 && (
                  <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                      Desconto
                    </p>
                    <p className="text-sm font-medium text-rose-400">
                      {sale.discountPercentage}% (-
                      {formatCents(sale.discountAmount)})
                    </p>
                  </div>
                )}
              <div className="flex flex-col gap-1 col-span-2 sm:col-span-1 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800/50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  Total
                </p>
                <p className="text-lg md:text-xl font-bold text-white">
                  {formatCents(sale.total)}
                </p>
              </div>
            </div>
          </div>

          {/* Cancellation info */}
          {sale.status === "CANCELLED" && sale.cancellationReason && (
            <div className="rounded-[4px] border border-rose-900/30 bg-rose-950/20 p-4 md:p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
                <p className="text-xs font-bold uppercase tracking-widest text-rose-400">
                  Venda Cancelada
                </p>
              </div>
              <p className="text-sm font-medium text-neutral-300 leading-relaxed text-balance">
                {sale.cancellationReason}
              </p>
              {sale.cancelledAt && (
                <p className="text-xs text-neutral-500 mt-4 border-t border-rose-900/20 pt-3">
                  Cancelada em{" "}
                  {format(new Date(sale.cancelledAt), "dd/MM/yyyy HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              )}
            </div>
          )}

          {/* Items */}
          <div className="rounded-[4px] border border-neutral-800 bg-[#171717] overflow-hidden">
            <div className="px-4 py-3 md:px-5 md:py-4 border-b border-neutral-800/50 flex items-center gap-3">
              <ShoppingCart
                className="h-5 w-5 shrink-0 text-blue-400"
                strokeWidth={2}
              />
              <p className="text-sm font-bold text-white">
                Itens da Venda ({sale.items.length})
              </p>
            </div>

            {/* Mobile List View */}
            <div className="flex flex-col md:hidden">
              {sale.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 border-b border-neutral-800/50 p-4 last:border-0 hover:bg-neutral-900/20 transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col">
                      <p className="text-sm font-bold text-white line-clamp-2">
                        {item.productName}
                      </p>
                      {item.productSku && (
                        <p className="text-xs text-neutral-500 mt-0.5 tracking-wide">
                          {item.productSku}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <p className="text-sm font-bold text-white font-mono">
                        {formatCents(item.totalPrice)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-1 rounded-[2px] bg-neutral-900/50 p-2.5">
                    <div className="flex flex-col gap-1">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">
                        Lote
                      </p>
                      <p className="text-xs font-medium text-neutral-300 truncate">
                        {item.batchCode}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">
                        Qtd x Preço
                      </p>
                      <p className="text-xs font-medium text-neutral-300 font-mono">
                        {item.quantity} x {formatCents(item.unitPrice)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900/50">
                    <TableHead className="py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                      Produto
                    </TableHead>
                    <TableHead className="py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                      Lote
                    </TableHead>
                    <TableHead className="py-3 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                      Qtd
                    </TableHead>
                    <TableHead className="py-3 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                      Preço Unit.
                    </TableHead>
                    <TableHead className="py-3 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                      Total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.items.map((item) => (
                    <TableRow
                      key={item.id}
                      className="border-b border-neutral-800 last:border-0"
                    >
                      <TableCell className="py-3">
                        <div className="flex flex-col gap-0.5">
                          <p className="text-sm font-bold text-white">
                            {item.productName}
                          </p>
                          {item.productSku && (
                            <p className="text-xs text-neutral-500">
                              {item.productSku}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-xs font-medium text-neutral-400">
                          {item.batchCode}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 text-right font-mono text-sm font-medium text-white">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="py-3 text-right font-mono text-sm text-neutral-400">
                        {formatCents(item.unitPrice)}
                      </TableCell>
                      <TableCell className="py-3 text-right font-mono text-sm font-bold text-white">
                        {formatCents(item.totalPrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Cancel Dialog */}
          <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
            <DialogContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-200">
              <DialogHeader>
                <DialogTitle className="text-white">Cancelar Venda</DialogTitle>
                <DialogDescription className="text-neutral-500">
                  Esta ação irá estornar o estoque dos itens vendidos. Informe o
                  motivo do cancelamento.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Motivo do cancelamento..."
                className="min-h-[100px] w-full rounded-[4px] border-2 border-neutral-800 bg-neutral-900 text-sm text-white focus:border-rose-600"
              />
              <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4 sm:space-x-2 sm:mt-0">
                <Button
                  variant="outline"
                  onClick={() => setCancelDialogOpen(false)}
                  className="w-full sm:w-auto rounded-[4px] border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                >
                  Voltar
                </Button>
                <Button
                  onClick={() => handleCancel(cancelReason)}
                  disabled={isCancelling || !cancelReason.trim()}
                  className="w-full sm:w-auto rounded-[4px] bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {isCancelling ? "Cancelando..." : "Confirmar Cancelamento"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
};
