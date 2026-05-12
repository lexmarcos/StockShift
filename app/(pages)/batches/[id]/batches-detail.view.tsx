"use client";

import Link from "next/link";
import {
  Package,
  Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { FixedBottomBar } from "@/components/ui/fixed-bottom-bar";
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
  DateMeta,
  FinancialCell,
  HeroStat,
  InfoLink,
  MobileActions,
  OriginLink,
  STATUS_ICON_MAP,
  StatusBadge,
} from "./batches-detail.components";
import type { BatchDetailViewProps } from "./batches-detail.types";

export const BatchesDetailView = ({
  batch,
  isLoading,
  error,
  status,
  daysToExpire,
  formattedCostPrice,
  formattedSellingPrice,
  formattedCostTotal,
  formattedSellingTotal,
  marginLabel,
  marginClass,
  expirationLabel,
  isDeleteOpen,
  onDeleteOpenChange,
  isDeleting,
  onDelete,
}: BatchDetailViewProps) => {
  if (isLoading && !error) {
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
    <PageContainer bottomPadding="fixed-bar">
      {/* ── Header ── */}
      <PageHeader
        title={batch.productName}
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

      {/* ── Hero Card: Expiration + Stock ── */}
      <div
        className={cn(
          "mb-6 rounded-[4px] border p-5",
          status.panelClass,
        )}
      >
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <StatusBadge status={status} />
          <span className="rounded-[4px] border border-neutral-800 bg-neutral-950 px-2.5 py-1 font-mono text-[11px] text-neutral-400 truncate max-w-[240px]">
            {batch.batchCode}
          </span>
        </div>

        {/* Main stats */}
        <div className="flex flex-col gap-5 sm:flex-row sm:gap-8">
          <HeroStat
            label="Validade"
            value={daysToExpire !== null ? `${Math.abs(daysToExpire)}` : "—"}
            unit={daysToExpire !== null && daysToExpire < 0 ? "dias atrás" : "dias"}
            detail={formatBatchDate(batch.expirationDate)}
            toneClass={status.textClass}
          />

          <div className="hidden sm:block w-px bg-neutral-800 self-stretch" />

          <HeroStat
            label="Estoque"
            value={formatQuantityDisplay(batch.quantity)}
            unit="un."
            detail={`Limite baixo: ${LOW_STOCK_THRESHOLD} un.`}
            toneClass="text-white"
          />
        </div>

        {/* Status footer */}
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-neutral-800 pt-4">
          <div className="flex items-center gap-2">
            <StatusIcon className={cn("size-4", status.textClass)} />
            <span className={cn("text-sm font-bold", status.textClass)}>
              {status.description}
            </span>
          </div>
          <span className="text-xs text-neutral-500">
            {expirationLabel}
          </span>
        </div>
      </div>

      {/* ── Financial Grid ── */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <FinancialCell
          label="Custo unitário"
          value={formattedCostPrice}
          detail={formattedCostTotal}
        />
        <FinancialCell
          label="Venda unitária"
          value={formattedSellingPrice}
          detail={formattedSellingTotal}
        />
        <FinancialCell
          label="Margem estimada"
          value={marginLabel}
          detail="Diferença entre venda e custo"
          valueClass={marginClass}
        />
        <FinancialCell
          label="Total investido"
          value={formattedCostTotal}
          detail={`${formatQuantityDisplay(batch.quantity)} × ${formattedCostPrice}`}
        />
      </div>

      {/* ── Info Section ── */}
      <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-5 mb-6">
        <div className="divide-y divide-neutral-800">
          <InfoLink
            icon={Package}
            label="Produto vinculado"
            value={batch.productName}
            href={`/products/${batch.productId}`}
          />
          <InfoLink
            icon={Warehouse}
            label="Armazém"
            value={batch.warehouseName}
            href={`/warehouses/${batch.warehouseId}`}
          />
          <OriginLink
            movementId={batch.originStockMovementId}
            movementCode={batch.originStockMovementCode}
          />
        </div>
      </div>

      {/* ── Dates ── */}
      <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-4">
          Datas
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <DateMeta
            label="Fabricação"
            value={formatBatchDate(batch.manufacturedDate)}
          />
          <DateMeta
            label="Registro"
            value={formatBatchDateTime(batch.createdAt)}
          />
          <DateMeta
            label="Validade"
            value={formatBatchDate(batch.expirationDate)}
          />
          <DateMeta
            label="Atualização"
            value={formatBatchDateTime(batch.updatedAt)}
          />
        </div>
      </div>

      {/* ── Mobile FixedBottomBar ── */}
      <FixedBottomBar className="md:hidden">
        <MobileActions
          batchId={batch.id}
          isDeleteOpen={isDeleteOpen}
          onDeleteOpenChange={onDeleteOpenChange}
          isDeleting={isDeleting}
          onDelete={onDelete}
        />
      </FixedBottomBar>
    </PageContainer>
  );
};
