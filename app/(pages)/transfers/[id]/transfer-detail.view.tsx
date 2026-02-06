import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Edit,
  Package,
  Warehouse,
  Truck,
  MapPin,
  Hash,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { TransferDetailViewProps } from "./transfer-detail.types";
import { TransferStatus } from "../transfers.types";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { SectionLabel } from "@/components/ui/section-label";
import { LoadingState } from "@/components/ui/loading-state";
import { FixedBottomBar } from "@/components/ui/fixed-bottom-bar";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  TransferStatus,
  { dot: string; bg: string; text: string; label: string }
> = {
  [TransferStatus.DRAFT]: {
    dot: "bg-neutral-500",
    bg: "bg-neutral-500/10 border-neutral-500/30",
    text: "text-neutral-400",
    label: "RASCUNHO",
  },
  [TransferStatus.IN_TRANSIT]: {
    dot: "bg-amber-500",
    bg: "bg-amber-500/10 border-amber-500/30",
    text: "text-amber-400",
    label: "EM TRÂNSITO",
  },
  [TransferStatus.PENDING_VALIDATION]: {
    dot: "bg-purple-500",
    bg: "bg-purple-500/10 border-purple-500/30",
    text: "text-purple-400",
    label: "AGUARDANDO VALIDAÇÃO",
  },
  [TransferStatus.IN_VALIDATION]: {
    dot: "bg-purple-500",
    bg: "bg-purple-500/10 border-purple-500/30",
    text: "text-purple-400",
    label: "EM VALIDAÇÃO",
  },
  [TransferStatus.COMPLETED]: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    text: "text-emerald-400",
    label: "CONCLUÍDA",
  },
  [TransferStatus.CANCELLED]: {
    dot: "bg-rose-500",
    bg: "bg-rose-500/10 border-rose-500/30",
    text: "text-rose-400",
    label: "CANCELADA",
  },
};

export const TransferDetailView: React.FC<TransferDetailViewProps> = ({
  isLoading,
  transfer,
  isSource,
  isDestination,
  isExecuting,
  isCancelling,
  isValidating,
  onExecute,
  onCancel,
  onStartValidation,
}) => {
  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState message="Carregando detalhes da transferência..." />
      </PageContainer>
    );
  }

  if (!transfer) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-32">
          <Package className="mb-4 h-10 w-10 text-neutral-600" strokeWidth={2} />
          <p className="text-sm font-bold text-white">Transferência não encontrada</p>
          <p className="mt-1 text-xs text-neutral-500">
            Verifique o ID e tente novamente.
          </p>
        </div>
      </PageContainer>
    );
  }

  const status = statusConfig[transfer.status] || statusConfig[TransferStatus.DRAFT];
  const getItemQty = (item: { quantity?: number; quantitySent?: number }) =>
    item.quantity ?? item.quantitySent ?? 0;
  const totalQuantity = transfer.items.reduce((acc, item) => acc + getItemQty(item), 0);
  const hasActions =
    (isSource && transfer.status === TransferStatus.DRAFT) ||
    (isSource && transfer.status === TransferStatus.IN_TRANSIT) ||
    (isDestination && transfer.status === TransferStatus.IN_TRANSIT) ||
    (isDestination &&
      (transfer.status === TransferStatus.PENDING_VALIDATION ||
        transfer.status === TransferStatus.IN_VALIDATION)) ||
    transfer.status === TransferStatus.COMPLETED ||
    transfer.status === TransferStatus.CANCELLED;

  return (
    <PageContainer bottomPadding={hasActions ? "fixed-bar" : "default"}>
      <PageHeader
        title={transfer.code}
        subtitle="Detalhes da Transferência"
        actions={
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-[4px] border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest",
                status.bg,
                status.text
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
              {status.label}
            </span>
          </div>
        }
      />

      {/* ── Route Card ── */}
      <div className="mb-8 rounded-[4px] border border-neutral-800 bg-[#171717] p-5 sm:p-6">
        {/* Route visual */}
        <div className="flex flex-col items-stretch gap-0 sm:flex-row sm:items-center sm:gap-0">
          {/* Origin node */}
          <div className="flex flex-1 items-start gap-4 sm:items-center">
            <div className="relative flex flex-col items-center">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-[4px] border",
                  isSource
                    ? "border-blue-600/50 bg-blue-600/10 text-blue-400"
                    : "border-neutral-700 bg-neutral-800 text-neutral-400"
                )}
              >
                <Warehouse className="h-5 w-5" strokeWidth={2} />
              </div>
              {/* Vertical connector (mobile only) */}
              <div className="mt-1 h-6 w-px bg-neutral-700 sm:hidden" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                Origem
              </p>
              <p className="mt-0.5 truncate text-base font-bold text-white">
                {transfer.sourceWarehouseName}
              </p>
              {isSource && (
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-blue-500">
                  Seu depósito
                </p>
              )}
            </div>
          </div>

          {/* Route connector */}
          <div className="flex items-center justify-center py-1 sm:px-6 sm:py-0">
            {/* Desktop: horizontal dashed line + truck */}
            <div className="hidden items-center gap-0 sm:flex">
              <div className="h-px w-8 border-t border-dashed border-neutral-700" />
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border",
                  transfer.status === TransferStatus.IN_TRANSIT
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                    : transfer.status === TransferStatus.COMPLETED
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                      : "border-neutral-700 bg-neutral-800/50 text-neutral-500"
                )}
              >
                {transfer.status === TransferStatus.COMPLETED ? (
                  <CheckCircle className="h-4 w-4" strokeWidth={2.5} />
                ) : transfer.status === TransferStatus.CANCELLED ? (
                  <XCircle className="h-4 w-4" strokeWidth={2.5} />
                ) : (
                  <Truck className="h-4 w-4" strokeWidth={2} />
                )}
              </div>
              <div className="h-px w-8 border-t border-dashed border-neutral-700" />
            </div>

            {/* Mobile: vertical connector with icon */}
            <div className="flex flex-col items-center sm:hidden">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border",
                  transfer.status === TransferStatus.IN_TRANSIT
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                    : transfer.status === TransferStatus.COMPLETED
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                      : "border-neutral-700 bg-neutral-800/50 text-neutral-500"
                )}
              >
                {transfer.status === TransferStatus.COMPLETED ? (
                  <CheckCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
                ) : transfer.status === TransferStatus.CANCELLED ? (
                  <XCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
                ) : (
                  <ArrowRight className="h-3.5 w-3.5 rotate-90" strokeWidth={2.5} />
                )}
              </div>
              <div className="h-6 w-px bg-neutral-700" />
            </div>
          </div>

          {/* Destination node */}
          <div className="flex flex-1 items-start gap-4 sm:items-center sm:justify-end">
            <div className="order-1 min-w-0 flex-1 sm:order-none sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                Destino
              </p>
              <p className="mt-0.5 truncate text-base font-bold text-white">
                {transfer.destinationWarehouseName}
              </p>
              {isDestination && (
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-blue-500">
                  Seu depósito
                </p>
              )}
            </div>
            <div
              className={cn(
                "order-0 flex h-12 w-12 items-center justify-center rounded-[4px] border sm:order-none",
                isDestination
                  ? "border-blue-600/50 bg-blue-600/10 text-blue-400"
                  : "border-neutral-700 bg-neutral-800 text-neutral-400"
              )}
            >
              <MapPin className="h-5 w-5" strokeWidth={2} />
            </div>
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-neutral-800 pt-5">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
            <span>
              Criado em{" "}
              <span className="font-medium text-neutral-300">
                {new Date(transfer.createdAt).toLocaleDateString()}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Package className="h-3.5 w-3.5" strokeWidth={2} />
            <span>
              <span className="font-mono font-bold tracking-tighter text-neutral-300">
                {transfer.items.length}
              </span>{" "}
              {transfer.items.length === 1 ? "item" : "itens"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Hash className="h-3.5 w-3.5" strokeWidth={2} />
            <span>
              Total{" "}
              <span className="font-mono font-bold tracking-tighter text-neutral-300">
                {totalQuantity}
              </span>{" "}
              unidades
            </span>
          </div>
        </div>

        {/* Notes */}
        {transfer.notes && (
          <div className="mt-5 border-t border-neutral-800 pt-5">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
              <FileText className="h-3.5 w-3.5" strokeWidth={2.5} />
              Observações
            </div>
            <p className="mt-2 text-sm leading-relaxed text-neutral-300">
              {transfer.notes}
            </p>
          </div>
        )}
      </div>

      {/* ── Items ── */}
      <SectionLabel icon={Package} className="mb-4">
        Itens da Transferência
      </SectionLabel>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {transfer.items.map((item) => (
          <div
            key={item.id}
            className="rounded-[4px] border border-neutral-800 bg-[#171717] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">
                  {item.productName || "Produto Desconhecido"}
                </p>
                {item.batchCode && (
                  <p className="mt-1 font-mono text-[10px] tracking-widest text-neutral-500">
                    Lote: {item.batchCode}
                  </p>
                )}
              </div>
              <span className="font-mono text-lg font-bold tracking-tighter text-white">
                {getItemQty(item)}
              </span>
            </div>
            {(item.quantitySent != null || item.quantityReceived != null) && (
              <div className="mt-3 flex gap-4 border-t border-neutral-800 pt-3">
                {item.quantitySent != null && (
                  <div className="text-xs text-neutral-500">
                    Enviado{" "}
                    <span className="font-mono font-bold tracking-tighter text-neutral-300">
                      {item.quantitySent}
                    </span>
                  </div>
                )}
                {item.quantityReceived != null && (
                  <div className="text-xs text-neutral-500">
                    Recebido{" "}
                    <span className="font-mono font-bold tracking-tighter text-emerald-400">
                      {item.quantityReceived}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <div className="rounded-[4px] border border-neutral-800 bg-[#171717]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  Produto
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  Lote
                </th>
                <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  Quantidade
                </th>
                {(transfer.status === TransferStatus.IN_VALIDATION ||
                  transfer.status === TransferStatus.PENDING_VALIDATION ||
                  transfer.status === TransferStatus.COMPLETED) && (
                  <>
                    <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                      Enviado
                    </th>
                    <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                      Recebido
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {transfer.items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-neutral-800 last:border-0"
                >
                  <td className="px-5 py-3.5 text-sm font-medium text-white">
                    {item.productName || "Produto Desconhecido"}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-neutral-400">
                    {item.batchCode || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-sm font-bold tracking-tighter text-white">
                    {getItemQty(item)}
                  </td>
                  {(transfer.status === TransferStatus.IN_VALIDATION ||
                    transfer.status === TransferStatus.PENDING_VALIDATION ||
                    transfer.status === TransferStatus.COMPLETED) && (
                    <>
                      <td className="px-5 py-3.5 text-right font-mono text-sm tracking-tighter text-neutral-400">
                        {item.quantitySent ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-sm font-bold tracking-tighter text-emerald-400">
                        {item.quantityReceived ?? "—"}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-neutral-700">
                <td className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  Total
                </td>
                <td />
                <td className="px-5 py-3 text-right font-mono text-sm font-bold tracking-tighter text-white">
                  {totalQuantity}
                </td>
                {(transfer.status === TransferStatus.IN_VALIDATION ||
                  transfer.status === TransferStatus.PENDING_VALIDATION ||
                  transfer.status === TransferStatus.COMPLETED) && (
                  <>
                    <td className="px-5 py-3 text-right font-mono text-sm tracking-tighter text-neutral-400">
                      {transfer.items.reduce(
                        (acc, i) => acc + (i.quantitySent ?? 0),
                        0
                      ) || "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-sm font-bold tracking-tighter text-emerald-400">
                      {transfer.items.reduce(
                        (acc, i) => acc + (i.quantityReceived ?? 0),
                        0
                      ) || "—"}
                    </td>
                  </>
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Action Footer ── */}
      {hasActions && (
        <FixedBottomBar>
          <div className="mx-auto flex max-w-7xl items-center justify-end gap-3">
            {/* Source DRAFT actions */}
            {isSource && transfer.status === TransferStatus.DRAFT && (
              <>
                <Link href={`/transfers/${transfer.id}/edit`}>
                  <Button
                    variant="ghost"
                    className="h-10 rounded-[4px] text-xs font-bold uppercase tracking-wide text-neutral-400 hover:text-white"
                  >
                    <Edit className="mr-2 h-4 w-4" strokeWidth={2} />
                    Editar
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isCancelling}
                  className="h-10 rounded-[4px] border-neutral-700 text-xs font-bold uppercase tracking-wide text-neutral-300 hover:border-rose-900 hover:bg-rose-900/20 hover:text-rose-500"
                >
                  {isCancelling ? "Cancelando..." : "CANCELAR"}
                </Button>
                <Button
                  onClick={onExecute}
                  disabled={isExecuting}
                  className="h-10 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
                >
                  {isExecuting ? "Processando..." : "EXECUTAR TRANSFERÊNCIA"}
                </Button>
              </>
            )}

            {/* Source IN_TRANSIT actions */}
            {isSource && transfer.status === TransferStatus.IN_TRANSIT && (
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isCancelling}
                className="h-10 rounded-[4px] border-neutral-700 text-xs font-bold uppercase tracking-wide text-neutral-300 hover:border-rose-900 hover:bg-rose-900/20 hover:text-rose-500"
              >
                {isCancelling ? "Cancelando..." : "CANCELAR TRANSFERÊNCIA"}
              </Button>
            )}

            {/* Destination IN_TRANSIT actions */}
            {isDestination && transfer.status === TransferStatus.IN_TRANSIT && (
              <Button
                onClick={onStartValidation}
                disabled={isValidating}
                className="h-10 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
              >
                <ShieldCheck className="mr-2 h-4 w-4" strokeWidth={2} />
                {isValidating ? "Iniciando..." : "INICIAR VALIDAÇÃO"}
              </Button>
            )}

            {/* Destination PENDING / IN_VALIDATION */}
            {isDestination &&
              (transfer.status === TransferStatus.PENDING_VALIDATION ||
                transfer.status === TransferStatus.IN_VALIDATION) && (
                <Link href={`/transfers/${transfer.id}/validate`}>
                  <Button className="h-10 rounded-[4px] bg-amber-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-amber-700">
                    <ShieldCheck className="mr-2 h-4 w-4" strokeWidth={2} />
                    CONTINUAR VALIDAÇÃO
                  </Button>
                </Link>
              )}

            {/* Completed */}
            {transfer.status === TransferStatus.COMPLETED && (
              <>
                <div className="flex items-center gap-2 px-4 text-sm font-medium text-emerald-500">
                  <CheckCircle className="h-5 w-5" strokeWidth={2} />
                  Transferência Concluída
                </div>
                {isDestination && (
                  <Button
                    variant="outline"
                    className="h-10 rounded-[4px] border-neutral-700 text-xs font-bold uppercase tracking-wide text-neutral-300 hover:text-white"
                  >
                    VER RELATÓRIO
                  </Button>
                )}
              </>
            )}

            {/* Cancelled */}
            {transfer.status === TransferStatus.CANCELLED && (
              <div className="flex items-center gap-2 px-4 text-sm font-medium text-rose-500">
                <XCircle className="h-5 w-5" strokeWidth={2} />
                Transferência Cancelada
              </div>
            )}
          </div>
        </FixedBottomBar>
      )}
    </PageContainer>
  );
};
