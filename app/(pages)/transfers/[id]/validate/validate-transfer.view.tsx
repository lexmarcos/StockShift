"use client";

import { useState } from "react";
import {
  Check,
  AlertTriangle,
  ScanLine,
  Package,
  AlertCircle,
  Camera,
  Truck,
  Target,
  Zap,
  X,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { Scanner, IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { FixedBottomBar } from "@/components/ui/fixed-bottom-bar";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { SectionLabel } from "@/components/ui/section-label";
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
  const [showScanner, setShowScanner] = useState(false);

  if (isLoading || !transfer) {
    return (
      <PageContainer>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 animate-ping rounded-full border-2 border-blue-600/30" />
            <div className="absolute inset-2 animate-pulse rounded-full border-2 border-blue-600/50" />
            <div className="absolute inset-4 rounded-full bg-blue-600/20" />
            <Truck className="absolute inset-0 m-auto h-6 w-6 text-blue-500" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">
            Carregando validação...
          </p>
        </div>
      </PageContainer>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onScan();
  };

  const handleCameraScan = (detectedCodes: IDetectedBarcode[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const code = detectedCodes[0].rawValue;
      onBarcodeChange(code);
      setShowScanner(false);
      // Trigger scan after a brief delay to allow state update
      setTimeout(() => {
        onScan();
      }, 100);
    }
  };

  const completedItems = expectedItems.filter(
    (i) => i.scannedQuantity >= i.expectedQuantity
  ).length;
  const totalItems = expectedItems.length;
  const totalExpected = expectedItems.reduce(
    (acc, i) => acc + i.expectedQuantity,
    0
  );
  const totalScanned = expectedItems.reduce(
    (acc, i) => acc + i.scannedQuantity,
    0
  );

  // Calculate arc for circular progress
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <PageContainer bottomPadding="fixed-bar">
      <PageHeader
        title={`Validação ${transfer.code}`}
        subtitle={`${transfer.sourceWarehouseName} → ${transfer.destinationWarehouseName}`}
      />

      {/* ── Mission Control Header ── */}
      <div className="mb-6 rounded-[4px] border border-neutral-800 bg-[#171717] p-5">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          {/* Circular Progress */}
          <div className="relative flex items-center justify-center">
            <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="#262626"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke={progress === 100 ? "#059669" : "#2563EB"}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-mono text-3xl font-bold tracking-tighter text-white">
                {Math.round(progress)}%
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                Validado
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid flex-1 grid-cols-3 gap-4 md:max-w-md">
            <div className="rounded-[4px] border border-neutral-800 bg-neutral-900/50 p-4 text-center">
              <div className="mb-1 flex items-center justify-center gap-1">
                <Target className="h-4 w-4 text-blue-500" strokeWidth={2} />
              </div>
              <p className="font-mono text-2xl font-bold tracking-tighter text-white">
                {totalExpected}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                Esperado
              </p>
            </div>
            <div className="rounded-[4px] border border-neutral-800 bg-neutral-900/50 p-4 text-center">
              <div className="mb-1 flex items-center justify-center gap-1">
                <Zap className="h-4 w-4 text-amber-500" strokeWidth={2} />
              </div>
              <p className="font-mono text-2xl font-bold tracking-tighter text-white">
                {totalScanned}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                Escaneado
              </p>
            </div>
            <div className="rounded-[4px] border border-neutral-800 bg-neutral-900/50 p-4 text-center">
              <div className="mb-1 flex items-center justify-center gap-1">
                <CheckCircle2
                  className="h-4 w-4 text-emerald-500"
                  strokeWidth={2}
                />
              </div>
              <p className="font-mono text-2xl font-bold tracking-tighter text-white">
                {completedItems}/{totalItems}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                Itens OK
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Scanner Input Section ── */}
      <div className="mb-6 rounded-[4px] border-l-4 border-l-blue-600 border border-neutral-800 bg-[#171717] p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[4px] border border-blue-600/50 bg-blue-600/10">
            <ScanLine className="h-5 w-5 text-blue-400" strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Scanner de Validação</p>
            <p className="text-xs text-neutral-500">
              Escaneie o código de barras do produto
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="relative min-w-0 flex-1">
            <Input
              ref={inputRef}
              value={barcode}
              onChange={(e) => onBarcodeChange(e.target.value)}
              placeholder="Digite ou escaneie o código..."
              className="h-12 w-full rounded-[4px] border-2 border-neutral-800 bg-neutral-900 pl-4 pr-12 font-mono text-sm text-white placeholder:text-neutral-600 focus:border-blue-600"
              autoComplete="off"
              disabled={isProcessing}
            />
            {/* Camera Button inside input */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowScanner(true)}
              className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-[4px] text-neutral-500 hover:bg-blue-600/10 hover:text-blue-400"
            >
              <Camera className="h-5 w-5" strokeWidth={2} />
            </Button>
          </div>
          <Button
            type="submit"
            disabled={!barcode.trim() || isProcessing}
            className="h-12 rounded-[4px] bg-blue-600 px-6 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
          >
            {isProcessing ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              "VALIDAR"
            )}
          </Button>
        </form>
      </div>

      {/* ── Last Scan Result ── */}
      {lastScanResult && (
        <div
          className={cn(
            "mb-6 rounded-[4px] border-l-4 border border-neutral-800 bg-[#171717] p-4",
            lastScanResult.valid ? "border-l-emerald-600" : "border-l-rose-600"
          )}
        >
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[4px]",
                lastScanResult.valid
                  ? "border border-emerald-600/50 bg-emerald-600/10"
                  : "border border-rose-600/50 bg-rose-600/10"
              )}
            >
              {lastScanResult.valid ? (
                <Check
                  className="h-6 w-6 text-emerald-500"
                  strokeWidth={2.5}
                />
              ) : (
                <X className="h-6 w-6 text-rose-500" strokeWidth={2.5} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={cn(
                    "text-xs font-bold uppercase tracking-wide",
                    lastScanResult.valid ? "text-emerald-500" : "text-rose-500"
                  )}
                >
                  {lastScanResult.valid ? "VALIDADO" : "ERRO"}
                </span>
              </div>
              <p className="truncate text-sm font-bold text-white">
                {lastScanResult.productName}
              </p>
              <p className="mt-1 font-mono text-xs text-neutral-500">
                {lastScanResult.productBarcode}
              </p>
              {lastScanResult.valid && (
                <div className="mt-2 inline-flex items-center gap-2 rounded-[4px] bg-neutral-900/50 px-3 py-1.5">
                  <span className="text-xs text-neutral-500">Contagem:</span>
                  <span className="font-mono text-sm font-bold tracking-tighter text-white">
                    {lastScanResult.quantityReceived} /{" "}
                    {lastScanResult.quantitySent}
                  </span>
                </div>
              )}
              {!lastScanResult.valid && lastScanResult.message && (
                <p className="mt-2 text-xs font-medium text-rose-400">
                  {lastScanResult.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Expected Items List ── */}
      <div>
        <SectionLabel icon={Package} className="mb-4">
          Itens da Transferência ({completedItems}/{totalItems})
        </SectionLabel>

        <div className="space-y-3">
          {expectedItems.map((item) => {
            const isComplete = item.scannedQuantity >= item.expectedQuantity;
            const isOverage = item.scannedQuantity > item.expectedQuantity;
            const progressPercent = Math.min(
              100,
              (item.scannedQuantity / item.expectedQuantity) * 100
            );

            return (
              <div
                key={item.id}
                className={cn(
                  "relative overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717]",
                  isComplete && "opacity-60"
                )}
              >
                {/* Progress bar background */}
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 transition-all duration-500",
                    isComplete
                      ? "bg-emerald-600/10"
                      : isOverage
                        ? "bg-rose-600/10"
                        : "bg-blue-600/5"
                  )}
                  style={{ width: `${progressPercent}%` }}
                />

                <div className="relative flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[4px]",
                        isComplete
                          ? "border border-emerald-600/50 bg-emerald-600/10 text-emerald-500"
                          : isOverage
                            ? "border border-rose-600/50 bg-rose-600/10 text-rose-500"
                            : "border border-neutral-700 bg-neutral-800 text-neutral-400"
                      )}
                    >
                      {isComplete ? (
                        <Check className="h-5 w-5" strokeWidth={2.5} />
                      ) : isOverage ? (
                        <AlertTriangle className="h-5 w-5" strokeWidth={2} />
                      ) : (
                        <Package className="h-5 w-5" strokeWidth={2} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "truncate text-sm font-medium",
                          isComplete
                            ? "text-neutral-500 line-through"
                            : "text-white"
                        )}
                      >
                        {item.productName}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-neutral-500">
                        {item.batchCode}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "rounded-[4px] px-3 py-1.5 font-mono text-sm font-bold tracking-tighter",
                        isComplete
                          ? "bg-emerald-600/10 text-emerald-500"
                          : isOverage
                            ? "bg-rose-600/10 text-rose-500"
                            : "bg-neutral-800 text-neutral-200"
                      )}
                    >
                      {item.scannedQuantity} / {item.expectedQuantity}
                    </div>
                    <ChevronRight className="h-4 w-4 text-neutral-600" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Camera Scanner Modal ── */}
      <ResponsiveModal
        open={showScanner}
        onOpenChange={setShowScanner}
        title="Scanner de Câmera"
        description="Posicione o código de barras dentro da área de leitura"
        footer={
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowScanner(false)}
            className="w-full rounded-[4px] border-neutral-800 text-xs font-bold uppercase tracking-wide md:w-auto"
          >
            Cancelar
          </Button>
        }
      >
        <div className="relative overflow-hidden rounded-[4px] border border-neutral-800 bg-black">
          <Scanner
            onScan={handleCameraScan}
            onError={(error) => console.error("Camera error:", error)}
            formats={[
              "qr_code",
              "ean_13",
              "ean_8",
              "code_128",
              "code_39",
              "upc_a",
              "upc_e",
            ]}
            styles={{
              container: {
                width: "100%",
                height: "280px",
              },
              video: {
                objectFit: "cover",
              },
            }}
            components={{
              onOff: false,
              torch: false,
              zoom: false,
              finder: true,
            }}
          />

          {/* Scan line animation */}
          <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.8)]" />

          {/* Corner markers */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-6 top-6 h-8 w-8 border-l-2 border-t-2 border-blue-500" />
            <div className="absolute right-6 top-6 h-8 w-8 border-r-2 border-t-2 border-blue-500" />
            <div className="absolute bottom-6 left-6 h-8 w-8 border-b-2 border-l-2 border-blue-500" />
            <div className="absolute bottom-6 right-6 h-8 w-8 border-b-2 border-r-2 border-blue-500" />
          </div>

          {/* Instructions overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4">
            <div className="flex items-center justify-center gap-2 text-center">
              <ScanLine className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wide text-blue-400">
                Leitura Automática Ativa
              </span>
            </div>
          </div>
        </div>
      </ResponsiveModal>

      {/* ── Fixed Bottom Bar ── */}
      <FixedBottomBar>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="hidden items-center gap-4 text-xs text-neutral-500 sm:flex">
            <span>
              <span className="font-mono font-bold tracking-tighter text-neutral-300">
                {totalScanned}
              </span>{" "}
              de{" "}
              <span className="font-mono font-bold tracking-tighter text-neutral-300">
                {totalExpected}
              </span>{" "}
              unidades
            </span>
          </div>
          <Button
            onClick={onFinish}
            disabled={
              isFinishing || expectedItems.every((i) => i.scannedQuantity === 0)
            }
            className="h-11 flex-1 rounded-[4px] bg-emerald-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-emerald-700 sm:flex-none sm:px-8"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" strokeWidth={2} />
            Finalizar Validação
          </Button>
        </div>
      </FixedBottomBar>

      {/* ── Confirmation Modal ── */}
      <ResponsiveModal
        open={showFinishModal}
        onOpenChange={setShowFinishModal}
        title="Confirmar Validação"
        description="Revise o relatório antes de finalizar"
        maxWidth="sm:max-w-[500px]"
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowFinishModal(false)}
              className="rounded-[4px] border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white"
            >
              Voltar
            </Button>
            <Button
              onClick={onConfirmFinish}
              disabled={isFinishing}
              className="rounded-[4px] bg-emerald-600 font-bold text-white hover:bg-emerald-700"
            >
              {isFinishing ? "Processando..." : "Confirmar e Finalizar"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          {discrepancies.length === 0 ? (
            <div className="flex items-center gap-4 rounded-[4px] border border-emerald-600/30 bg-emerald-600/10 p-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600/20">
                <CheckCircle2
                  className="h-6 w-6 text-emerald-500"
                  strokeWidth={2}
                />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-400">
                  Validação Perfeita
                </p>
                <p className="text-xs text-emerald-500/80">
                  Todas as quantidades conferem com o esperado.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-500">
                <AlertCircle className="h-4 w-4" strokeWidth={2} />
                <span className="text-xs font-bold uppercase tracking-wide">
                  {discrepancies.length} Discrepância
                  {discrepancies.length > 1 ? "s" : ""} Encontrada
                  {discrepancies.length > 1 ? "s" : ""}
                </span>
              </div>
              {discrepancies.map((disc, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "rounded-[4px] border p-4",
                    disc.discrepancyType === "OVERAGE"
                      ? "border-rose-600/30 bg-rose-600/10"
                      : "border-amber-600/30 bg-amber-600/10"
                  )}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-white">
                      {disc.productName}
                    </span>
                    <span
                      className={cn(
                        "rounded-[4px] px-2 py-0.5 text-[10px] font-bold uppercase",
                        disc.discrepancyType === "OVERAGE"
                          ? "bg-rose-600/20 text-rose-400"
                          : "bg-amber-600/20 text-amber-400"
                      )}
                    >
                      {disc.discrepancyType === "OVERAGE" ? "Excesso" : "Falta"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex gap-4 text-neutral-400">
                      <span>Esperado: {disc.quantitySent}</span>
                      <span>Recebido: {disc.quantityReceived}</span>
                    </div>
                    <span
                      className={cn(
                        "font-mono font-bold",
                        disc.discrepancyType === "OVERAGE"
                          ? "text-rose-400"
                          : "text-amber-400"
                      )}
                    >
                      {disc.difference > 0 ? "+" : ""}
                      {disc.difference}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-[4px] border border-neutral-800 bg-neutral-900/50 p-4">
            <p className="text-xs text-neutral-500">
              <strong className="text-neutral-400">Atenção:</strong> Ao
              confirmar, o estoque será atualizado conforme as quantidades
              recebidas. Itens faltantes não serão adicionados ao inventário.
            </p>
          </div>
        </div>
      </ResponsiveModal>
    </PageContainer>
  );
}
