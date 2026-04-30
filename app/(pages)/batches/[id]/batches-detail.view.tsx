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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Batch } from "../batches.types";
import {
  BatchActions,
  LedgerItem,
  LoadingBatchDetail,
  LOW_STOCK_THRESHOLD,
  MetricTile,
  MissingBatchDetail,
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
  if (isLoading) return <LoadingBatchDetail />;
  if (error || !batch) return <MissingBatchDetail />;

  const daysToExpire = getExpirationDistance(batch.expirationDate);
  const batchState = getBatchState(batch, daysToExpire);
  const batchCode = getBatchCode(batch);
  const stockMeterWidth = getStockMeterWidth(batch.quantity);
  const marginClass = getMarginClass(batch.costPrice, batch.sellingPrice);
  const BatchStateIcon = batchState.Icon;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 text-neutral-200 selection:bg-blue-600/30">
      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="border border-neutral-800 bg-[#171717] p-5 lg:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <StatusBadge state={batchState} />
                  <span className="border border-neutral-800 bg-neutral-950 px-2 py-1 font-mono text-[11px] text-neutral-400">
                    {batchCode}
                  </span>
                </div>
                <p className="text-[11px] font-bold uppercase text-blue-400">
                  Produto vinculado
                </p>
                <Link href={`/products/${batch.productId}`} className="group mt-2 block">
                  <h2 className="break-words text-3xl font-black text-white md:text-4xl">
                    {batch.productName}
                  </h2>
                  <span className="mt-2 inline-flex text-xs font-bold uppercase text-neutral-500 group-hover:text-blue-400">
                    Abrir produto
                  </span>
                </Link>
              </div>

              <BatchActions
                batch={batch}
                isDeleteOpen={isDeleteOpen}
                onDeleteOpenChange={onDeleteOpenChange}
                isDeleting={isDeleting}
                onDelete={onDelete}
              />
            </div>

            <div className="mt-6 grid overflow-hidden border border-neutral-800 bg-neutral-800 md:grid-cols-3 md:gap-px">
              <LedgerItem
                icon={Barcode}
                label="SKU"
                value={formatOptionalText(batch.productSku)}
              />
              <LedgerItem icon={Warehouse} label="Armazém" value={batch.warehouseName} />
              <LedgerItem
                icon={Tag}
                label="Código do armazém"
                value={formatOptionalText(batch.warehouseCode)}
              />
            </div>
          </section>

          <section className={cn("border p-5", batchState.panelClass)}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase text-neutral-500">
                  Estoque atual
                </p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="font-mono text-7xl font-black leading-none text-white">
                    {batch.quantity}
                  </span>
                  <span className="pb-2 text-sm font-bold uppercase text-neutral-500">
                    un.
                  </span>
                </div>
              </div>
              <BatchStateIcon className={cn("h-8 w-8", batchState.textClass)} />
            </div>
            <div className="mt-6 h-3 border border-neutral-800 bg-neutral-950">
              <div
                className={cn("h-full", batchState.meterClass)}
                style={{ width: `${stockMeterWidth}%` }}
              />
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-neutral-800 pt-4">
              <span className={cn("text-sm font-bold", batchState.textClass)}>
                {batchState.description}
              </span>
              <span className="text-xs text-neutral-500">
                {getExpirationDetail(daysToExpire)}
              </span>
            </div>
          </section>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

        <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr_0.8fr]">
          <section className="border border-neutral-800 bg-[#171717] p-5">
            <div className="mb-5 flex items-center gap-2 text-blue-400">
              <MapPin className="h-4 w-4" />
              <h3 className="text-xs font-bold uppercase">Localização</h3>
            </div>
            <p className="text-[11px] font-bold uppercase text-neutral-500">
              Warehouse
            </p>
            <p className="mt-2 break-words text-2xl font-black text-white">
              {batch.warehouseName}
            </p>
            <div className="mt-5 border-t border-neutral-800 pt-4">
              <span className="inline-flex border border-neutral-700 bg-neutral-950 px-2 py-1 font-mono text-[11px] text-neutral-400">
                COD: {formatOptionalText(batch.warehouseCode)}
              </span>
            </div>
          </section>

          <section className="border border-neutral-800 bg-[#171717] p-5">
            <div className="mb-5 flex items-center gap-2 text-amber-400">
              <Clock className="h-4 w-4" />
              <h3 className="text-xs font-bold uppercase">Ciclo de vida</h3>
            </div>
            <div className="grid gap-6 border-l border-neutral-800">
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
          </section>

          <section className="border border-neutral-800 bg-[#171717] p-5">
            <div className="mb-5 flex items-center gap-2 text-neutral-300">
              <FileText className="h-4 w-4" />
              <h3 className="text-xs font-bold uppercase">Observações</h3>
            </div>
            <div className="min-h-36 border border-neutral-800 bg-neutral-950 p-4">
              <p className="whitespace-pre-wrap text-sm leading-6 text-neutral-300">
                {formatOptionalText(batch.notes)}
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden border border-neutral-800 bg-neutral-800">
              <div className="bg-[#111111] p-3">
                <p className="text-[10px] font-bold uppercase text-neutral-500">
                  ID
                </p>
                <p className="mt-1 truncate font-mono text-xs text-neutral-300">
                  {batch.id}
                </p>
              </div>
              <div className="bg-[#111111] p-3">
                <p className="text-[10px] font-bold uppercase text-neutral-500">
                  Produto
                </p>
                <p className="mt-1 truncate font-mono text-xs text-neutral-300">
                  {batch.productId}
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
