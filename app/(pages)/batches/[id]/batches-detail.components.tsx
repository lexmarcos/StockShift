"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Archive,
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

/* ─── State Definitions ─── */

export interface BatchStateView {
  label: string;
  description: string;
  Icon: LucideIcon;
  badgeClass: string;
  panelClass: string;
  textClass: string;
  meterClass: string;
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

/* ─── Utilities ─── */

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

/* ─── Sub-Components ─── */

interface MetricTileProps {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  toneClass: string;
  valueClass?: string;
}

export const MetricTile = ({
  label,
  value,
  detail,
  icon: Icon,
  toneClass,
  valueClass,
}: MetricTileProps) => (
  <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          {label}
        </p>
        <p className={cn("mt-2 text-2xl font-bold tabular-nums text-white", valueClass)}>
          {value}
        </p>
      </div>
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] border",
          toneClass,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <p className="mt-3 border-t border-neutral-800 pt-3 text-xs text-neutral-500">
      {detail}
    </p>
  </div>
);

interface LedgerItemProps {
  label: string;
  value: string;
  icon: LucideIcon;
}

export const LedgerItem = ({ label, value, icon: Icon }: LedgerItemProps) => (
  <div className="rounded-[4px] border border-neutral-800 bg-neutral-900/50 p-4">
    <div className="mb-2 flex items-center gap-2 text-neutral-500">
      <Icon className="h-3.5 w-3.5" />
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </div>
    <p className="break-words font-mono text-sm font-bold text-white">{value}</p>
  </div>
);

interface TimelineStepProps {
  label: string;
  value: string;
  detail: string;
  toneClass: string;
}

export const TimelineStep = ({
  label,
  value,
  detail,
  toneClass,
}: TimelineStepProps) => (
  <div className="relative pl-5">
    <span
      className={cn(
        "absolute left-[-5px] top-1 h-2.5 w-2.5 rounded-[2px] border border-[#171717]",
        toneClass,
      )}
    />
    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{label}</p>
    <p className="mt-1 text-sm font-bold text-white">{value}</p>
    <p className="mt-0.5 text-xs text-neutral-500">{detail}</p>
  </div>
);

export const StatusBadge = ({ state }: { state: BatchStateView }) => {
  const StatusIcon = state.Icon;
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-7 rounded-[4px] border px-2 text-[10px] font-bold uppercase tracking-wider",
        state.badgeClass,
      )}
    >
      <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
      {state.label}
    </Badge>
  );
};

interface BatchActionsProps {
  batch: Batch;
  isDeleteOpen: boolean;
  onDeleteOpenChange: (open: boolean) => void;
  isDeleting: boolean;
  onDelete: () => void;
}

export const BatchActions = ({
  batch,
  isDeleteOpen,
  onDeleteOpenChange,
  isDeleting,
  onDelete,
}: BatchActionsProps) => (
  <div className="flex items-center gap-2">
    <PermissionGate permission="batches:update">
      <Link href={`/batches/${batch.id}/edit`}>
        <Button
          variant="outline"
          className="h-9 rounded-[4px] border-neutral-700 bg-transparent text-xs font-bold uppercase tracking-wide text-neutral-300 hover:bg-neutral-800 hover:text-white"
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
            className="h-9 rounded-[4px] border-rose-900/60 bg-transparent text-xs font-bold uppercase tracking-wide text-rose-400 hover:border-rose-700 hover:bg-rose-950/40"
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
