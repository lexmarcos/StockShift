"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ArrowLeft, Check, X } from "lucide-react";
import type { StockMovement } from "../stock-movements.types";

interface StockMovementDetailViewProps {
  movement: StockMovement | null;
  isLoading: boolean;
  error: any;
  isExecuting: boolean;
  isCancelling: boolean;
  onExecute: () => void;
  onCancel: () => void;
  isCancelOpen: boolean;
  onCancelOpenChange: (open: boolean) => void;
}

export const StockMovementDetailView = ({
  movement,
  isLoading,
  error,
  isExecuting,
  isCancelling,
  onExecute,
  onCancel,
  isCancelOpen,
  onCancelOpenChange,
}: StockMovementDetailViewProps) => {
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-4 py-10 text-xs text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (error || !movement) {
    return (
      <div className="min-h-screen bg-background px-4 py-10 text-xs text-muted-foreground">
        Movimentação não encontrada
      </div>
    );
  }

  const canAct = movement.status === "PENDING";

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-20 border-b border-border/40 bg-card">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/stock-movements"
              className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-muted/50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
            <div className="border-l border-border/40 pl-3">
              <h1 className="text-base font-semibold uppercase tracking-wide">
                {movement.movementType}
              </h1>
              <p className="text-xs text-muted-foreground hidden md:block">
                {movement.status}
              </p>
            </div>
          </div>
          {canAct && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="rounded-sm bg-foreground text-background"
                onClick={onExecute}
                disabled={isExecuting}
              >
                <Check className="mr-2 h-3.5 w-3.5" />
                Executar
              </Button>
              <AlertDialog open={isCancelOpen} onOpenChange={onCancelOpenChange}>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-sm border-border/40"
                  >
                    <X className="mr-2 h-3.5 w-3.5" />
                    Cancelar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar movimentação?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-sm">
                      Voltar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="rounded-sm"
                      onClick={onCancel}
                      disabled={isCancelling}
                    >
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border border-border/50 bg-card/80 rounded-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                Warehouses
              </CardTitle>
              <CardDescription className="text-xs">Origem e destino</CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Origem</span>
                <span>{movement.sourceWarehouseName || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Destino</span>
                <span>{movement.destinationWarehouseName || "-"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 bg-card/80 rounded-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                Detalhes
              </CardTitle>
              <CardDescription className="text-xs">Resumo da operação</CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado por</span>
                <span>{movement.createdByName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em</span>
                <span>{new Date(movement.createdAt).toLocaleDateString("pt-BR")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Notas</span>
                <span>{movement.notes || "-"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4 border border-border/50 bg-card/80 rounded-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">Itens</CardTitle>
            <CardDescription className="text-xs">
              {movement.items.length} itens
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            {movement.items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>{item.productName}</span>
                <span>{item.quantity}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
