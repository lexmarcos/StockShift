"use client";

import { useState, useEffect, useRef } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import {
  ArrowLeft,
  Loader2,
  ScanLine,
  Check,
  Circle,
  CircleDot,
  CheckCircle2,
  AlertTriangle,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ValidationViewProps, ValidationItem } from "./validation.types";

export const ValidationView = ({
  items,
  progress,
  isLoading,
  isScanning,
  isCompleting,
  lastScanResult,
  onScan,
  onComplete,
  onBack,
  showCompleteModal,
  onCompleteModalChange,
  hasDiscrepancies,
  discrepancies,
}: ValidationViewProps) => {
  const [scannerKey, setScannerKey] = useState(0);
  const lastScannedRef = useRef<string | null>(null);

  // Reset scanner after each scan to allow scanning same barcode again
  useEffect(() => {
    if (lastScanResult) {
      const timer = setTimeout(() => {
        setScannerKey((prev) => prev + 1);
        lastScannedRef.current = null;
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [lastScanResult]);

  const handleScan = (detectedCodes: { rawValue: string }[]) => {
    if (detectedCodes.length > 0 && !isScanning) {
      const barcode = detectedCodes[0].rawValue;
      if (barcode !== lastScannedRef.current) {
        lastScannedRef.current = barcode;
        onScan(barcode);
      }
    }
  };

  const getItemStatusIcon = (item: ValidationItem) => {
    switch (item.status) {
      case "COMPLETE":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "PARTIAL":
        return <CircleDot className="h-4 w-4 text-amber-500" />;
      case "PENDING":
      default:
        return <Circle className="h-4 w-4 text-neutral-600" />;
    }
  };

  const getItemStatusStyle = (item: ValidationItem) => {
    switch (item.status) {
      case "COMPLETE":
        return "border-l-emerald-500 bg-emerald-500/5";
      case "PARTIAL":
        return "border-l-amber-500 bg-amber-500/5";
      case "PENDING":
      default:
        return "border-l-neutral-700 bg-neutral-900/50";
    }
  };

  const progressPercentage =
    progress.totalItems > 0
      ? Math.round((progress.completeItems / progress.totalItems) * 100)
      : 0;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-xs uppercase tracking-wide text-neutral-500">
            Carregando validação...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24 font-sans text-neutral-200">
      <main className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Scanner Section */}
          <div className="space-y-4">
            {/* Scanner */}
            <div className="relative aspect-[4/3] bg-black rounded-[4px] overflow-hidden border border-neutral-800">
              <Scanner
                key={scannerKey}
                onScan={handleScan}
                formats={[
                  "ean_13",
                  "ean_8",
                  "code_128",
                  "code_39",
                  "upc_a",
                  "upc_e",
                ]}
                components={{
                  finder: false,
                }}
                styles={{
                  container: { width: "100%", height: "100%" },
                  video: { objectFit: "cover" },
                }}
              />
              {/* Scan Line Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#00FF41] shadow-[0_0_10px_#00FF41] animate-pulse" />
                {/* Corner Markers */}
                <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#00FF41]" />
                <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#00FF41]" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#00FF41]" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#00FF41]" />
              </div>

              {/* Scanning Indicator */}
              {isScanning && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-[#00FF41]" />
                    <span className="text-xs text-[#00FF41] font-mono uppercase">
                      Processando...
                    </span>
                  </div>
                </div>
              )}

              {/* Last Scan Result */}
              {lastScanResult && !isScanning && (
                <div
                  className={cn(
                    "absolute bottom-0 left-0 right-0 p-3 text-center",
                    lastScanResult.success
                      ? "bg-emerald-500/90"
                      : "bg-rose-500/90"
                  )}
                >
                  <span className="text-xs font-bold uppercase text-white">
                    {lastScanResult.message}
                  </span>
                </div>
              )}

              <div className="absolute bottom-4 left-0 right-0 text-center">
                {!lastScanResult && !isScanning && (
                  <p className="text-xs text-[#00FF41] font-mono uppercase tracking-wider">
                    Posicione o código de barras
                  </p>
                )}
              </div>
            </div>

            {/* Progress Card */}
            <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                  Progresso
                </h3>
                <Badge
                  variant="outline"
                  className="rounded-[2px] border-neutral-700 bg-neutral-800 text-[10px] text-neutral-400"
                >
                  {progress.completeItems}/{progress.totalItems} ITENS
                </Badge>
              </div>

              <Progress
                value={progressPercentage}
                className="h-2 bg-neutral-800"
              />

              <div className="flex items-center justify-between mt-3 text-[10px] text-neutral-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    {progress.completeItems} completos
                  </span>
                  <span className="flex items-center gap-1">
                    <CircleDot className="h-3 w-3 text-amber-500" />
                    {progress.partialItems} parciais
                  </span>
                  <span className="flex items-center gap-1">
                    <Circle className="h-3 w-3 text-neutral-600" />
                    {progress.pendingItems} pendentes
                  </span>
                </div>
                <span className="font-mono font-bold text-white">
                  {progressPercentage}%
                </span>
              </div>
            </div>
          </div>

          {/* Items List Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Itens para Validar
              </h3>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.itemId}
                  className={cn(
                    "rounded-[4px] border border-neutral-800 p-3 border-l-4",
                    getItemStatusStyle(item)
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {getItemStatusIcon(item)}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-white block truncate">
                          {item.productName}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {item.barcode}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-sm font-bold text-white">
                        {item.scannedQuantity}/{item.expectedQuantity}
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-[2px] text-[9px] uppercase mt-1",
                          item.status === "COMPLETE" &&
                            "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
                          item.status === "PARTIAL" &&
                            "border-amber-500/30 bg-amber-500/10 text-amber-500",
                          item.status === "PENDING" &&
                            "border-neutral-700 bg-neutral-800 text-neutral-500"
                        )}
                      >
                        {item.status === "COMPLETE" && "Completo"}
                        {item.status === "PARTIAL" && "Parcial"}
                        {item.status === "PENDING" && "Pendente"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Footer Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0A0A0A]/95 backdrop-blur-sm border-t border-neutral-800 md:ml-[240px] z-40">
        <div className="mx-auto max-w-7xl">
          <Button
            onClick={() => onCompleteModalChange(true)}
            disabled={isCompleting}
            className={cn(
              "w-full h-12 rounded-[4px] text-xs font-bold uppercase tracking-wide text-white",
              hasDiscrepancies
                ? "bg-amber-600 hover:bg-amber-700 shadow-[0_0_20px_-5px_rgba(245,158,11,0.3)]"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-[0_0_20px_-5px_rgba(5,150,105,0.3)]"
            )}
          >
            {isCompleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Concluindo...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Concluir Validação
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Complete Confirmation Modal */}
      <AlertDialog open={showCompleteModal} onOpenChange={onCompleteModalChange}>
        <AlertDialogContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-200 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold uppercase tracking-wide text-white flex items-center gap-2">
              {hasDiscrepancies ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Concluir com Divergência?
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 text-emerald-500" />
                  Concluir Validação?
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-neutral-500">
              {hasDiscrepancies
                ? "Alguns itens não foram totalmente recebidos. Um relatório de divergência será gerado."
                : "Todos os itens foram validados com sucesso."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {hasDiscrepancies && (
            <div className="my-4 space-y-2 max-h-48 overflow-y-auto">
              {discrepancies.map((d) => (
                <div
                  key={d.productId}
                  className="flex items-center justify-between p-2 rounded-[2px] bg-amber-500/10 border border-amber-500/20"
                >
                  <span className="text-xs text-neutral-300 truncate flex-1">
                    {d.productName}
                  </span>
                  <div className="text-xs text-right ml-2">
                    <span className="text-neutral-500">Esperado: </span>
                    <span className="text-white font-mono">{d.expected}</span>
                    <span className="text-neutral-500 ml-2">Recebido: </span>
                    <span className="text-amber-500 font-mono">{d.received}</span>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                <span className="text-xs font-bold text-neutral-400">
                  Total Faltando
                </span>
                <span className="text-sm font-mono font-bold text-amber-500">
                  {discrepancies.reduce((sum, d) => sum + d.missing, 0)} itens
                </span>
              </div>
            </div>
          )}

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-[4px] border-neutral-700 bg-transparent text-xs uppercase hover:bg-neutral-800 hover:text-white">
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onComplete}
              disabled={isCompleting}
              className={cn(
                "rounded-[4px] text-xs font-bold uppercase tracking-wide text-white",
                hasDiscrepancies
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              {isCompleting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Concluindo...
                </>
              ) : (
                "Confirmar Conclusão"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
