import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import {
  differenceInCalendarDays,
  format,
  isPast,
  isToday,
  isValid,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCentsToBRL } from "@/lib/currency";
import { useBreadcrumb } from "@/components/breadcrumb";
import type {
  BatchDetail,
  BatchDetailResponse,
  BatchStatusKind,
  BatchStatusView,
} from "./batches-detail.types";

/* ─── Constants ─── */

export const LOW_STOCK_THRESHOLD = 10;

/* ─── Status Definitions ─── */

const STATUS_MAP: Record<BatchStatusKind, BatchStatusView> = {
  expired: {
    kind: "expired",
    label: "Expirado",
    description: "Revisar antes de vender",
    badgeClass: "border-rose-500/30 bg-rose-500/10 text-rose-400",
    panelClass: "border-rose-500/30 bg-rose-950/10",
    textClass: "text-rose-400",
    meterClass: "bg-rose-500",
  },
  expiring: {
    kind: "expiring",
    label: "Atenção",
    description: "Validade próxima",
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    panelClass: "border-amber-500/30 bg-amber-950/10",
    textClass: "text-amber-400",
    meterClass: "bg-amber-500",
  },
  low_stock: {
    kind: "low_stock",
    label: "Estoque baixo",
    description: `Abaixo de ${LOW_STOCK_THRESHOLD + 1} unidades`,
    badgeClass: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    panelClass: "border-blue-500/30 bg-blue-950/10",
    textClass: "text-blue-400",
    meterClass: "bg-blue-500",
  },
  ok: {
    kind: "ok",
    label: "Operacional",
    description: "Disponível para venda",
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    panelClass: "border-emerald-500/30 bg-emerald-950/10",
    textClass: "text-emerald-400",
    meterClass: "bg-emerald-500",
  },
};


/* ─── Pure Functions ─── */

const parseSafeDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
};

export const computeExpirationDays = (expirationDate: string | null | undefined): number | null => {
  const parsed = parseSafeDate(expirationDate);
  return parsed ? differenceInCalendarDays(parsed, new Date()) : null;
};

export const computeBatchStatus = (
  quantity: number,
  daysToExpire: number | null,
  expirationDate: string | null | undefined,
): BatchStatusView => {
  const parsed = parseSafeDate(expirationDate);
  const isExpired = parsed ? isPast(parsed) && !isToday(parsed) : false;

  if (isExpired) return STATUS_MAP.expired;
  if (daysToExpire !== null && daysToExpire <= 30) return STATUS_MAP.expiring;
  if (quantity <= LOW_STOCK_THRESHOLD) return STATUS_MAP.low_stock;
  return STATUS_MAP.ok;
};

export { formatCentsToBRL };

export const formatCentsTotal = (
  unitCents: number | null | undefined,
  quantity: number,
): string => {
  if (unitCents === null || unitCents === undefined) return "-";
  return formatCentsToBRL(unitCents * quantity);
};

export const computeMarginLabel = (
  costCents: number | null | undefined,
  sellingCents: number | null | undefined,
): string => {
  if (!costCents || !sellingCents) return "-";
  return `${Math.round(((sellingCents - costCents) / costCents) * 100)}%`;
};

export const computeMarginClass = (
  costCents: number | null | undefined,
  sellingCents: number | null | undefined,
): string => {
  if (!costCents || !sellingCents) return "text-neutral-500";
  return sellingCents >= costCents ? "text-emerald-400" : "text-rose-400";
};



export const formatExpirationLabel = (daysToExpire: number | null): string => {
  if (daysToExpire === null) return "Sem validade cadastrada";
  if (daysToExpire < 0) return `Venceu há ${Math.abs(daysToExpire)} dia(s)`;
  if (daysToExpire === 0) return "Vence hoje";
  return `Vence em ${daysToExpire} dia(s)`;
};

export const formatBatchDate = (value: string | null | undefined): string => {
  const parsed = parseSafeDate(value);
  if (!parsed) return "-";
  return format(parsed, "dd 'de' MMM, yyyy", { locale: ptBR });
};

export const formatBatchDateTime = (value: string | null | undefined): string => {
  const parsed = parseSafeDate(value);
  if (!parsed) return "-";
  return format(parsed, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

export const formatQuantityDisplay = (quantity: number): string => {
  return Number.isInteger(quantity) ? `${quantity}` : quantity.toFixed(2);
};

export const resolveBatchDetailTitle = (
  batch: BatchDetail | null,
  hasError: boolean,
  isLoading: boolean,
): string => {
  if (batch) return batch.batchCode;
  if (isLoading && !hasError) return "Carregando...";
  return "Lote não encontrado";
};

/* ─── Hook ─── */

export const useBatchDetailModel = (batchId: string) => {
  const router = useRouter();
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<BatchDetailResponse>(
    batchId ? `batches/${batchId}` : null,
    async (url: string) => {
      const { api } = await import("@/lib/api");
      return await api.get(url).json<BatchDetailResponse>();
    },
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  const batch: BatchDetail | null = data?.data ?? null;
  const hasError = Boolean(error);

  useBreadcrumb({
    title: resolveBatchDetailTitle(batch, hasError, isLoading),
    backUrl: "/batches",
  });

  const daysToExpire = batch ? computeExpirationDays(batch.expirationDate) : null;
  const status = batch
    ? computeBatchStatus(batch.quantity, daysToExpire, batch.expirationDate)
    : null;

  const onDeleteBatch = async () => {
    if (!batchId) return;
    setIsDeleting(true);
    try {
      const { api } = await import("@/lib/api");
      await api.delete(`batches/${batchId}`).json();
      toast.success("Lote removido com sucesso");
      setDeleteOpen(false);
      router.push("/batches");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao remover lote";
      toast.error(message);
      mutate();
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    batch,
    isLoading: isLoading && !hasError,
    error,
    status,
    daysToExpire,
    formattedCostPrice: formatCentsToBRL(batch?.costPrice),
    formattedSellingPrice: formatCentsToBRL(batch?.sellingPrice),
    formattedCostTotal: formatCentsTotal(batch?.costPrice, batch?.quantity ?? 0),
    formattedSellingTotal: formatCentsTotal(batch?.sellingPrice, batch?.quantity ?? 0),
    marginLabel: computeMarginLabel(batch?.costPrice, batch?.sellingPrice),
    marginClass: computeMarginClass(batch?.costPrice, batch?.sellingPrice),

    expirationLabel: formatExpirationLabel(daysToExpire),
    isDeleteOpen,
    onDeleteOpenChange: setDeleteOpen,
    isDeleting,
    onDelete: onDeleteBatch,
  };
};
