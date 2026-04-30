"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Archive,
  Box,
  CalendarDays,
  CheckCircle2,
  Package,
  Pencil,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  differenceInCalendarDays,
  format,
  isPast,
  isToday,
  isValid,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/components/permission-gate";
import { cn } from "@/lib/utils";
import type { Batch } from "../batches.types";

export interface BatchStateView {
  label: string;
  description: string;
  Icon: LucideIcon;
  badgeClass: string;
  panelClass: string;
  textClass: string;
  meterClass: string;
}

interface MetricTileProps {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  toneClass: string;
  valueClass?: string;
}

interface LedgerItemProps {
  label: string;
  value: string;
  icon: LucideIcon;
}

interface TimelineStepProps {
  label: string;
  value: string;
  detail: string;
  toneClass: string;
}

interface BatchActionsProps {
  batch: Batch;
  isDeleteOpen: boolean;
  onDeleteOpenChange: (open: boolean) => void;
  isDeleting: boolean;
  onDelete: () => void;
}

export const LOW_STOCK_THRESHOLD = 10;

const activeState: BatchStateView = {
  label: "Operacional",
  description: "Disponível para venda",
  Icon: CheckCircle2,
  badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  panelClass: "border-emerald-500/30 bg-emerald-950/10",
  textClass: "text-emerald-400",
  meterClass: "bg-emerald-500",
};

const lowStockState: BatchStateView = {
  label: "Estoque baixo",
  description: `Abaixo de ${LOW_STOCK_THRESHOLD + 1} unidades`,
  Icon: Archive,
  badgeClass: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  panelClass: "border-blue-500/30 bg-blue-950/10",
  textClass: "text-blue-400",
  meterClass: "bg-blue-500",
};

const expiringState: BatchStateView = {
  label: "Atenção",
  description: "Validade próxima",
  Icon: CalendarDays,
  badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  panelClass: "border-amber-500/30 bg-amber-950/10",
  textClass: "text-amber-400",
  meterClass: "bg-amber-500",
};

const expiredState: BatchStateView = {
  label: "Expirado",
  description: "Revisar antes de vender",
  Icon: AlertTriangle,
  badgeClass: "border-rose-500/30 bg-rose-500/10 text-rose-400",
  panelClass: "border-rose-500/30 bg-rose-950/10",
  textClass: "text-rose-400",
  meterClass: "bg-rose-500",
};

const emptyState: BatchStateView = {
  label: "Sem estoque",
  description: "Indisponível para venda",
  Icon: Package,
  badgeClass: "border-neutral-700 bg-neutral-900 text-neutral-400",
  panelClass: "border-neutral-700 bg-neutral-900/50",
  textClass: "text-neutral-400",
  meterClass: "bg-neutral-600",
};

const parseBatchDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const parsedDate = parseISO(value);
  return isValid(parsedDate) ? parsedDate : null;
};

export const formatDate = (value?: string | null): string => {
  const parsedDate = parseBatchDate(value);
  if (!parsedDate) return value || "-";
  return format(parsedDate, "dd 'de' MMM, yyyy", { locale: ptBR });
};

export const formatDateTime = (value?: string | null): string => {
  const parsedDate = parseBatchDate(value);
  if (!parsedDate) return value || "-";
  return format(parsedDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

export const formatCurrency = (value?: number | null): string => {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
};

export const formatOptionalText = (value?: string | null): string => {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : "-";
};

export const getBatchCode = (batch: Batch): string => {
  return batch.batchNumber || batch.batchCode || batch.id;
};

export const getCurrencyTotal = (
  price?: number | null,
  quantity = 0,
): string => {
  if (price === null || price === undefined) return "-";
  return formatCurrency(price * quantity);
};

export const getMarginLabel = (
  cost?: number | null,
  selling?: number | null,
): string => {
  if (!cost || !selling) return "-";
  return `${Math.round(((selling - cost) / cost) * 100)}%`;
};

export const getMarginClass = (
  cost?: number | null,
  selling?: number | null,
): string => {
  if (!cost || !selling) return "text-neutral-500";
  return selling >= cost ? "text-emerald-400" : "text-rose-400";
};

export const getExpirationDistance = (
  expirationDate?: string | null,
): number | null => {
  const parsedDate = parseBatchDate(expirationDate);
  return parsedDate ? differenceInCalendarDays(parsedDate, new Date()) : null;
};

export const getExpirationDetail = (daysToExpire: number | null): string => {
  if (daysToExpire === null) return "Sem validade cadastrada";
  if (daysToExpire < 0) return `Venceu há ${Math.abs(daysToExpire)} dia(s)`;
  if (daysToExpire === 0) return "Vence hoje";
  return `Vence em ${daysToExpire} dia(s)`;
};

export const getStockMeterWidth = (quantity: number): number => {
  if (quantity <= 0) return 0;
  return Math.min(100, Math.max(8, quantity));
};

export const getBatchState = (
  batch: Batch,
  daysToExpire: number | null,
): BatchStateView => {
  const expirationDate = parseBatchDate(batch.expirationDate);
  const isExpired = expirationDate
    ? isPast(expirationDate) && !isToday(expirationDate)
    : false;

  if (batch.quantity <= 0) return emptyState;
  if (isExpired) return expiredState;
  if (daysToExpire !== null && daysToExpire <= 30) return expiringState;
  if (batch.quantity <= LOW_STOCK_THRESHOLD) return lowStockState;
  return activeState;
};

export const LoadingBatchDetail = () => (
  <div className="min-h-screen bg-[#0A0A0A] text-neutral-200">
    <main className="mx-auto flex min-h-[520px] w-full max-w-7xl items-center justify-center px-4 md:px-6 lg:px-8">
      <div className="grid w-full max-w-xl gap-3 border border-neutral-800 bg-[#171717] p-6">
        <div className="h-3 w-32 bg-neutral-800" />
        <div className="h-9 w-3/4 bg-neutral-800" />
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="h-20 bg-neutral-900" />
          <div className="h-20 bg-neutral-900" />
          <div className="h-20 bg-neutral-900" />
        </div>
      </div>
    </main>
  </div>
);

export const MissingBatchDetail = () => (
  <div className="min-h-screen bg-[#0A0A0A] text-neutral-200">
    <main className="mx-auto flex min-h-[520px] w-full max-w-7xl items-center justify-center px-4 md:px-6 lg:px-8">
      <section className="w-full max-w-lg border border-neutral-800 bg-[#171717] p-8 text-center">
        <Box className="mx-auto mb-4 h-12 w-12 text-neutral-600" />
        <h2 className="text-lg font-bold text-white">Batch não encontrado</h2>
        <p className="mt-2 text-sm text-neutral-500">
          O lote que você procura não existe ou foi removido.
        </p>
        <Link href="/batches" className="mt-6 inline-flex">
          <Button className="h-10 rounded-[4px] bg-blue-600 text-xs font-bold uppercase text-white hover:bg-blue-700">
            Voltar para lotes
          </Button>
        </Link>
      </section>
    </main>
  </div>
);

export const MetricTile = ({
  label,
  value,
  detail,
  icon: Icon,
  toneClass,
  valueClass,
}: MetricTileProps) => (
  <section className="border border-neutral-800 bg-[#171717] p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[11px] font-bold uppercase text-neutral-500">
          {label}
        </p>
        <p className={cn("mt-2 text-2xl font-black text-white", valueClass)}>
          {value}
        </p>
      </div>
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center border",
          toneClass,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <p className="mt-3 border-t border-neutral-800 pt-3 text-xs text-neutral-500">
      {detail}
    </p>
  </section>
);

export const LedgerItem = ({ label, value, icon: Icon }: LedgerItemProps) => (
  <div className="bg-[#111111] p-4">
    <div className="mb-3 flex items-center gap-2 text-neutral-500">
      <Icon className="h-3.5 w-3.5" />
      <span className="text-[10px] font-bold uppercase">{label}</span>
    </div>
    <p className="break-words font-mono text-sm text-neutral-100">{value}</p>
  </div>
);

export const TimelineStep = ({
  label,
  value,
  detail,
  toneClass,
}: TimelineStepProps) => (
  <div className="relative pl-5">
    <span
      className={cn(
        "absolute left-[-5px] top-1 h-2.5 w-2.5 border border-[#171717]",
        toneClass,
      )}
    />
    <p className="text-[10px] font-bold uppercase text-neutral-500">{label}</p>
    <p className="mt-1 text-sm font-bold text-white">{value}</p>
    <p className="mt-1 text-xs text-neutral-500">{detail}</p>
  </div>
);

export const StatusBadge = ({ state }: { state: BatchStateView }) => {
  const StatusIcon = state.Icon;
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-7 rounded-[4px] border px-2 text-[10px] font-bold uppercase",
        state.badgeClass,
      )}
    >
      <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
      {state.label}
    </Badge>
  );
};

export const BatchActions = ({
  batch,
  isDeleteOpen,
  onDeleteOpenChange,
  isDeleting,
  onDelete,
}: BatchActionsProps) => (
  <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
    <PermissionGate permission="batches:update">
      <Link href={`/batches/${batch.id}/edit`} className="w-full sm:w-auto">
        <Button
          variant="outline"
          className="h-10 w-full rounded-[4px] border-neutral-700 bg-neutral-950 text-xs font-bold uppercase text-neutral-200 hover:bg-neutral-800 hover:text-white sm:w-auto"
        >
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Editar
        </Button>
      </Link>
    </PermissionGate>

    <AlertDialog open={isDeleteOpen} onOpenChange={onDeleteOpenChange}>
      <PermissionGate permission="batches:delete">
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className="h-10 rounded-[4px] border-rose-900/60 bg-rose-950/10 text-xs font-bold uppercase text-rose-400 hover:border-rose-700 hover:bg-rose-950/40"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Excluir
          </Button>
        </AlertDialogTrigger>
      </PermissionGate>
      <AlertDialogContent className="rounded-[4px] border-neutral-800 bg-[#171717]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            Excluir batch permanentemente?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-neutral-400">
            Esta ação não pode ser desfeita. Isso excluirá permanentemente o
            batch e removerá os dados de nossos servidores.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-[4px] border-neutral-800 bg-transparent text-white hover:bg-neutral-800">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            className="rounded-[4px] border border-rose-500 bg-rose-600 text-white hover:bg-rose-700"
            disabled={isDeleting}
            onClick={onDelete}
          >
            {isDeleting ? "Excluindo..." : "Confirmar Exclusão"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
);
