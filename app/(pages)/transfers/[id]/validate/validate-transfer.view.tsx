"use client";

import { Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ValidateTransferViewProps } from "./validate-transfer.types";

interface ExtendedViewProps extends ValidateTransferViewProps {
  confirmComplete: () => Promise<void>;
}

export const ValidateTransferView = ({
  transfer,
  isLoading,
  barcode,
  setBarcode,
  onScan,
  isScanning,
  lastScanResult,
  onComplete,
  isCompleting,
  showConfirmDialog,
  setShowConfirmDialog,
  discrepancies,
  progress,
  confirmComplete,
}: ExtendedViewProps) => {
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

  const progressPercent = progress.total > 0
    ? Math.round((progress.received / progress.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onScan();
          }}
        >
          <div className="flex gap-2">
            <Input
              placeholder="Escanear ou digitar código de barras"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              autoFocus
              className="flex-1"
            />
            <Button type="submit" disabled={isScanning || !barcode.trim()}>
              {isScanning ? "..." : "OK"}
            </Button>
          </div>
        </form>

        {lastScanResult && (
          <div
            className={`flex items-center gap-2 p-2 rounded text-sm ${
              lastScanResult.valid
                ? "bg-green-500/10 text-green-500"
                : "bg-yellow-500/10 text-yellow-500"
            }`}
          >
            {lastScanResult.valid ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span>
              {lastScanResult.productName}: {lastScanResult.message}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progresso</span>
          <span>
            {progress.received}/{progress.total} itens ({progressPercent}%)
          </span>
        </div>
        <Progress value={progressPercent} />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Itens</p>
        {transfer.items.map((item) => {
          const received = item.quantityReceived || 0;
          const isComplete = received >= item.quantitySent;
          const hasOverage = received > item.quantitySent;

          return (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                isComplete
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-border/60"
              }`}
            >
              <div className="flex items-center gap-2">
                {isComplete && <Check className="h-4 w-4 text-green-500" />}
                <div>
                  <p className="font-medium text-sm">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.product.barcode}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {received}/{item.quantitySent}
                </p>
                {hasOverage && (
                  <Badge variant="outline" className="text-yellow-500">
                    +{received - item.quantitySent}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 bg-background pt-4 pb-2 -mx-4 px-4 border-t border-border/40">
        <Button
          className="w-full"
          onClick={onComplete}
          disabled={isCompleting}
        >
          {isCompleting ? "Finalizando..." : "Finalizar Validação"}
        </Button>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Confirmar Finalização
            </DialogTitle>
            <DialogDescription>
              Foram encontradas diferenças na transferência.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {discrepancies.filter((d) => d.type === "SHORTAGE").length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-500 mb-1">
                  Faltas
                </p>
                {discrepancies
                  .filter((d) => d.type === "SHORTAGE")
                  .map((d, i) => (
                    <p key={i} className="text-sm text-muted-foreground">
                      • {d.productName}: esperado {d.expected}, recebido{" "}
                      {d.received}
                    </p>
                  ))}
              </div>
            )}

            {discrepancies.filter((d) => d.type === "OVERAGE").length > 0 && (
              <div>
                <p className="text-sm font-medium text-yellow-500 mb-1">
                  Sobras
                </p>
                {discrepancies
                  .filter((d) => d.type === "OVERAGE")
                  .map((d, i) => (
                    <p key={i} className="text-sm text-muted-foreground">
                      • {d.productName}: esperado {d.expected}, recebido{" "}
                      {d.received}
                    </p>
                  ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Voltar
            </Button>
            <Button onClick={confirmComplete} disabled={isCompleting}>
              {isCompleting ? "Finalizando..." : "Confirmar e Finalizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
