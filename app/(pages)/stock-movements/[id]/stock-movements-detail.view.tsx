"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Check,
  X,
  Loader2,
  AlertTriangle,
  ArrowRightLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  Scale,
  Calendar,
  User,
  Warehouse,
  FileText,
  Package,
  Barcode,
} from "lucide-react";
import type {
  StockMovement,
  MovementType,
  MovementStatus,
} from "../stock-movements.types";
import { cn } from "@/lib/utils";

interface StockMovementDetailViewProps {
  movement: StockMovement | null;
  isLoading: boolean;
  error: any;
  isExecuting: boolean;
  isCancelling: boolean;
  onExecute: () => void;
  onCancel: () => void;
  isCancelOpen: boolean;
  onCancelOpenChange: (open: boolean) => void;
}

export const StockMovementDetailView = ({
  movement,
  isLoading,
  error,
  isExecuting,
  isCancelling,
  onExecute,
  onCancel,
  isCancelOpen,
  onCancelOpenChange,
}: StockMovementDetailViewProps) => {
  const getMovementStyle = (type: MovementType) => {
    switch (type) {
      case "ENTRY":
        return {
          label: "ENTRADA",
          icon: ArrowDownToLine,
          color: "text-emerald-500",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/20",
        };
      case "EXIT":
        return {
          label: "SAÍDA",
          icon: ArrowUpFromLine,
          color: "text-rose-500",
          bg: "bg-rose-500/10",
          border: "border-rose-500/20",
        };
      case "TRANSFER":
        return {
          label: "TRANSFERÊNCIA",
          icon: RefreshCw,
          color: "text-blue-500",
          bg: "bg-blue-500/10",
          border: "border-blue-500/20",
        };
      case "ADJUSTMENT":
        return {
          label: "AJUSTE",
          icon: Scale,
          color: "text-amber-500",
          bg: "bg-amber-500/10",
          border: "border-amber-500/20",
        };
      default:
        return {
          label: type,
          icon: ArrowRightLeft,
          color: "text-neutral-500",
          bg: "bg-neutral-500/10",
          border: "border-neutral-500/20",
        };
    }
  };

  const getStatusStyle = (status: MovementStatus) => {
    switch (status) {
      case "COMPLETED":
        return {
          label: "CONCLUÍDO",
          color: "text-emerald-500",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/20",
        };
      case "PENDING":
        return {
          label: "PENDENTE",
          color: "text-amber-500",
          bg: "bg-amber-500/10",
          border: "border-amber-500/20",
        };
      case "CANCELLED":
        return {
          label: "CANCELADO",
          color: "text-neutral-500",
          bg: "bg-neutral-500/10",
          border: "border-neutral-500/20",
        };
      default:
        return {
          label: status,
          color: "text-neutral-500",
          bg: "bg-neutral-500/10",
          border: "border-neutral-500/20",
        };
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-xs uppercase tracking-wide text-neutral-500">
            Carregando detalhes...
          </span>
        </div>
      </div>
    );
  }

  if (error || !movement) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0A0A0A]">
        <div className="flex h-20 w-20 items-center justify-center rounded-[4px] border border-rose-900/30 bg-rose-950/10">
          <AlertTriangle className="h-10 w-10 text-rose-500" />
        </div>
        <div className="text-center">
          <h1 className="text-lg font-bold uppercase text-white">
            Movimentação não encontrada
          </h1>
          <p className="text-sm text-neutral-500">
            Não foi possível carregar os dados solicitados.
          </p>
        </div>
        <Link href="/stock-movements">
          <Button
            variant="outline"
            className="mt-4 rounded-[4px] border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para lista
          </Button>
        </Link>
      </div>
    );
  }

  const canAct = movement.status === "PENDING";
  const movementStyle = getMovementStyle(movement.movementType);
  const statusStyle = getStatusStyle(movement.status);

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24 md:pb-20 font-sans text-neutral-200">
      {/* Actions Bar */}
      <div className="mx-auto w-full max-w-7xl px-4 pt-6 md:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 md:gap-3">
            <Badge
              variant="outline"
              className={cn(
                "rounded-[2px] border px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider gap-1",
                movementStyle.bg,
                movementStyle.color,
                movementStyle.border
              )}
            >
              <movementStyle.icon className="h-3 w-3" />
              {movementStyle.label}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "rounded-[2px] border px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider",
                statusStyle.bg,
                statusStyle.color,
                statusStyle.border
              )}
            >
              {statusStyle.label}
            </Badge>
          </div>

          {canAct && (
            <div className="flex items-center gap-2">
              <AlertDialog
                open={isCancelOpen}
                onOpenChange={onCancelOpenChange}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 rounded-[4px] border-neutral-800 bg-neutral-900 text-xs font-bold uppercase tracking-wide text-neutral-300 hover:bg-rose-950/30 hover:text-rose-500 hover:border-rose-900/50"
                  >
                    <X className="mr-2 h-3.5 w-3.5" />
                    Cancelar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-200">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-sm font-bold uppercase tracking-wide text-white">
                      Cancelar Movimentação?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-xs text-neutral-500">
                      Esta ação irá cancelar a movimentação pendente e não
                      poderá ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel className="rounded-[4px] border-neutral-700 bg-transparent text-xs uppercase hover:bg-neutral-800 hover:text-white">
                      Voltar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onCancel}
                      disabled={isCancelling}
                      className="rounded-[4px] bg-rose-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-rose-700"
                    >
                      {isCancelling ? (
                        <>
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          Cancelando...
                        </>
                      ) : (
                        "Confirmar Cancelamento"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                onClick={onExecute}
                disabled={isExecuting}
                className="h-9 rounded-[4px] bg-emerald-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-emerald-700 shadow-[0_0_20px_-5px_rgba(5,150,105,0.3)]"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Executando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-3.5 w-3.5" />
                    Executar
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Info */}
          <div className="flex flex-col gap-6 md:col-span-2 order-2 md:order-1">
            {/* Warehouses Card */}
            <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Warehouse className="h-4 w-4 text-neutral-500" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                  Locais
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative pl-3 border-l-2 border-neutral-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 block mb-1">
                    Origem
                  </span>
                  <span className="text-sm font-medium text-white block">
                    {movement.sourceWarehouseName || (
                      <span className="text-neutral-600 italic">
                        N/A (Entrada/Ajuste)
                      </span>
                    )}
                  </span>
                </div>

                <div className="relative pl-3 border-l-2 border-neutral-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 block mb-1">
                    Destino
                  </span>
                  <span className="text-sm font-medium text-white block">
                    {movement.destinationWarehouseName || (
                      <span className="text-neutral-600 italic">
                        N/A (Saída/Ajuste)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Itens da Movimentação
                </h3>
                <Badge
                  variant="outline"
                  className="rounded-[2px] border-neutral-700 bg-neutral-800 text-[10px] text-neutral-400"
                >
                  {movement.items.length} ITENS
                </Badge>
              </div>

              {/* Mobile Card List */}
              <div className="flex flex-col gap-3 md:hidden">
                {movement.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[4px] border border-neutral-800 bg-[#171717] p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-white">
                        {item.productName}
                      </span>
                      <span className="font-mono text-sm font-bold text-white bg-neutral-800 px-2 py-0.5 rounded-[2px] border border-neutral-700">
                        {item.quantity}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-neutral-500 border-t border-neutral-800 pt-2 mt-2">
                      {item.productSku && (
                        <div className="flex items-center gap-1">
                          <Barcode className="h-3 w-3" />
                          <span className="font-mono">{item.productSku}</span>
                        </div>
                      )}

                      {item.batchNumber && (
                        <>
                          <div className="h-3 w-px bg-neutral-800"></div>
                          <div className="flex items-center gap-1">
                            <span className="font-bold uppercase">Lote:</span>
                            <span className="font-mono text-neutral-300">
                              {item.batchNumber}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block rounded-[4px] border border-neutral-800 bg-[#171717] overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-neutral-900">
                      <TableRow className="border-b border-neutral-800 hover:bg-neutral-900">
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                          Produto
                        </TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                          Lote
                        </TableHead>
                        <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                          Quantidade
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movement.items.map((item) => (
                        <TableRow
                          key={item.id}
                          className="border-b border-neutral-800/50 hover:bg-neutral-800/30"
                        >
                          <TableCell className="py-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium text-white">
                                {item.productName}
                              </span>
                              {item.productSku && (
                                <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                                  <Barcode className="h-3 w-3" />
                                  <span className="font-mono">
                                    {item.productSku}
                                  </span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            {item.batchNumber ? (
                              <Badge
                                variant="outline"
                                className="rounded-[2px] border-neutral-700 bg-neutral-800 text-[10px] font-mono text-neutral-300"
                              >
                                {item.batchNumber}
                              </Badge>
                            ) : (
                              <span className="text-xs text-neutral-600">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            <span className="font-mono text-sm font-bold text-white">
                              {item.quantity}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="md:col-span-1 order-1 md:order-2">
            <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-5 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-neutral-500" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                    Informações
                  </h3>
                </div>

                {/* Mobile Type Badge */}
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-[2px] border px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider gap-1 md:hidden",
                    movementStyle.bg,
                    movementStyle.color,
                    movementStyle.border
                  )}
                >
                  <movementStyle.icon className="h-3 w-3" />
                  {movementStyle.label}
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-neutral-600 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 block mb-0.5">
                      Criado em
                    </span>
                    <span className="text-xs text-neutral-300 block">
                      {new Date(movement.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                    <span className="text-[10px] text-neutral-500 block">
                      {new Date(movement.createdAt).toLocaleTimeString("pt-BR")}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-neutral-600 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 block mb-0.5">
                      Criado por
                    </span>
                    <span className="text-xs text-neutral-300 block">
                      {movement.createdByName}
                    </span>
                  </div>
                </div>

                {movement.notes && (
                  <>
                    <div className="h-px w-full bg-neutral-800/50"></div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 block mb-2">
                        Observações
                      </span>
                      <p className="text-xs text-neutral-400 leading-relaxed bg-neutral-900/50 p-3 rounded-[2px] border border-neutral-800/50">
                        {movement.notes}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Floating Actions */}
      {canAct && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0A0A0A]/95 backdrop-blur-sm border-t border-neutral-800 md:hidden z-40 flex gap-3">
          <AlertDialog open={isCancelOpen} onOpenChange={onCancelOpenChange}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-[4px] border-neutral-800 bg-neutral-900 text-xs font-bold uppercase tracking-wide text-neutral-300 hover:bg-rose-950/30 hover:text-rose-500 hover:border-rose-900/50"
              >
                Cancelar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-200">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-sm font-bold uppercase tracking-wide text-white">
                  Cancelar Movimentação?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-neutral-500">
                  Esta ação irá cancelar a movimentação pendente e não poderá
                  ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel className="rounded-[4px] border-neutral-700 bg-transparent text-xs uppercase hover:bg-neutral-800 hover:text-white">
                  Voltar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onCancel}
                  disabled={isCancelling}
                  className="rounded-[4px] bg-rose-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-rose-700"
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    "Confirmar Cancelamento"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            onClick={onExecute}
            disabled={isExecuting}
            className="flex-1 h-12 rounded-[4px] bg-emerald-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-emerald-700 shadow-[0_0_20px_-5px_rgba(5,150,105,0.3)]"
          >
            {isExecuting ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Executando...
              </>
            ) : (
              "Executar"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
