import Link from "next/link";
import type { ReactNode } from "react";
import { format, parseISO } from "date-fns";
import {
  Calendar,
  CheckCircle,
  Edit,
  FileText,
  Hash,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
  Warehouse,
  XCircle,
} from "lucide-react";
import { PermissionGate } from "@/components/permission-gate";
import { Button } from "@/components/ui/button";
import { FixedBottomBar } from "@/components/ui/fixed-bottom-bar";
import { LoadingState } from "@/components/ui/loading-state";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/utils";
import type { TransferDetailViewProps } from "./transfer-detail.types";
import { TransferStatus, type Transfer } from "../transfers.types";

interface TransferStatusStyle {
  dot: string;
  bg: string;
  text: string;
  label: string;
}

interface TransferDetailViewState extends TransferDetailViewProps {
  hasActions: boolean;
  status: TransferStatusStyle;
  totalQuantity: number;
  transfer: Transfer;
}

const statusConfig: Record<TransferStatus, TransferStatusStyle> = {
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
    label: "EM VALIDAÇÃO",
  },
  [TransferStatus.COMPLETED]: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    text: "text-emerald-400",
    label: "CONCLUÍDA",
  },
  [TransferStatus.COMPLETED_WITH_DISCREPANCY]: {
    dot: "bg-amber-500",
    bg: "bg-amber-500/10 border-amber-500/30",
    text: "text-amber-400",
    label: "CONCLUÍDA C/ DIVERGÊNCIA",
  },
  [TransferStatus.CANCELLED]: {
    dot: "bg-rose-500",
    bg: "bg-rose-500/10 border-rose-500/30",
    text: "text-rose-400",
    label: "CANCELADA",
  },
};

export const TransferDetailView = (props: TransferDetailViewProps) => {
  const { isLoading, transfer } = props;

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState message="Carregando detalhes da transferência..." />
      </PageContainer>
    );
  }

  if (!transfer) {
    return <TransferMissingState />;
  }

  const totalQuantity = transfer.items.reduce(
    (acc, item) => acc + getTransferItemQty(item),
    0,
  );
  const viewState: TransferDetailViewState = {
    ...props,
    transfer,
    status: statusConfig[transfer.status] || statusConfig[TransferStatus.DRAFT],
    totalQuantity,
    hasActions: shouldShowTransferActions(props, transfer),
  };

  return (
    <PageContainer bottomPadding={viewState.hasActions ? "fixed-bar" : "default"}>
      <TransferDetailHeader viewState={viewState} />
      <TransferRouteCard viewState={viewState} />
      <TransferItemsSection viewState={viewState} />
      <TransferActionFooter viewState={viewState} />
    </PageContainer>
  );
};

function getTransferItemQty(item: Transfer["items"][number]) {
  return item.quantity ?? item.quantitySent ?? 0;
}

function shouldShowTransferActions(
  props: TransferDetailViewProps,
  transfer: Transfer,
) {
  return (
    (props.isSource && transfer.status === TransferStatus.DRAFT) ||
    (props.isSource && transfer.status === TransferStatus.IN_TRANSIT) ||
    (props.isDestination && transfer.status === TransferStatus.IN_TRANSIT) ||
    (props.isDestination &&
      transfer.status === TransferStatus.PENDING_VALIDATION) ||
    transfer.status === TransferStatus.COMPLETED ||
    transfer.status === TransferStatus.COMPLETED_WITH_DISCREPANCY ||
    transfer.status === TransferStatus.CANCELLED
  );
}

function shouldShowValidationQuantities(status: TransferStatus) {
  return (
    status === TransferStatus.COMPLETED_WITH_DISCREPANCY ||
    status === TransferStatus.PENDING_VALIDATION ||
    status === TransferStatus.COMPLETED
  );
}

function TransferMissingState() {
  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center py-32">
        <Package className="mb-4 size-10 text-neutral-600" strokeWidth={2} />
        <p className="text-sm font-bold text-white">
          Transferência não encontrada
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          Verifique o ID e tente novamente.
        </p>
      </div>
    </PageContainer>
  );
}

function TransferDetailHeader({
  viewState,
}: {
  viewState: TransferDetailViewState;
}) {
  const { status, transfer } = viewState;

  return (
    <PageHeader
      title={transfer.code}
      subtitle="Detalhes da Transferência"
      actions={
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-[4px] border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest",
              status.bg,
              status.text,
            )}
          >
            <span className={cn("size-1.5 rounded-[4px]", status.dot)} />
            {status.label}
          </span>
        </div>
      }
    />
  );
}

function TransferRouteCard({
  viewState,
}: {
  viewState: TransferDetailViewState;
}) {
  const { transfer } = viewState;

  return (
    <div className="mb-8 rounded-[4px] border border-neutral-800 bg-[#171717] p-5 sm:p-6">
      <div className="flex flex-col items-stretch gap-0 sm:flex-row sm:items-center">
        <TransferOriginNode viewState={viewState} />
        <TransferRouteConnector transfer={transfer} />
        <TransferDestinationNode viewState={viewState} />
      </div>
      <TransferRouteMeta viewState={viewState} />
      <TransferNotes transfer={transfer} />
    </div>
  );
}

function TransferOriginNode({
  viewState,
}: {
  viewState: TransferDetailViewState;
}) {
  const { isSource, transfer } = viewState;

  return (
    <div className="flex flex-1 items-start gap-4 sm:items-center">
      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            "flex size-12 items-center justify-center rounded-[4px] border",
            isSource
              ? "border-blue-600/50 bg-blue-600/10 text-blue-400"
              : "border-neutral-700 bg-neutral-800 text-neutral-400",
          )}
        >
          <Warehouse className="size-5" strokeWidth={2} />
        </div>
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
  );
}

function TransferRouteConnector({ transfer }: { transfer: Transfer }) {
  return (
    <div className="flex items-center justify-center py-1 sm:px-6 sm:py-0">
      <div className="hidden items-center gap-0 sm:flex">
        <div className="h-px w-8 border-t border-dashed border-neutral-700" />
        <TransferRouteStatusIcon transfer={transfer} sizeClassName="size-10" />
        <div className="h-px w-8 border-t border-dashed border-neutral-700" />
      </div>
      <div className="flex flex-col items-center sm:hidden">
        <TransferRouteStatusIcon transfer={transfer} sizeClassName="size-8" />
        <div className="h-6 w-px bg-neutral-700" />
      </div>
    </div>
  );
}

function TransferRouteStatusIcon({
  sizeClassName,
  transfer,
}: {
  sizeClassName: string;
  transfer: Transfer;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-[4px] border",
        sizeClassName,
        transfer.status === TransferStatus.IN_TRANSIT
          ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
          : transfer.status === TransferStatus.COMPLETED
            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
            : "border-neutral-700 bg-neutral-800/50 text-neutral-500",
      )}
    >
      <TransferRouteStatusGlyph transfer={transfer} />
    </div>
  );
}

function TransferRouteStatusGlyph({ transfer }: { transfer: Transfer }) {
  if (transfer.status === TransferStatus.COMPLETED) {
    return <CheckCircle className="size-4" strokeWidth={2.5} />;
  }

  if (transfer.status === TransferStatus.CANCELLED) {
    return <XCircle className="size-4" strokeWidth={2.5} />;
  }

  return <Truck className="size-4" strokeWidth={2} />;
}

function TransferDestinationNode({
  viewState,
}: {
  viewState: TransferDetailViewState;
}) {
  const { isDestination, transfer } = viewState;

  return (
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
          "order-0 flex size-12 items-center justify-center rounded-[4px] border sm:order-none",
          isDestination
            ? "border-blue-600/50 bg-blue-600/10 text-blue-400"
            : "border-neutral-700 bg-neutral-800 text-neutral-400",
        )}
      >
        <MapPin className="size-5" strokeWidth={2} />
      </div>
    </div>
  );
}

function TransferRouteMeta({
  viewState,
}: {
  viewState: TransferDetailViewState;
}) {
  const { totalQuantity, transfer } = viewState;

  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-neutral-800 pt-5">
      <TransferMetaItem icon={<Calendar className="size-3.5" strokeWidth={2} />}>
        Criado em{" "}
        <span className="font-medium text-neutral-300">
          {format(parseISO(transfer.createdAt), "dd/MM/yyyy")}
        </span>
      </TransferMetaItem>
      <TransferMetaItem icon={<Package className="size-3.5" strokeWidth={2} />}>
        <span className="font-mono font-bold tracking-tighter text-neutral-300">
          {transfer.items.length}
        </span>{" "}
        {transfer.items.length === 1 ? "item" : "itens"}
      </TransferMetaItem>
      <TransferMetaItem icon={<Hash className="size-3.5" strokeWidth={2} />}>
        Total{" "}
        <span className="font-mono font-bold tracking-tighter text-neutral-300">
          {totalQuantity}
        </span>{" "}
        unidades
      </TransferMetaItem>
    </div>
  );
}

function TransferMetaItem({
  children,
  icon,
}: {
  children: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-neutral-500">
      {icon}
      <span>{children}</span>
    </div>
  );
}

function TransferNotes({ transfer }: { transfer: Transfer }) {
  if (!transfer.notes) return null;

  return (
    <div className="mt-5 border-t border-neutral-800 pt-5">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
        <FileText className="size-3.5" strokeWidth={2.5} />
        Observações
      </div>
      <p className="mt-2 text-sm leading-relaxed text-neutral-300">
        {transfer.notes}
      </p>
    </div>
  );
}

function TransferItemsSection({
  viewState,
}: {
  viewState: TransferDetailViewState;
}) {
  return (
    <>
      <SectionLabel icon={Package} className="mb-4">
        Itens da Transferência
      </SectionLabel>
      <TransferItemsMobileList transfer={viewState.transfer} />
      <TransferItemsDesktopTable viewState={viewState} />
    </>
  );
}

function TransferItemsMobileList({ transfer }: { transfer: Transfer }) {
  return (
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
              {getTransferItemQty(item)}
            </span>
          </div>
          <TransferItemValidationSummary item={item} />
        </div>
      ))}
    </div>
  );
}

function TransferItemValidationSummary({
  item,
}: {
  item: Transfer["items"][number];
}) {
  if (item.quantitySent == null && item.quantityReceived == null) return null;

  return (
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
  );
}

function TransferItemsDesktopTable({
  viewState,
}: {
  viewState: TransferDetailViewState;
}) {
  const { totalQuantity, transfer } = viewState;
  const showValidationColumns = shouldShowValidationQuantities(transfer.status);

  return (
    <div className="hidden md:block">
      <div className="rounded-[4px] border border-neutral-800 bg-[#171717]">
        <table className="w-full">
          <TransferItemsTableHeader showValidationColumns={showValidationColumns} />
          <tbody>
            {transfer.items.map((item) => (
              <TransferItemTableRow
                key={item.id}
                item={item}
                showValidationColumns={showValidationColumns}
              />
            ))}
          </tbody>
          <TransferItemsTableFooter
            showValidationColumns={showValidationColumns}
            totalQuantity={totalQuantity}
            transfer={transfer}
          />
        </table>
      </div>
    </div>
  );
}

function TransferItemsTableHeader({
  showValidationColumns,
}: {
  showValidationColumns: boolean;
}) {
  return (
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
        {showValidationColumns && (
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
  );
}

function TransferItemTableRow({
  item,
  showValidationColumns,
}: {
  item: Transfer["items"][number];
  showValidationColumns: boolean;
}) {
  return (
    <tr className="border-b border-neutral-800 last:border-0">
      <td className="px-5 py-3.5 text-sm font-medium text-white">
        {item.productName || "Produto Desconhecido"}
      </td>
      <td className="px-5 py-3.5 font-mono text-xs text-neutral-400">
        {item.batchCode || "—"}
      </td>
      <td className="px-5 py-3.5 text-right font-mono text-sm font-bold tracking-tighter text-white">
        {getTransferItemQty(item)}
      </td>
      {showValidationColumns && (
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
  );
}

function TransferItemsTableFooter({
  showValidationColumns,
  totalQuantity,
  transfer,
}: {
  showValidationColumns: boolean;
  totalQuantity: number;
  transfer: Transfer;
}) {
  return (
    <tfoot>
      <tr className="border-t border-neutral-700">
        <td className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          Total
        </td>
        <td />
        <td className="px-5 py-3 text-right font-mono text-sm font-bold tracking-tighter text-white">
          {totalQuantity}
        </td>
        {showValidationColumns && (
          <>
            <td className="px-5 py-3 text-right font-mono text-sm tracking-tighter text-neutral-400">
              {sumSentQuantity(transfer) || "—"}
            </td>
            <td className="px-5 py-3 text-right font-mono text-sm font-bold tracking-tighter text-emerald-400">
              {sumReceivedQuantity(transfer) || "—"}
            </td>
          </>
        )}
      </tr>
    </tfoot>
  );
}

function sumSentQuantity(transfer: Transfer) {
  return transfer.items.reduce((acc, item) => acc + (item.quantitySent ?? 0), 0);
}

function sumReceivedQuantity(transfer: Transfer) {
  return transfer.items.reduce(
    (acc, item) => acc + (item.quantityReceived ?? 0),
    0,
  );
}

function TransferActionFooter({
  viewState,
}: {
  viewState: TransferDetailViewState;
}) {
  if (!viewState.hasActions) return null;

  return (
    <FixedBottomBar>
      <div className="mx-auto flex max-w-7xl items-center justify-end gap-3">
        <TransferDraftActions viewState={viewState} />
        <TransferInTransitSourceAction viewState={viewState} />
        <TransferInTransitDestinationAction viewState={viewState} />
        <TransferPendingValidationAction viewState={viewState} />
        <TransferCompletedAction viewState={viewState} />
        <TransferCompletedDiscrepancyAction viewState={viewState} />
        <TransferCancelledAction transfer={viewState.transfer} />
      </div>
    </FixedBottomBar>
  );
}

function TransferDraftActions({
  viewState,
}: {
  viewState: TransferDetailViewState;
}) {
  const { isCancelling, isExecuting, isSource, onCancel, onExecute, transfer } =
    viewState;

  if (!isSource || transfer.status !== TransferStatus.DRAFT) return null;

  return (
    <>
      <PermissionGate permission="transfers:update">
        <Link href={`/transfers/${transfer.id}/edit`}>
          <Button
            variant="ghost"
            className="h-10 rounded-[4px] text-xs font-bold uppercase tracking-wide text-neutral-400 hover:text-white"
          >
            <Edit className="mr-2 size-4" strokeWidth={2} />
            Editar
          </Button>
        </Link>
      </PermissionGate>
      <PermissionGate permission="transfers:delete">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isCancelling}
          className="h-10 rounded-[4px] border-neutral-700 text-xs font-bold uppercase tracking-wide text-neutral-300 hover:border-rose-900 hover:bg-neutral-800 hover:text-rose-500"
        >
          {isCancelling ? "Cancelando..." : "CANCELAR"}
        </Button>
      </PermissionGate>
      <PermissionGate permission="transfers:update">
        <Button
          onClick={onExecute}
          disabled={isExecuting}
          className="h-10 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
        >
          {isExecuting ? "Processando..." : "EXECUTAR TRANSFERÊNCIA"}
        </Button>
      </PermissionGate>
    </>
  );
}

function TransferInTransitSourceAction({
  viewState,
}: {
  viewState: TransferDetailViewState;
}) {
  const { isCancelling, isSource, onCancel, transfer } = viewState;

  if (!isSource || transfer.status !== TransferStatus.IN_TRANSIT) return null;

  return (
    <PermissionGate permission="transfers:delete">
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={isCancelling}
        className="h-10 rounded-[4px] border-neutral-700 text-xs font-bold uppercase tracking-wide text-neutral-300 hover:border-rose-900 hover:bg-neutral-800 hover:text-rose-500"
      >
        {isCancelling ? "Cancelando..." : "CANCELAR TRANSFERÊNCIA"}
      </Button>
    </PermissionGate>
  );
}

function TransferInTransitDestinationAction({
  viewState,
}: {
  viewState: TransferDetailViewState;
}) {
  const { isDestination, isValidating, onStartValidation, transfer } = viewState;

  if (!isDestination || transfer.status !== TransferStatus.IN_TRANSIT) {
    return null;
  }

  return (
    <PermissionGate permission="transfers:update">
      <Button
        onClick={onStartValidation}
        disabled={isValidating}
        className="h-10 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
      >
        <ShieldCheck className="mr-2 size-4" strokeWidth={2} />
        {isValidating ? "Iniciando..." : "INICIAR VALIDAÇÃO"}
      </Button>
    </PermissionGate>
  );
}

function TransferPendingValidationAction({
  viewState,
}: {
  viewState: TransferDetailViewState;
}) {
  const { isDestination, transfer } = viewState;

  if (
    !isDestination ||
    transfer.status !== TransferStatus.PENDING_VALIDATION
  ) {
    return null;
  }

  return (
    <PermissionGate permission="transfers:update">
      <Link href={`/transfers/${transfer.id}/validate`}>
        <Button className="h-10 rounded-[4px] bg-amber-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-amber-700">
          <ShieldCheck className="mr-2 size-4" strokeWidth={2} />
          CONTINUAR VALIDAÇÃO
        </Button>
      </Link>
    </PermissionGate>
  );
}

function TransferCompletedAction({
  viewState,
}: {
  viewState: TransferDetailViewState;
}) {
  const { isDestination, transfer } = viewState;

  if (transfer.status !== TransferStatus.COMPLETED) return null;

  return (
    <>
      <div className="flex items-center gap-2 px-4 text-sm font-medium text-emerald-500">
        <CheckCircle className="size-5" strokeWidth={2} />
        Transferência Concluída
      </div>
      {isDestination && <TransferReportButton />}
    </>
  );
}

function TransferCompletedDiscrepancyAction({
  viewState,
}: {
  viewState: TransferDetailViewState;
}) {
  const { isDestination, transfer } = viewState;

  if (transfer.status !== TransferStatus.COMPLETED_WITH_DISCREPANCY) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2 px-4 text-sm font-medium text-amber-500">
        <CheckCircle className="size-5" strokeWidth={2} />
        Concluída com Divergência
      </div>
      {isDestination && <TransferReportButton />}
    </>
  );
}

function TransferReportButton() {
  return (
    <Button
      variant="outline"
      className="h-10 rounded-[4px] border-neutral-700 text-xs font-bold uppercase tracking-wide text-neutral-300 hover:text-white"
    >
      VER RELATÓRIO
    </Button>
  );
}

function TransferCancelledAction({ transfer }: { transfer: Transfer }) {
  if (transfer.status !== TransferStatus.CANCELLED) return null;

  return (
    <div className="flex items-center gap-2 px-4 text-sm font-medium text-rose-500">
      <XCircle className="size-5" strokeWidth={2} />
      Transferência Cancelada
    </div>
  );
}
