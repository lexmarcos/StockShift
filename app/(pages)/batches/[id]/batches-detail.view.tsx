"use client";

import Link from "next/link";
import {
  Clock,
  DollarSign,
  ExternalLink,
  Layers,
  MapPin,
  Package,
  Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import {
  formatBatchDate,
  formatBatchDateTime,
  formatQuantityDisplay,
  LOW_STOCK_THRESHOLD,
} from "./batches-detail.model";
import {
  BatchActions,
  InfoRow,
  MetricTile,
  OriginSection,
  STATUS_ICON_MAP,
  StatusBadge,
  TimelineStep,
} from "./batches-detail.components";
import type { BatchDetailViewProps } from "./batches-detail.types";

export const BatchesDetailView = ({
  batch,
  isLoading,
  error,
  status,
  formattedCostPrice,
  formattedSellingPrice,
  formattedCostTotal,
  formattedSellingTotal,
  marginLabel,
  marginClass,
  stockMeterWidth,
  expirationLabel,
  isDeleteOpen,
  onDeleteOpenChange,
  isDeleting,
  onDelete,
}: BatchDetailViewProps) => {
  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState message="Carregando lote..." />
      </PageContainer>
    );
  }

  if (error || !batch || !status) {
    return (
      <PageContainer>
        <ErrorState
          title="Lote não encontrado"
          description="O lote que você procura não existe ou foi removido do sistema."
        />
      </PageContainer>
    );
  }

  const StatusIcon = STATUS_ICON_MAP[status.kind] ?? Package;

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title={batch.batchCode}
        subtitle="Detalhe do lote"
        actions={
          <BatchActions
            batchId={batch.id}
            isDeleteOpen={isDeleteOpen}
            onDeleteOpenChange={onDeleteOpenChange}
            isDeleting={isDeleting}
            onDelete={onDelete}
          />
        }
      />

      {/* Row 1: Hero — Product + Stock Meter */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Product Info + Identification */}
        <div className="lg:col-span-7 rounded-[4px] border border-neutral-800 bg-[#171717] p-6">
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <StatusBadge status={status} />
            <span className="rounded-[4px] border border-neutral-800 bg-neutral-950 px-2.5 py-1 font-mono text-[11px] text-neutral-400">
              {batch.batchCode}
            </span>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">
            Produto vinculado
          </p>
          <Link href={`/products/${batch.productId}`} className="group block">
            <h2 className="break-words text-2xl font-semibold text-white md:text-3xl">
              {batch.productName}
            </h2>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-neutral-500 group-hover:text-blue-400">
              <ExternalLink className="size-3" />
              Abrir produto
            </span>
          </Link>

          {/* Info Row */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <InfoRow
              icon={Warehouse}
              label="Armazém"
              value={batch.warehouseName}
            />
            <OriginSection
              movementId={batch.originStockMovementId}
              movementCode={batch.originStockMovementCode}
            />
            <InfoRow
              icon={MapPin}
              label="Armazém ID"
              value={batch.warehouseId.slice(0, 8) + "…"}
            />
          </div>
        </div>

        {/* Stock Meter Panel */}
        <div
          className={cn(
            "lg:col-span-5 rounded-[4px] border p-6 flex flex-col justify-between",
            status.panelClass,
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
                    {formatQuantityDisplay(batch.quantity)}
                  </span>
                  <span className="pb-1 text-sm font-bold uppercase text-neutral-500">
                    un.
                  </span>
                </div>
              </div>
              <StatusIcon
                className={cn("size-8 shrink-0", status.textClass)}
              />
            </div>

            {/* Meter Bar */}
            <div className="mt-6 h-2.5 rounded-[4px] border border-neutral-800 bg-neutral-950 overflow-hidden">
              <div
                className={cn("h-full rounded-[4px]", status.meterClass)}
                style={{ width: `${stockMeterWidth}%` }}
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-neutral-800 pt-4">
            <span className={cn("text-sm font-bold", status.textClass)}>
              {status.description}
            </span>
            <span className="text-xs text-neutral-500">
              {expirationLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Financial Metrics */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          icon={DollarSign}
          label="Custo unitário"
          value={formattedCostPrice}
          detail={formattedCostTotal}
          toneClass="border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
        />
        <MetricTile
          icon={DollarSign}
          label="Venda unitária"
          value={formattedSellingPrice}
          detail={formattedSellingTotal}
          toneClass="border-blue-500/20 bg-blue-500/10 text-blue-400"
        />
        <MetricTile
          icon={Layers}
          label="Margem estimada"
          value={marginLabel}
          detail="Diferença entre venda e custo"
          toneClass="border-amber-500/20 bg-amber-500/10 text-amber-400"
          valueClass={marginClass}
        />
        <MetricTile
          icon={Package}
          label="Unidades"
          value={formatQuantityDisplay(batch.quantity)}
          detail={`Limite baixo: ${LOW_STOCK_THRESHOLD} un.`}
          toneClass="border-neutral-700 bg-neutral-900 text-neutral-400"
        />
      </div>

      {/* Row 3: Location + Lifecycle */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Location */}
        <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-5">
          <div className="mb-5 flex items-center gap-2">
            <MapPin className="size-4 text-blue-400" />
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white">
              Localização
            </h3>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
            Armazém
          </p>
          <Link href={`/warehouses/${batch.warehouseId}`} className="group block">
            <p className="break-words text-xl font-bold text-white group-hover:text-blue-300">
              {batch.warehouseName}
            </p>
            <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-neutral-500 group-hover:text-blue-400">
              <ExternalLink className="size-3" />
              Abrir armazém
            </span>
          </Link>

          <div className="mt-5 border-t border-neutral-800 pt-4">
            <OriginSection
              movementId={batch.originStockMovementId}
              movementCode={batch.originStockMovementCode}
            />
          </div>
        </div>

        {/* Lifecycle / Timeline */}
        <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-5">
          <div className="mb-5 flex items-center gap-2">
            <Clock className="size-4 text-amber-400" />
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white">
              Ciclo de vida
            </h3>
          </div>

          <div className="grid gap-5 border-l border-neutral-800">
            <TimelineStep
              label="Fabricação"
              value={formatBatchDate(batch.manufacturedDate)}
              detail="Data informada na origem"
              toneClass="bg-neutral-600"
            />
            <TimelineStep
              label="Registro"
              value={formatBatchDate(batch.createdAt)}
              detail={formatBatchDateTime(batch.createdAt)}
              toneClass="bg-blue-500"
            />
            <TimelineStep
              label="Validade"
              value={formatBatchDate(batch.expirationDate)}
              detail={expirationLabel}
              toneClass={status.meterClass}
            />
            <TimelineStep
              label="Atualização"
              value={formatBatchDate(batch.updatedAt)}
              detail={formatBatchDateTime(batch.updatedAt)}
              toneClass="bg-neutral-500"
            />
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
