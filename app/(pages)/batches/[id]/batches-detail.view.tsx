"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
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
  Pencil,
  Trash2,
  Box,
  MapPin,
  DollarSign,
  Package,
  History,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Batch } from "../batches.types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PermissionGate } from "@/components/permission-gate";

interface BatchesDetailViewProps {
  batch: Batch | null;
  isLoading: boolean;
  error: Error | null;
  isDeleteOpen: boolean;
  onDeleteOpenChange: (open: boolean) => void;
  isDeleting: boolean;
  onDelete: () => void;
}

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  try {
    return format(new Date(value), "dd 'de' MMM, yyyy", { locale: ptBR });
  } catch {
    return value;
  }
};

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return "-";
  const formatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  return formatter.format(value / 100);
};

export const BatchesDetailView = ({
  batch,
  isLoading,
  error,
  isDeleteOpen,
  onDeleteOpenChange,
  isDeleting,
  onDelete,
}: BatchesDetailViewProps) => {
  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
        <div className="h-14 border-b border-[#262626] bg-[#0A0A0A]" />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <div className="h-8 w-8 bg-[#262626] rounded-[4px]" />
            <div className="h-4 w-32 bg-[#262626] rounded-[4px]" />
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !batch) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
        <header className="sticky top-0 z-20 border-b border-[#262626] bg-[#0A0A0A]/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 w-full max-w-7xl items-center px-4">
            <Link
              href="/batches"
              className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] border border-[#262626] bg-[#171717] hover:bg-[#262626] transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-neutral-400" />
            </Link>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-neutral-400">
          <Box className="h-12 w-12 mb-4 opacity-20" />
          <h2 className="text-lg font-semibold text-neutral-200">
            Batch não encontrado
          </h2>
          <p className="text-sm">
            O lote que você procura não existe ou foi removido.
          </p>
        </main>
      </div>
    );
  }

  // Derived Status Logic
  const isExpired = batch.expirationDate
    ? isPast(new Date(batch.expirationDate)) &&
      !isToday(new Date(batch.expirationDate))
    : false;
  const statusColor = isExpired ? "text-rose-500" : "text-emerald-500";
  const statusBg = isExpired ? "bg-rose-500/10" : "bg-emerald-500/10";
  const statusBorder = isExpired
    ? "border-rose-500/20"
    : "border-emerald-500/20";

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-neutral-200 font-sans selection:bg-blue-500/30">
      {/* Actions Bar */}
      <div className="mx-auto w-full max-w-7xl px-4 pt-6 md:px-6">
        <div className="flex items-center justify-between mb-4">
          <Badge
            variant="outline"
            className={cn(
              "rounded-[4px] px-1.5 py-0 text-[10px] font-medium border uppercase tracking-wider",
              statusBg,
              statusColor,
              statusBorder,
            )}
          >
            {isExpired ? "Expirado" : "Ativo"}
          </Badge>
          <div className="flex items-center gap-2">
            <PermissionGate permission="batches:update">
              <Link href={`/batches/${batch.id}/edit`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-[4px] border-[#262626] bg-[#171717] hover:bg-[#262626] hover:text-white text-neutral-400 font-medium"
                >
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  EDITAR
                </Button>
              </Link>
            </PermissionGate>

            <AlertDialog open={isDeleteOpen} onOpenChange={onDeleteOpenChange}>
              <PermissionGate permission="batches:delete">
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-[4px] border-[#262626] bg-[#171717] hover:bg-rose-950/30 hover:border-rose-900/50 hover:text-rose-500 text-neutral-400 font-medium transition-colors"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    EXCLUIR
                  </Button>
                </AlertDialogTrigger>
              </PermissionGate>
              <AlertDialogContent className="rounded-[4px] border-[#262626] bg-[#171717]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">
                    Excluir batch permanentemente?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-neutral-400">
                    Esta ação não pode ser desfeita. Isso excluirá
                    permanentemente o batch e removerá os dados de nossos
                    servidores.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-[4px] border-[#262626] bg-transparent text-white hover:bg-[#262626]">
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="rounded-[4px] bg-rose-600 text-white hover:bg-rose-700 border border-rose-500"
                    onClick={onDelete}
                    disabled={isDeleting}
                  >
                    Confirmar Exclusão
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN - MAIN INFO (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* PRODUCT IDENTITY CARD */}
            <div className="group relative overflow-hidden rounded-[4px] border border-[#262626] bg-[#171717]">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-1">
                      Produto Vinculado
                    </h3>
                    <Link
                      href={`/products/${batch.productId}`}
                      className="hover:underline decoration-blue-500/50 underline-offset-4"
                    >
                      <h2 className="text-2xl font-semibold text-white tracking-tight">
                        {batch.productName}
                      </h2>
                    </Link>
                  </div>
                  <div className="p-2 bg-[#262626] rounded-[4px]">
                    <Package className="h-5 w-5 text-neutral-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#262626]">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
                      SKU do Produto
                    </p>
                    <p className="font-mono text-sm text-neutral-200">
                      {batch.productSku || "---"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
                      Categoria
                    </p>
                    <p className="text-sm text-neutral-200">Geral</p>{" "}
                    {/* Placeholder if category not in batch object */}
                  </div>
                </div>
              </div>
            </div>

            {/* FINANCIALS & METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-[4px] border border-[#262626] bg-[#171717] p-5">
                <div className="flex items-center gap-2 mb-4 text-emerald-500">
                  <DollarSign className="h-4 w-4" />
                  <h3 className="text-xs font-bold uppercase tracking-widest">
                    Financeiro
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-[#262626] pb-2">
                    <span className="text-xs text-neutral-500">
                      Preço de Custo
                    </span>
                    <span className="font-mono text-sm text-white">
                      {formatCurrency(batch.costPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between items-end border-b border-[#262626] pb-2">
                    <span className="text-xs text-neutral-500">
                      Preço de Venda
                    </span>
                    <span className="font-mono text-sm text-white">
                      {formatCurrency(batch.sellingPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between items-end pt-1">
                    <span className="text-xs text-neutral-500">
                      Margem Estimada
                    </span>
                    {batch.sellingPrice && batch.costPrice ? (
                      <span className="font-mono text-sm text-emerald-500 font-bold">
                        {Math.round(
                          ((batch.sellingPrice - batch.costPrice) /
                            batch.costPrice) *
                            100,
                        )}
                        %
                      </span>
                    ) : (
                      <span className="text-neutral-600">-</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-[4px] border border-[#262626] bg-[#171717] p-5">
                <div className="flex items-center gap-2 mb-4 text-purple-500">
                  <MapPin className="h-4 w-4" />
                  <h3 className="text-xs font-bold uppercase tracking-widest">
                    Localização
                  </h3>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-neutral-500 uppercase tracking-wide">
                    Warehouse
                  </p>
                  <p className="text-lg font-medium text-white">
                    {batch.warehouseName}
                  </p>
                  <div className="pt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-[2px] bg-[#262626] border border-[#333] text-[10px] text-neutral-400 font-mono">
                      COD: {batch.warehouseCode || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - SIDEBAR (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* CURRENT STOCK */}
            <div className="rounded-[4px] border border-[#262626] bg-[#171717] p-6 relative overflow-hidden">
              <div className="absolute -right-6 -top-6 h-24 w-24 bg-blue-600/5 rounded-full blur-2xl pointer-events-none"></div>

              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4">
                Estoque Atual
              </h3>

              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold tracking-tighter text-white">
                  {batch.quantity}
                </span>
                <span className="text-sm text-neutral-500 font-medium">
                  unid.
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-[#262626] flex items-center gap-2 text-xs text-neutral-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Disponível para venda</span>
              </div>
            </div>

            {/* LIFECYCLE TIMELINE */}
            <div className="rounded-[4px] border border-[#262626] bg-[#171717] p-6">
              <div className="flex items-center gap-2 mb-6 text-amber-500">
                <History className="h-4 w-4" />
                <h3 className="text-xs font-bold uppercase tracking-widest">
                  Ciclo de Vida
                </h3>
              </div>

              <div className="relative pl-4 space-y-8 border-l border-[#262626]">
                {/* Manufactured */}
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-[#171717] bg-neutral-600" />
                  <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-0.5">
                    Fabricação
                  </p>
                  <p className="text-sm font-medium text-white">
                    {formatDate(batch.manufacturedDate)}
                  </p>
                </div>

                {/* Created At */}
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-[#171717] bg-blue-600" />
                  <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-0.5">
                    Registrado em
                  </p>
                  <p className="text-sm font-medium text-white">
                    {formatDate(batch.createdAt)}
                  </p>
                </div>

                {/* Expiration */}
                <div className="relative">
                  <div
                    className={cn(
                      "absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-[#171717]",
                      isExpired ? "bg-rose-500" : "bg-neutral-600",
                    )}
                  />
                  <p
                    className={cn(
                      "text-[10px] uppercase tracking-wider mb-0.5",
                      isExpired
                        ? "text-rose-500 font-bold"
                        : "text-neutral-500",
                    )}
                  >
                    Validade
                  </p>
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        isExpired ? "text-rose-400" : "text-white",
                      )}
                    >
                      {formatDate(batch.expirationDate)}
                    </p>
                    {isExpired && (
                      <span className="text-[10px] bg-rose-950/50 text-rose-500 px-1.5 py-0.5 rounded-[2px] border border-rose-900/50 uppercase tracking-wide">
                        Vencido
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* QUICK ACTIONS / META */}
            <div className="rounded-[4px] border border-[#262626] bg-[#0A0A0A] p-4">
              <div className="flex items-center gap-2 text-neutral-500 text-xs">
                <Clock className="h-3.5 w-3.5" />
                <span>Última atualização: {format(new Date(), "HH:mm")}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
