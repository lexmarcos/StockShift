"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Archive,
  CalendarDays,
  CheckCircle2,
  GitBranch,
  Package,
  Pencil,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
import type { BatchStatusView } from "./batches-detail.types";

/* ─── Status Icon Map ─── */

export const STATUS_ICON_MAP: Record<string, LucideIcon> = {
  expired: AlertTriangle,
  expiring: CalendarDays,
  low_stock: Archive,
  ok: CheckCircle2,
};

/* ─── StatusBadge ─── */

export const StatusBadge = ({ status }: { status: BatchStatusView }) => {
  const Icon = STATUS_ICON_MAP[status.kind] ?? Package;
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-7 rounded-[4px] border px-2 text-[10px] font-bold uppercase tracking-wider",
        status.badgeClass,
      )}
    >
      <Icon className="mr-1.5 h-3.5 w-3.5" />
      {status.label}
    </Badge>
  );
};

/* ─── MetricTile ─── */

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

/* ─── InfoRow ─── */

interface InfoRowProps {
  label: string;
  value: string;
  icon: LucideIcon;
}

export const InfoRow = ({ label, value, icon: Icon }: InfoRowProps) => (
  <div className="rounded-[4px] border border-neutral-800 bg-neutral-900/50 p-4">
    <div className="mb-2 flex items-center gap-2 text-neutral-500">
      <Icon className="h-3.5 w-3.5" />
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </div>
    <p className="break-words font-mono text-sm font-bold text-white">{value}</p>
  </div>
);

/* ─── TimelineStep ─── */

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

/* ─── OriginSection ─── */

interface OriginSectionProps {
  movementId: string | null;
  movementCode: string | null;
}

export const OriginSection = ({ movementId, movementCode }: OriginSectionProps) => {
  if (!movementId) {
    return (
      <div className="rounded-[4px] border border-neutral-800 bg-neutral-900/50 p-4">
        <div className="mb-2 flex items-center gap-2 text-neutral-500">
          <GitBranch className="h-3.5 w-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Origem</span>
        </div>
        <p className="text-sm text-neutral-500">Criado manualmente</p>
      </div>
    );
  }

  return (
    <Link
      href={`/stock-movements/${movementId}`}
      className="group block rounded-[4px] border border-neutral-800 bg-neutral-900/50 p-4 hover:border-blue-500/40"
    >
      <div className="mb-2 flex items-center gap-2 text-neutral-500 group-hover:text-blue-400">
        <GitBranch className="h-3.5 w-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Origem</span>
      </div>
      <p className="break-words font-mono text-sm font-bold text-white group-hover:text-blue-300">
        {movementCode ?? movementId}
      </p>
    </Link>
  );
};

/* ─── BatchActions ─── */

interface BatchActionsProps {
  batchId: string;
  isDeleteOpen: boolean;
  onDeleteOpenChange: (open: boolean) => void;
  isDeleting: boolean;
  onDelete: () => void;
}

export const BatchActions = ({
  batchId,
  isDeleteOpen,
  onDeleteOpenChange,
  isDeleting,
  onDelete,
}: BatchActionsProps) => (
  <div className="flex items-center gap-2">
    <PermissionGate permission="batches:update">
      <Link href={`/batches/${batchId}/edit`}>
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
            Excluir lote permanentemente?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-neutral-400">
            Esta ação não pode ser desfeita. O lote e todos os dados associados
            serão removidos permanentemente do sistema.
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
