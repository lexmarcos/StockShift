"use client";

import Link from "next/link";
import { Boxes, ExternalLink, FileText, Warehouse } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import {
  ItemCardMobile,
  ItemRowDesktop,
  MetaCell,
  TypeBadge,
} from "./stock-movements-detail.components";
import type { StockMovementDetailViewProps } from "./stock-movements-detail.types";

export const StockMovementsDetailView = ({
  movement,
  items,
  isLoading,
  error,
  typeBadge,
  formattedCreatedAt,
  formattedUpdatedAt,
  totalQuantity,
  itemCount,
  hasReference,
}: StockMovementDetailViewProps) => {
  if (isLoading && !error) {
    return (
      <PageContainer>
        <LoadingState message="Carregando movimentação..." />
      </PageContainer>
    );
  }

  if (error || !movement || !typeBadge) {
    return (
      <PageContainer>
        <ErrorState
          title="Movimentação não encontrada"
          description="A movimentação que você procura não existe ou foi removida do sistema."
        />
      </PageContainer>
    );
  }

  const itemsLabel = itemCount === 1 ? "produto" : "produtos";

  return (
    <PageContainer>
      <PageHeader title={movement.code} subtitle="Movimentação de estoque" />

      {/* ── Hero panel ── */}
      <section
        className={cn(
          "mb-6 rounded-[4px] border p-5 sm:p-6",
          typeBadge.borderClass,
          typeBadge.bgClass,
        )}
      >
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <TypeBadge badge={typeBadge} />
          {hasReference && movement.referenceType && (
            <span className="rounded-[4px] border border-neutral-700 bg-neutral-950 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Origem: {movement.referenceType}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-10">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
              Total movimentado
            </p>
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  "font-mono text-5xl font-bold leading-none tabular-nums",
                  typeBadge.textClass,
                )}
              >
                {totalQuantity}
              </span>
              <span className="text-sm font-bold uppercase text-neutral-500">
                un.
              </span>
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              {itemCount} {itemsLabel} · {typeBadge.description}
            </p>
          </div>

          <div className="hidden sm:block w-px self-stretch bg-neutral-800" />

          <div className="flex items-center gap-3">
            <Warehouse className="size-5 shrink-0 text-neutral-600" strokeWidth={2} />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                Armazém
              </p>
              <p className="text-sm font-bold text-white">
                {movement.warehouseName}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Items ── */}
      <section className="mb-6 rounded-[4px] border border-neutral-800 bg-[#171717]">
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <Boxes className="size-4 text-neutral-500" strokeWidth={2} />
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              Itens da movimentação
            </h2>
          </div>
          <span className="font-mono text-[11px] text-neutral-500">
            {itemCount.toString().padStart(2, "0")}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-neutral-500">Nenhum item registrado</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              {items.map((item) => (
                <ItemRowDesktop key={item.id} item={item} />
              ))}
            </div>
            <div className="md:hidden">
              {items.map((item) => (
                <ItemCardMobile key={item.id} item={item} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── Notes & Reference ── */}
      {(movement.notes || hasReference) && (
        <section className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          {movement.notes && (
            <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-4">
              <div className="mb-2 flex items-center gap-2">
                <FileText
                  className="size-3.5 text-neutral-500"
                  strokeWidth={2}
                />
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  Observações
                </p>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-300">
                {movement.notes}
              </p>
            </div>
          )}

          {hasReference &&
            movement.referenceType === "TRANSFER" &&
            movement.referenceId && (
              <Link
                href={`/transfers/${movement.referenceId}`}
                className="group flex items-center justify-between rounded-[4px] border border-neutral-800 bg-[#171717] p-4 hover:border-blue-700 hover:bg-blue-950/10"
              >
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-500 group-hover:text-blue-400">
                    Transferência relacionada
                  </p>
                  <p className="font-mono text-sm font-bold text-white group-hover:text-blue-300">
                    {movement.referenceId.slice(0, 8)}…
                  </p>
                </div>
                <ExternalLink
                  className="size-4 text-neutral-600 group-hover:text-blue-400"
                  strokeWidth={2}
                />
              </Link>
            )}
        </section>
      )}

      {/* ── Timestamps ── */}
      <section className="rounded-[4px] border border-neutral-800 bg-[#171717] p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MetaCell label="Criado em" value={formattedCreatedAt} mono />
          <MetaCell label="Última atualização" value={formattedUpdatedAt} mono />
        </div>
      </section>
    </PageContainer>
  );
};
