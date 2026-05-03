"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type {
  StockMovementReloadGuardViewProps,
} from "./stock-movement-reload-guard.types";

export function StockMovementReloadGuardView({
  isConfirmOpen,
  onConfirmOpenChange,
  onCancelReload,
  onConfirmReload,
}: StockMovementReloadGuardViewProps) {
  return (
    <AlertDialog open={isConfirmOpen} onOpenChange={onConfirmOpenChange}>
      <AlertDialogContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-200 shadow-none">
        <AlertDialogHeader>
          <div className="mb-1 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-amber-500/30 bg-amber-500/10 text-amber-400">
              <TriangleAlert className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <AlertDialogTitle className="text-base font-bold text-white">
              Recarregar a tela?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm leading-6 text-neutral-400">
            Ao recarregar esta tela, os dados preenchidos nesta movimentação
            serão perdidos. Tem certeza que deseja continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onCancelReload}
            className="rounded-[4px] border-neutral-800 bg-transparent text-xs font-bold uppercase tracking-wide text-white hover:bg-neutral-800"
          >
            Continuar editando
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmReload}
            className="rounded-[4px] bg-rose-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-rose-700"
          >
            <RotateCcw className="mr-2 h-3.5 w-3.5" strokeWidth={2.5} />
            Recarregar e perder dados
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
