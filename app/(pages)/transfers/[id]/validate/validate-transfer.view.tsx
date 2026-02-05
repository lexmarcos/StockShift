import { Check, AlertTriangle, ScanLine, Package, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";

export function ValidateTransferView({
  isLoading,
  isProcessing,
  transfer,
  expectedItems,
  progress,
  lastScanResult,
  barcode,
  onBarcodeChange,
  onScan,
  inputRef,
  onFinish,
  showFinishModal,
  setShowFinishModal,
  discrepancies,
  onConfirmFinish,
  isFinishing,
}: ValidateTransferViewProps) {
  if (isLoading || !transfer) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-neutral-500">Carregando dados da transferência...</div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onScan();
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Progress Bar */}
      <div className="border-b border-neutral-800 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-3">
            <div>
              <h2 className="text-lg font-bold leading-none text-white">Validação #{transfer.code}</h2>
              <p className="text-xs text-neutral-500 mt-1">
                {transfer.sourceWarehouseName} → {transfer.destinationWarehouseName}
              </p>
            </div>
          </div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-neutral-500">Progresso</span>
            <span className="font-mono font-bold text-white">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-7xl mx-auto">
        {/* Scanner Input */}
        <Card className="border-l-4 border-l-blue-600 bg-[#171717] border-neutral-800 rounded-[4px]">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <ScanLine className="absolute left-3 top-2.5 h-5 w-5 text-blue-500" strokeWidth={2} />
                <Input
                  ref={inputRef}
                  value={barcode}
                  onChange={(e) => onBarcodeChange(e.target.value)}
                  placeholder="Escanear código de barras..."
                  className="pl-10 h-10 bg-neutral-900 border-neutral-800 focus-visible:ring-blue-600 rounded-[4px]"
                  autoComplete="off"
                  disabled={isProcessing}
                />
              </div>
              <Button
                type="submit"
                disabled={!barcode.trim() || isProcessing}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide uppercase rounded-[4px]"
              >
                Scan
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Last Scan Result */}
        {lastScanResult && (
          <Card className={cn(
            "border-l-4 bg-[#171717] border-neutral-800 rounded-[4px]",
            lastScanResult.valid ? "border-l-emerald-600" : "border-l-rose-600"
          )}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded-[4px]",
                  lastScanResult.valid ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                )}>
                  {lastScanResult.valid ? <Check className="h-5 w-5" strokeWidth={2} /> : <AlertCircle className="h-5 w-5" strokeWidth={2} />}
                </div>
                <div>
                  <p className="font-bold text-sm text-white">
                    {lastScanResult.valid ? "Sucesso" : "Erro"}
                  </p>
                  <p className="text-sm font-medium mt-1 text-neutral-300">{lastScanResult.productName}</p>
                  <p className="text-xs text-neutral-500 font-mono mt-1">Código: {lastScanResult.productBarcode}</p>
                  {lastScanResult.valid && (
                    <p className="text-xs text-neutral-400 mt-1">
                      Recebido: {lastScanResult.quantityReceived} / {lastScanResult.quantitySent}
                    </p>
                  )}
                  {!lastScanResult.valid && lastScanResult.message && (
                    <p className="text-xs text-rose-500 mt-2 font-medium">{lastScanResult.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expected Items List */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-3">Itens Esperados</h2>
          <div className="space-y-3">
            {expectedItems.map((item) => {
              const isComplete = item.scannedQuantity >= item.expectedQuantity;
              const isOverage = item.scannedQuantity > item.expectedQuantity;

              return (
                <Card key={item.id} className={cn(
                  "bg-[#171717] border-neutral-800 rounded-[4px]",
                  isComplete && "opacity-60"
                )}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-[4px]",
                        isComplete ? "bg-emerald-500/10 text-emerald-500" :
                        isOverage ? "bg-rose-500/10 text-rose-500" : "bg-neutral-800 text-neutral-400"
                      )}>
                        {isComplete ? <Check className="h-4 w-4" strokeWidth={2} /> :
                         isOverage ? <AlertTriangle className="h-4 w-4" strokeWidth={2} /> : <Package className="h-4 w-4" strokeWidth={2} />}
                      </div>
                      <div>
                        <p className={cn("font-medium text-sm", isComplete ? "text-neutral-500 line-through" : "text-white")}>
                          {item.productName}
                        </p>
                        <p className="text-xs text-neutral-500 font-mono">
                          {item.batchCode}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "text-sm font-bold font-mono",
                        isComplete ? "text-emerald-500" :
                        isOverage ? "text-rose-500" : "text-neutral-200"
                      )}>
                        {item.scannedQuantity} / {item.expectedQuantity}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="fixed bottom-0 left-0 right-0 md:ml-[240px] p-4 bg-[#0A0A0A] border-t border-neutral-800">
        <div className="max-w-7xl mx-auto">
          <Button
            className="w-full h-12 text-base font-bold tracking-wide uppercase bg-emerald-600 hover:bg-emerald-700 text-white rounded-[4px]"
            onClick={onFinish}
            disabled={isFinishing || expectedItems.every((i) => i.scannedQuantity === 0)}
          >
            Finalizar Validação
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showFinishModal} onOpenChange={setShowFinishModal}>
        <DialogContent className="bg-[#171717] border-neutral-800 text-neutral-200 max-h-[80vh] overflow-y-auto rounded-[4px]">
          <DialogHeader>
            <DialogTitle className="text-white">Confirmar Validação</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Revise o relatório de discrepâncias antes de finalizar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {discrepancies.length === 0 ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[4px] p-4 flex items-center gap-3">
                <Check className="h-5 w-5 text-emerald-500" strokeWidth={2} />
                <span className="text-sm font-medium text-emerald-500">Nenhuma discrepância encontrada. Tudo certo!</span>
              </div>
            ) : (
              <div className="space-y-3">
                {discrepancies.map((disc, idx) => (
                  <div key={idx} className={cn(
                    "p-3 rounded-[4px] border text-sm",
                    disc.discrepancyType === "OVERAGE"
                      ? "bg-rose-500/10 border-rose-500/20"
                      : "bg-amber-500/10 border-amber-500/20"
                  )}>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-white">{disc.productName}</span>
                      <span className={disc.discrepancyType === "OVERAGE" ? "text-rose-500" : "text-amber-500"}>
                        {disc.discrepancyType === "OVERAGE" ? "EXCESSO" : "FALTA"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-neutral-400">
                      <span>Esperado: {disc.quantitySent}</span>
                      <span>Recebido: {disc.quantityReceived}</span>
                      <span className="font-mono font-bold text-white">Dif: {disc.difference}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-neutral-900 rounded-[4px] p-4 text-xs text-neutral-500">
              <p>Ao confirmar, o estoque será atualizado conforme a quantidade recebida. Itens faltantes não serão adicionados ao estoque.</p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowFinishModal(false)} className="border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white rounded-[4px]">
              Voltar
            </Button>
            <Button onClick={onConfirmFinish} disabled={isFinishing} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-[4px]">
              {isFinishing ? "Processando..." : "Confirmar e Finalizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
