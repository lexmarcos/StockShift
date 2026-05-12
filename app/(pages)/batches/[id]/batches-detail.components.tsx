"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Archive,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
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
      <Icon className="mr-1.5 size-3.5" />
      {status.label}
    </Badge>
  );
};

/* ─── HeroStat ─── */

interface HeroStatProps {
  label: string;
  value: string;
  unit: string;
  detail: string;
  toneClass: string;
}

export const HeroStat = ({
  label,
  value,
  unit,
  detail,
  toneClass,
}: HeroStatProps) => (
  <div className="flex-1 min-w-0">
    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">
      {label}
    </p>
    <div className="flex items-baseline gap-1.5">
      <span className={cn("font-mono text-4xl font-bold leading-none tabular-nums", toneClass)}>
        {value}
      </span>
      <span className="text-sm font-bold uppercase text-neutral-500">
        {unit}
      </span>
    </div>
    <p className="mt-1.5 text-xs text-neutral-500">{detail}</p>
  </div>
);

/* ─── FinancialCell ─── */

interface FinancialCellProps {
  label: string;
  value: string;
  detail: string;
  valueClass?: string;
}

export const FinancialCell = ({
  label,
  value,
  detail,
  valueClass,
}: FinancialCellProps) => (
  <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-4">
    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">
      {label}
    </p>
    <p className={cn("text-xl font-bold tabular-nums text-white", valueClass)}>
      {value}
    </p>
    <p className="mt-1 text-[11px] text-neutral-500">{detail}</p>
  </div>
);

/* ─── InfoLink ─── */

interface InfoLinkProps {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
}

export const InfoLink = ({
  icon: Icon,
  label,
  value,
  href,
}: InfoLinkProps) => {
  const content = (
    <div className={cn("flex items-center gap-3 py-3", href && "group")}>
      <Icon className="size-4 shrink-0 text-neutral-600" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          {label}
        </p>
        <p
          className={cn(
            "text-sm font-bold text-white truncate",
            href && "group-hover:text-blue-400",
          )}
        >
          {value}
        </p>
      </div>
      {href && (
        <ExternalLink className="size-3.5 shrink-0 text-neutral-700 group-hover:text-blue-400" />
      )}
    </div>
  );

  if (!href) return content;
  return <Link href={href}>{content}</Link>;
};

/* ─── OriginLink ─── */

interface OriginLinkProps {
  movementId: string | null;
  movementCode: string | null;
}

export const OriginLink = ({ movementId, movementCode }: OriginLinkProps) => (
  <InfoLink
    icon={GitBranch}
    label="Origem"
    value={movementCode ?? movementId ?? "Criado manualmente"}
    href={movementId ? `/stock-movements/${movementId}` : undefined}
  />
);

/* ─── DateMeta ─── */

interface DateMetaProps {
  label: string;
  value: string;
}

export const DateMeta = ({ label, value }: DateMetaProps) => (
  <div>
    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 block mb-0.5">
      {label}
    </span>
    <span className="text-xs font-mono text-neutral-400">{value}</span>
  </div>
);

/* ─── BatchActions (Desktop) ─── */

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
  <div className="hidden md:flex items-center gap-2">
    <PermissionGate permission="batches:update">
      <Link href={`/batches/${batchId}/edit`}>
        <Button
          variant="outline"
          className="h-9 rounded-[4px] border-neutral-700 bg-transparent text-xs font-bold uppercase tracking-wide text-neutral-300 hover:bg-neutral-800 hover:text-white"
        >
          <Pencil className="mr-2 size-3.5" />
          Editar
        </Button>
      </Link>
    </PermissionGate>

    <DeleteDialog
      isOpen={isDeleteOpen}
      onOpenChange={onDeleteOpenChange}
      isDeleting={isDeleting}
      onDelete={onDelete}
    />
  </div>
);

/* ─── MobileActions (FixedBottomBar content) ─── */

interface MobileActionsProps {
  batchId: string;
  isDeleteOpen: boolean;
  onDeleteOpenChange: (open: boolean) => void;
  isDeleting: boolean;
  onDelete: () => void;
}

export const MobileActions = ({
  batchId,
  isDeleteOpen,
  onDeleteOpenChange,
  isDeleting,
  onDelete,
}: MobileActionsProps) => (
  <div className="flex items-center gap-3 w-full">
    <PermissionGate permission="batches:update">
      <Link href={`/batches/${batchId}/edit`} className="flex-1">
        <Button className="h-11 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700">
          <Pencil className="mr-2 size-3.5" />
          Editar
        </Button>
      </Link>
    </PermissionGate>

    <DeleteDialog
      isOpen={isDeleteOpen}
      onOpenChange={onDeleteOpenChange}
      isDeleting={isDeleting}
      onDelete={onDelete}
      triggerClassName="h-11 rounded-[4px] border-rose-900/60 bg-transparent px-4 text-xs font-bold uppercase tracking-wide text-rose-400 hover:border-rose-700 hover:bg-rose-950/40"
    />
  </div>
);

/* ─── DeleteDialog ─── */

interface DeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isDeleting: boolean;
  onDelete: () => void;
  triggerClassName?: string;
}

const DeleteDialog = ({
  isOpen,
  onOpenChange,
  isDeleting,
  onDelete,
  triggerClassName,
}: DeleteDialogProps) => (
  <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
    <PermissionGate permission="batches:delete">
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className={
            triggerClassName ??
            "h-9 rounded-[4px] border-rose-900/60 bg-transparent text-xs font-bold uppercase tracking-wide text-rose-400 hover:border-rose-700 hover:bg-rose-950/40"
          }
        >
          <Trash2 className="mr-2 size-3.5" />
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
);
