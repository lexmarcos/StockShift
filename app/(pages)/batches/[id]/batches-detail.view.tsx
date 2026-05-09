"use client";

import Link from "next/link";
import {
  Barcode,
  Clock,
  DollarSign,
  FileText,
  Layers,
  MapPin,
  Package,
  Tag,
  Warehouse,
  ExternalLink,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Batch } from "../batches.types";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import {
  BatchActions,
  LedgerItem,
  LOW_STOCK_THRESHOLD,
  MetricTile,
  StatusBadge,
  TimelineStep,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatOptionalText,
  getBatchCode,
  getBatchState,
  getCurrencyTotal,
  getExpirationDetail,
  getExpirationDistance,
  getMarginClass,
  getMarginLabel,
  getStockMeterWidth,
} from "./batches-detail.components";

interface BatchesDetailViewProps {
  batch: Batch | null;
  isLoading: boolean;
  error: Error | null;
  isDeleteOpen: boolean;
  onDeleteOpenChange: (open: boolean) => void;
  isDeleting: boolean;
  onDelete: () => void;
}

export const BatchesDetailView = ({
  batch,
  isLoading,
  error,
  isDeleteOpen,
  onDeleteOpenChange,
  isDeleting,
  onDelete,
}: BatchesDetailViewProps) => {
  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState message="Carregando lote..." />
      </PageContainer>
    );
  }

  if (error || !batch) {
    return (
      <PageContainer>
        <ErrorState
          title="Lote não encontrado"
          description="O lote que você procura não existe ou foi removido do sistema."
        />
      </PageContainer>
    );
  }

  const daysToExpire = getExpirationDistance(batch.expirationDate);
  const batchState = getBatchState(batch, daysToExpire);
  const batchCode = getBatchCode(batch);
  const stockMeterWidth = getStockMeterWidth(batch.quantity);
  const marginClass = getMarginClass(batch.costPrice, batch.sellingPrice);
  const BatchStateIcon = batchState.Icon;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`, {
      className: "bg-[#171717] border-neutral-800 text-white rounded-[4px]",
      descriptionClassName: "text-neutral-400",
    });
  };

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title={batchCode}
        subtitle="Detalhe do lote"
        actions={
          <BatchActions
            batch={batch}
            isDeleteOpen={isDeleteOpen}
            onDeleteOpenChange={onDeleteOpenChange}
            isDeleting={isDeleting}
            onDelete={onDelete}
          />
        }
      />

      {/* Row 1: Hero — Product Link + Stock Meter */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Product Info + Batch Identification */}
        <div className="lg:col-span-7 rounded-[4px] border border-neutral-800 bg-[#171717] p-6">
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <StatusBadge state={batchState} />
            <span className="rounded-[4px] border border-neutral-800 bg-neutral-950 px-2.5 py-1 font-mono text-[11px] text-neutral-400">
              {batchCode}
            </span>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">
            Produto vinculado
          </p>
          <Link href={`/products/${batch.productId}`} className="group block">
            <h2 className="break-words text-2xl font-bold text-white md:text-3xl">
              {batch.productName}
            </h2>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-neutral-500 group-hover:text-blue-400">
              <ExternalLink className="h-3 w-3" />
              Abrir produto
            </span>
          </Link>

          {/* Ledger Row */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <LedgerItem
              icon={Barcode}
              label="SKU"
              value={formatOptionalText(batch.productSku)}
            />
            <LedgerItem
              icon={Warehouse}
              label="Armazém"
              value={batch.warehouseName}
            />
            <LedgerItem
              icon={Tag}
              label="Código do armazém"
              value={formatOptionalText(batch.warehouseCode)}
            />
          </div>
        </div>

        {/* Stock Meter Panel */}
        <div
          className={cn(
            "lg:col-span-5 rounded-[4px] border p-6 flex flex-col justify-between",
            batchState.panelClass
          )}
        >
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  Estoque atual
                </p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="font-mono text-6xl font-bold leading-none tabular-nums text-white">
                    {batch.quantity}
                  </span>
                  <span className="pb-1 text-sm font-bold uppercase text-neutral-500">
                    un.
                  </span>
                </div>
              </div>
              <BatchStateIcon
                className={cn("h-8 w-8 shrink-0", batchState.textClass)}
              />
            </div>

            {/* Meter Bar */}
            <div className="mt-6 h-2.5 rounded-[4px] border border-neutral-800 bg-neutral-950 overflow-hidden">
              <div
                className={cn("h-full rounded-[4px]", batchState.meterClass)}
                style={{ width: `${stockMeterWidth}%` }}
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-neutral-800 pt-4">
            <span className={cn("text-sm font-bold", batchState.textClass)}>
              {batchState.description}
            </span>
            <span className="text-xs text-neutral-500">
              {getExpirationDetail(daysToExpire)}
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Financial Metrics */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          icon={DollarSign}
          label="Custo unitário"
          value={formatCurrency(batch.costPrice)}
          detail={getCurrencyTotal(batch.costPrice, batch.quantity)}
          toneClass="border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
        />
        <MetricTile
          icon={DollarSign}
          label="Venda unitária"
          value={formatCurrency(batch.sellingPrice)}
          detail={getCurrencyTotal(batch.sellingPrice, batch.quantity)}
          toneClass="border-blue-500/20 bg-blue-500/10 text-blue-400"
        />
        <MetricTile
          icon={Layers}
          label="Margem estimada"
          value={getMarginLabel(batch.costPrice, batch.sellingPrice)}
          detail="Diferença entre venda e custo"
          toneClass="border-amber-500/20 bg-amber-500/10 text-amber-400"
          valueClass={marginClass}
        />
        <MetricTile
          icon={Package}
          label="Unidades"
          value={`${batch.quantity}`}
          detail={`Limite baixo: ${LOW_STOCK_THRESHOLD} un.`}
          toneClass="border-neutral-700 bg-neutral-900 text-neutral-400"
        />
      </div>

      {/* Row 3: Location · Lifecycle · Notes */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Location */}
        <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-5">
          <div className="mb-5 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">
              Localização
            </h3>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
            Warehouse
          </p>
          <p className="break-words text-xl font-bold text-white">
            {batch.warehouseName}
          </p>

          <div className="mt-5 border-t border-neutral-800 pt-4">
            <span className="inline-flex rounded-[4px] border border-neutral-700 bg-neutral-950 px-2.5 py-1 font-mono text-[11px] text-neutral-400">
              COD: {formatOptionalText(batch.warehouseCode)}
            </span>
          </div>
        </div>

        {/* Lifecycle / Timeline */}
        <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-5">
          <div className="mb-5 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">
              Ciclo de vida
            </h3>
          </div>

          <div className="grid gap-5 border-l border-neutral-800">
            <TimelineStep
              label="Fabricação"
              value={formatDate(batch.manufacturedDate)}
              detail="Data informada na origem"
              toneClass="bg-neutral-600"
            />
            <TimelineStep
              label="Registro"
              value={formatDate(batch.createdAt)}
              detail={formatDateTime(batch.createdAt)}
              toneClass="bg-blue-500"
            />
            <TimelineStep
              label="Validade"
              value={formatDate(batch.expirationDate)}
              detail={getExpirationDetail(daysToExpire)}
              toneClass={batchState.meterClass}
            />
            <TimelineStep
              label="Atualização"
              value={formatDate(batch.updatedAt)}
              detail={formatDateTime(batch.updatedAt)}
              toneClass="bg-neutral-500"
            />
          </div>
        </div>

        {/* Notes + IDs */}
        <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-5">
          <div className="mb-5 flex items-center gap-2">
            <FileText className="h-4 w-4 text-neutral-300" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">
              Observações
            </h3>
          </div>

          <div className="min-h-24 rounded-[4px] border border-neutral-800 bg-neutral-950 p-4">
            <p className="whitespace-pre-wrap text-sm leading-6 text-neutral-300">
              {formatOptionalText(batch.notes)}
            </p>
          </div>

          <div className="mt-4 space-y-2">
            <IdField
              label="ID do Lote"
              value={batch.id}
              onCopy={() => copyToClipboard(batch.id, "ID do Lote")}
            />
            <IdField
              label="ID do Produto"
              value={batch.productId}
              onCopy={() => copyToClipboard(batch.productId, "ID do Produto")}
            />
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

/* ─── Helper: ID Row ─── */

function IdField({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-[4px] border border-neutral-800 bg-neutral-900/40 p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 mb-1">
        {label}
      </p>
      <button
        onClick={onCopy}
        className="flex w-full items-center justify-between gap-2 group"
      >
        <span className="truncate font-mono text-xs text-neutral-400 group-hover:text-neutral-200">
          {value}
        </span>
        <Copy className="h-3 w-3 shrink-0 text-neutral-700 group-hover:text-neutral-400" />
      </button>
    </div>
  );
}
