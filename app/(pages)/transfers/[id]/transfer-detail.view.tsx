"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransferDetailViewProps } from "./transfer-detail.types";
import { TransferStatus } from "../transfers.types";

const statusConfig: Record<TransferStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Rascunho", variant: "secondary" },
  IN_TRANSIT: { label: "Em Trânsito", variant: "default" },
  IN_VALIDATION: { label: "Em Validação", variant: "outline" },
  COMPLETED: { label: "Concluída", variant: "default" },
  CANCELLED: { label: "Cancelada", variant: "destructive" },
};

export const TransferDetailView = ({
  transfer,
  isLoading,
  isSource,
  isDestination,
  onExecute,
  onStartValidation,
  onCancel,
  isExecuting,
  isStartingValidation,
  isCancelling,
  showCancelDialog,
  setShowCancelDialog,
}: TransferDetailViewProps) => {
  const [cancelReason, setCancelReason] = useState("");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Transferência não encontrada
      </div>
    );
  }

  const config = statusConfig[transfer.status];
  const canExecute = isSource && transfer.status === "DRAFT";
  const canCancel = isSource && (transfer.status === "DRAFT" || transfer.status === "IN_TRANSIT");
  const canStartValidation = isDestination && transfer.status === "IN_TRANSIT";
  const canValidate = isDestination && transfer.status === "IN_VALIDATION";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant={config.variant} className="text-sm">
          {config.label}
        </Badge>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Origem</p>
          <p className="font-medium">{transfer.sourceWarehouse.name}</p>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1 text-right">
          <p className="text-xs text-muted-foreground">Destino</p>
          <p className="font-medium">{transfer.destinationWarehouse.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Criado em</p>
          <p>{new Date(transfer.createdAt).toLocaleString("pt-BR")}</p>
        </div>
        {transfer.executedAt && (
          <div>
            <p className="text-muted-foreground">Enviado em</p>
            <p>{new Date(transfer.executedAt).toLocaleString("pt-BR")}</p>
          </div>
        )}
      </div>

      {transfer.notes && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Notas</p>
          <p className="text-sm">{transfer.notes}</p>
        </div>
      )}

      <div>
        <p className="text-sm font-medium mb-2">
          Itens ({transfer.items.length})
        </p>
        <div className="space-y-2">
          {transfer.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border/60"
            >
              <div>
                <p className="font-medium text-sm">{item.product.name}</p>
                {item.product.barcode && (
                  <p className="text-xs text-muted-foreground">
                    {item.product.barcode}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-medium">{item.quantitySent}x</p>
                {item.quantityReceived !== null && (
                  <p className="text-xs text-muted-foreground">
                    Recebido: {item.quantityReceived}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 bg-background pt-4 pb-2 -mx-4 px-4 border-t border-border/40 space-y-2">
        {canExecute && (
          <Button className="w-full" onClick={onExecute} disabled={isExecuting}>
            {isExecuting ? "Enviando..." : "Executar Transferência"}
          </Button>
        )}

        {canStartValidation && (
          <Button
            className="w-full"
            onClick={onStartValidation}
            disabled={isStartingValidation}
          >
            {isStartingValidation ? "Iniciando..." : "Iniciar Validação"}
          </Button>
        )}

        {canValidate && (
          <Button className="w-full" asChild>
            <Link href={`/transfers/${transfer.id}/validate`}>
              Continuar Validação
            </Link>
          </Button>
        )}

        {canCancel && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowCancelDialog(true)}
          >
            Cancelar Transferência
          </Button>
        )}
      </div>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Transferência</DialogTitle>
            <DialogDescription>
              Informe o motivo do cancelamento.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Motivo do cancelamento"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={() => onCancel(cancelReason)}
              disabled={isCancelling || !cancelReason.trim()}
            >
              {isCancelling ? "Cancelando..." : "Confirmar Cancelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
