"use client";

import {
  useState,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import { type IDetectedBarcode } from "@yudiel/react-qr-scanner";
import {
  AlertCircle,
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Package,
  ScanLine,
  Target,
  Truck,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FixedBottomBar } from "@/components/ui/fixed-bottom-bar";
import { Input } from "@/components/ui/input";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { BarcodeScanner } from "@/components/product/barcode-scanner";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/utils";
import type {
  ExpectedItem,
  ScanResultItem,
  ValidateTransferViewProps,
} from "./validate-transfer.types";

interface ValidateTransferViewState extends ValidateTransferViewProps {
  circumference: number;
  completedItems: number;
  handleCameraScan: (detectedCodes: IDetectedBarcode[]) => void;
  handleSubmit: (event: FormEvent) => void;
  radius: number;
  setShowScanner: Dispatch<SetStateAction<boolean>>;
  showScanner: boolean;
  strokeDashoffset: number;
  totalExpected: number;
  totalItems: number;
  totalScanned: number;
  transfer: NonNullable<ValidateTransferViewProps["transfer"]>;
}

export function ValidateTransferView(props: ValidateTransferViewProps) {
  const [showScanner, setShowScanner] = useState(false);

  if (props.isLoading || !props.transfer) {
    return <ValidateTransferLoading />;
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    props.onScan();
  };
  const handleCameraScan = (detectedCodes: IDetectedBarcode[]) => {
    if (!detectedCodes || detectedCodes.length === 0) return;
    props.onBarcodeChange(detectedCodes[0].rawValue);
    setShowScanner(false);
    setTimeout(() => props.onScan(), 100);
  };
  const completedItems = props.expectedItems.filter(
    (item) => item.scannedQuantity >= item.expectedQuantity,
  ).length;
  const totalExpected = props.expectedItems.reduce(
    (acc, item) => acc + item.expectedQuantity,
    0,
  );
  const totalScanned = props.expectedItems.reduce(
    (acc, item) => acc + item.scannedQuantity,
    0,
  );
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const viewState: ValidateTransferViewState = {
    ...props,
    circumference,
    completedItems,
    handleCameraScan,
    handleSubmit,
    radius,
    setShowScanner,
    showScanner,
    strokeDashoffset: circumference - (props.progress / 100) * circumference,
    totalExpected,
    totalItems: props.expectedItems.length,
    totalScanned,
    transfer: props.transfer,
  };

  return (
    <PageContainer bottomPadding="fixed-bar">
      <ValidateTransferHeader viewState={viewState} />
      <ValidationProgressPanel viewState={viewState} />
      <ValidationScannerPanel viewState={viewState} />
      <LastScanResultPanel result={props.lastScanResult} />
      <ExpectedItemsPanel viewState={viewState} />
      <CameraScannerModal viewState={viewState} />
      <ValidationBottomBar viewState={viewState} />
      <FinishConfirmationModal viewState={viewState} />
    </PageContainer>
  );
}

function ValidateTransferLoading() {
  return (
    <PageContainer>
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div className="relative size-16">
          <div className="absolute inset-0 animate-ping rounded-full border-2 border-blue-600/30" />
          <div className="absolute inset-2 animate-pulse rounded-full border-2 border-blue-600/50" />
          <div className="absolute inset-4 rounded-full bg-blue-600/20" />
          <Truck className="absolute inset-0 m-auto size-6 text-blue-500" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">
          Carregando validação…
        </p>
      </div>
    </PageContainer>
  );
}

function ValidateTransferHeader({
  viewState,
}: {
  viewState: ValidateTransferViewState;
}) {
  const { transfer } = viewState;

  return (
    <PageHeader
      title={`Validação ${transfer.code}`}
      subtitle={`${transfer.sourceWarehouseName} → ${transfer.destinationWarehouseName}`}
    />
  );
}

function ValidationProgressPanel({
  viewState,
}: {
  viewState: ValidateTransferViewState;
}) {
  return (
    <div className="mb-6 rounded-[4px] border border-neutral-800 bg-[#171717] p-5">
      <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
        <ValidationProgressRing viewState={viewState} />
        <ValidationStatsGrid viewState={viewState} />
      </div>
    </div>
  );
}

function ValidationProgressRing({
  viewState,
}: {
  viewState: ValidateTransferViewState;
}) {
  return (
    <div className="relative flex items-center justify-center">
      <svg className="size-32 -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={viewState.radius}
          stroke="#262626"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="60"
          cy="60"
          r={viewState.radius}
          stroke={viewState.progress === 100 ? "#059669" : "#2563EB"}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={viewState.circumference}
          strokeDashoffset={viewState.strokeDashoffset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono text-3xl font-bold tracking-tighter text-white">
          {Math.round(viewState.progress)}%
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          Validado
        </span>
      </div>
    </div>
  );
}

function ValidationStatsGrid({
  viewState,
}: {
  viewState: ValidateTransferViewState;
}) {
  return (
    <div className="grid flex-1 grid-cols-3 gap-4 md:max-w-md">
      <ValidationStatCard
        icon={<Target className="size-4 text-blue-500" strokeWidth={2} />}
        value={String(viewState.totalExpected)}
        label="Esperado"
      />
      <ValidationStatCard
        icon={<Zap className="size-4 text-amber-500" strokeWidth={2} />}
        value={String(viewState.totalScanned)}
        label="Escaneado"
      />
      <ValidationStatCard
        icon={<CheckCircle2 className="size-4 text-emerald-500" strokeWidth={2} />}
        value={`${viewState.completedItems}/${viewState.totalItems}`}
        label="Itens OK"
      />
    </div>
  );
}

function ValidationStatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[4px] border border-neutral-800 bg-neutral-900/50 p-4 text-center">
      <div className="mb-1 flex items-center justify-center gap-1">{icon}</div>
      <p className="font-mono text-2xl font-bold tracking-tighter text-white">
        {value}
      </p>
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
        {label}
      </p>
    </div>
  );
}

function ValidationScannerPanel({
  viewState,
}: {
  viewState: ValidateTransferViewState;
}) {
  return (
    <div className="mb-6 rounded-[4px] border border-l-4 border-neutral-800 border-l-blue-600 bg-[#171717] p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-[4px] border border-blue-600/50 bg-blue-600/10">
          <ScanLine className="size-5 text-blue-400" strokeWidth={2} />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Scanner de Validação</p>
          <p className="text-xs text-neutral-500">
            Escaneie o código de barras do produto
          </p>
        </div>
      </div>
      <form onSubmit={viewState.handleSubmit} className="flex gap-3">
        <div className="relative min-w-0 flex-1">
          <Input
            ref={viewState.inputRef}
            value={viewState.barcode}
            onChange={(event) => viewState.onBarcodeChange(event.target.value)}
            placeholder="Digite ou escaneie o código…"
            className="h-12 w-full rounded-[4px] border-2 border-neutral-800 bg-neutral-900 pr-12 pl-4 font-mono text-sm text-white placeholder:text-neutral-600 focus:border-blue-600"
            autoComplete="off"
            disabled={viewState.isProcessing}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => viewState.setShowScanner(true)}
            className="absolute top-1/2 right-2 size-8 -translate-y-1/2 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-blue-400"
          >
            <Camera className="size-5" strokeWidth={2} />
          </Button>
        </div>
        <Button
          type="submit"
          disabled={!viewState.barcode.trim() || viewState.isProcessing}
          className="h-12 rounded-[4px] bg-blue-600 px-6 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
        >
          {viewState.isProcessing ? (
            <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            "VALIDAR"
          )}
        </Button>
      </form>
    </div>
  );
}

function LastScanResultPanel({ result }: { result: ScanResultItem | null }) {
  if (!result) return null;

  return (
    <div
      className={cn(
        "mb-6 rounded-[4px] border border-l-4 border-neutral-800 bg-[#171717] p-4",
        result.valid ? "border-l-emerald-600" : "border-l-rose-600",
      )}
    >
      <div className="flex items-start gap-4">
        <LastScanResultIcon result={result} />
        <LastScanResultBody result={result} />
      </div>
    </div>
  );
}

function LastScanResultIcon({ result }: { result: ScanResultItem }) {
  return (
    <div
      className={cn(
        "flex size-12 flex-shrink-0 items-center justify-center rounded-[4px]",
        result.valid
          ? "border border-emerald-600/50 bg-emerald-600/10"
          : "border border-rose-600/50 bg-rose-600/10",
      )}
    >
      {result.valid ? (
        <Check className="size-6 text-emerald-500" strokeWidth={2.5} />
      ) : (
        <X className="size-6 text-rose-500" strokeWidth={2.5} />
      )}
    </div>
  );
}

function LastScanResultBody({ result }: { result: ScanResultItem }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 flex items-center gap-2">
        <span
          className={cn(
            "text-xs font-bold uppercase tracking-wide",
            result.valid ? "text-emerald-500" : "text-rose-500",
          )}
        >
          {result.valid ? "VALIDADO" : "ERRO"}
        </span>
      </div>
      <p className="truncate text-sm font-bold text-white">
        {result.productName}
      </p>
      <p className="mt-1 font-mono text-xs text-neutral-500">
        {result.productBarcode}
      </p>
      {result.valid && (
        <div className="mt-2 inline-flex items-center gap-2 rounded-[4px] bg-neutral-900/50 px-3 py-1.5">
          <span className="text-xs text-neutral-500">Contagem:</span>
          <span className="font-mono text-sm font-bold tracking-tighter text-white">
            {result.quantityReceived} / {result.quantitySent}
          </span>
        </div>
      )}
      {!result.valid && result.message && (
        <p className="mt-2 text-xs font-medium text-rose-400">
          {result.message}
        </p>
      )}
    </div>
  );
}

function ExpectedItemsPanel({
  viewState,
}: {
  viewState: ValidateTransferViewState;
}) {
  return (
    <div>
      <SectionLabel icon={Package} className="mb-4">
        Itens da Transferência ({viewState.completedItems}/{viewState.totalItems})
      </SectionLabel>
      <div className="space-y-3">
        {viewState.expectedItems.map((item) => (
          <ExpectedItemRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function ExpectedItemRow({ item }: { item: ExpectedItem }) {
  const isComplete = item.scannedQuantity >= item.expectedQuantity;
  const isOverage = item.scannedQuantity > item.expectedQuantity;
  const progressPercent = Math.min(
    100,
    (item.scannedQuantity / item.expectedQuantity) * 100,
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717]",
        isComplete && "opacity-60",
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 transition-all duration-500",
          isComplete
            ? "bg-emerald-600/10"
            : isOverage
              ? "bg-rose-600/10"
              : "bg-blue-600/5",
        )}
        style={{ width: `${progressPercent}%` }}
      />
      <div className="relative flex items-center justify-between p-4">
        <ExpectedItemIdentity
          isComplete={isComplete}
          isOverage={isOverage}
          item={item}
        />
        <ExpectedItemQuantity
          isComplete={isComplete}
          isOverage={isOverage}
          item={item}
        />
      </div>
    </div>
  );
}

function ExpectedItemIdentity({
  isComplete,
  isOverage,
  item,
}: {
  isComplete: boolean;
  isOverage: boolean;
  item: ExpectedItem;
}) {
  return (
    <div className="flex items-center gap-4">
      <div
        className={cn(
          "flex size-10 flex-shrink-0 items-center justify-center rounded-[4px]",
          isComplete
            ? "border border-emerald-600/50 bg-emerald-600/10 text-emerald-500"
            : isOverage
              ? "border border-rose-600/50 bg-rose-600/10 text-rose-500"
              : "border border-neutral-700 bg-neutral-800 text-neutral-400",
        )}
      >
        {isComplete ? (
          <Check className="size-5" strokeWidth={2.5} />
        ) : isOverage ? (
          <AlertTriangle className="size-5" strokeWidth={2} />
        ) : (
          <Package className="size-5" strokeWidth={2} />
        )}
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            "truncate text-sm font-medium",
            isComplete ? "text-neutral-500 line-through" : "text-white",
          )}
        >
          {item.productName}
        </p>
        <p className="mt-0.5 font-mono text-xs text-neutral-500">
          {item.batchCode}
        </p>
      </div>
    </div>
  );
}

function ExpectedItemQuantity({
  isComplete,
  isOverage,
  item,
}: {
  isComplete: boolean;
  isOverage: boolean;
  item: ExpectedItem;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "rounded-[4px] px-3 py-1.5 font-mono text-sm font-bold tracking-tighter",
          isComplete
            ? "bg-emerald-600/10 text-emerald-500"
            : isOverage
              ? "bg-rose-600/10 text-rose-500"
              : "bg-neutral-800 text-neutral-200",
        )}
      >
        {item.scannedQuantity} / {item.expectedQuantity}
      </div>
      <ChevronRight className="size-4 text-neutral-600" />
    </div>
  );
}

function CameraScannerModal({
  viewState,
}: {
  viewState: ValidateTransferViewState;
}) {
  return (
    <ResponsiveModal
      open={viewState.showScanner}
      onOpenChange={viewState.setShowScanner}
      title="Scanner de Câmera"
      description="Posicione o código de barras dentro da área de leitura"
      footer={
        <Button
          type="button"
          variant="outline"
          onClick={() => viewState.setShowScanner(false)}
          className="w-full rounded-[4px] border-neutral-800 text-xs font-bold uppercase tracking-wide md:w-auto"
        >
          Cancelar
        </Button>
      }
    >
      <div className="relative overflow-hidden rounded-[4px] border border-neutral-800 bg-[#0A0A0A]">
        <BarcodeScanner
          onScan={viewState.handleCameraScan}
          onError={(error) => console.error("Camera error:", error)}
          styles={{
            container: { width: "100%", height: "280px" },
            video: { objectFit: "cover" },
          }}
          components={{
            onOff: false,
            torch: false,
            zoom: false,
            finder: true,
          }}
        />
        <CameraScannerOverlay />
      </div>
    </ResponsiveModal>
  );
}

function CameraScannerOverlay() {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.8)]" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-6 left-6 size-8 border-t-2 border-l-2 border-blue-500" />
        <div className="absolute top-6 right-6 size-8 border-t-2 border-r-2 border-blue-500" />
        <div className="absolute bottom-6 left-6 size-8 border-b-2 border-l-2 border-blue-500" />
        <div className="absolute right-6 bottom-6 size-8 border-r-2 border-b-2 border-blue-500" />
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4">
        <div className="flex items-center justify-center gap-2 text-center">
          <ScanLine className="size-4 text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wide text-blue-400">
            Leitura Automática Ativa
          </span>
        </div>
      </div>
    </>
  );
}

function ValidationBottomBar({
  viewState,
}: {
  viewState: ValidateTransferViewState;
}) {
  const hasNoScans = viewState.expectedItems.every(
    (item) => item.scannedQuantity === 0,
  );

  return (
    <FixedBottomBar>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="hidden items-center gap-4 text-xs text-neutral-500 sm:flex">
          <span>
            <span className="font-mono font-bold tracking-tighter text-neutral-300">
              {viewState.totalScanned}
            </span>{" "}
            de{" "}
            <span className="font-mono font-bold tracking-tighter text-neutral-300">
              {viewState.totalExpected}
            </span>{" "}
            unidades
          </span>
        </div>
        <Button
          onClick={viewState.onFinish}
          disabled={viewState.isFinishing || hasNoScans}
          className="h-11 flex-1 rounded-[4px] bg-emerald-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-emerald-700 sm:flex-none sm:px-8"
        >
          <CheckCircle2 className="mr-2 size-4" strokeWidth={2} />
          Finalizar Validação
        </Button>
      </div>
    </FixedBottomBar>
  );
}

function FinishConfirmationModal({
  viewState,
}: {
  viewState: ValidateTransferViewState;
}) {
  return (
    <ResponsiveModal
      open={viewState.showFinishModal}
      onOpenChange={viewState.setShowFinishModal}
      title="Confirmar Validação"
      description="Revise o relatório antes de finalizar"
      maxWidth="sm:max-w-[500px]"
      footer={<FinishConfirmationFooter viewState={viewState} />}
    >
      <div className="space-y-4 py-2">
        <FinishDiscrepancySummary viewState={viewState} />
        <div className="rounded-[4px] border border-neutral-800 bg-neutral-900/50 p-4">
          <p className="text-xs text-neutral-500">
            <strong className="text-neutral-400">Atenção:</strong> Ao
            confirmar, o estoque será atualizado conforme as quantidades
            recebidas. Itens faltantes não serão adicionados ao inventário.
          </p>
        </div>
      </div>
    </ResponsiveModal>
  );
}

function FinishConfirmationFooter({
  viewState,
}: {
  viewState: ValidateTransferViewState;
}) {
  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
      <Button
        variant="outline"
        onClick={() => viewState.setShowFinishModal(false)}
        className="rounded-[4px] border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white"
      >
        Voltar
      </Button>
      <Button
        onClick={viewState.onConfirmFinish}
        disabled={viewState.isFinishing}
        className="rounded-[4px] bg-emerald-600 font-bold text-white hover:bg-emerald-700"
      >
        {viewState.isFinishing ? "Processando…" : "Confirmar e Finalizar"}
      </Button>
    </div>
  );
}

function FinishDiscrepancySummary({
  viewState,
}: {
  viewState: ValidateTransferViewState;
}) {
  if (viewState.discrepancies.length === 0) {
    return (
      <div className="flex items-center gap-4 rounded-[4px] border border-emerald-600/30 bg-emerald-600/10 p-4">
        <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-[4px] bg-emerald-600/20">
          <CheckCircle2 className="size-6 text-emerald-500" strokeWidth={2} />
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
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-amber-500">
        <AlertCircle className="size-4" strokeWidth={2} />
        <span className="text-xs font-bold uppercase tracking-wide">
          {viewState.discrepancies.length} Discrepância
          {viewState.discrepancies.length > 1 ? "s" : ""} Encontrada
          {viewState.discrepancies.length > 1 ? "s" : ""}
        </span>
      </div>
      {viewState.discrepancies.map((discrepancy) => (
        <DiscrepancyCard
          key={`${discrepancy.productName}-${discrepancy.discrepancyType}`}
          discrepancy={discrepancy}
        />
      ))}
    </div>
  );
}

function DiscrepancyCard({
  discrepancy,
}: {
  discrepancy: ValidateTransferViewProps["discrepancies"][number];
}) {
  return (
    <div
      className={cn(
        "rounded-[4px] border p-4",
        discrepancy.discrepancyType === "OVERAGE"
          ? "border-rose-600/30 bg-rose-600/10"
          : "border-amber-600/30 bg-amber-600/10",
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-bold text-white">
          {discrepancy.productName}
        </span>
        <span
          className={cn(
            "rounded-[4px] px-2 py-0.5 text-[10px] font-bold uppercase",
            discrepancy.discrepancyType === "OVERAGE"
              ? "bg-rose-600/20 text-rose-400"
              : "bg-amber-600/20 text-amber-400",
          )}
        >
          {discrepancy.discrepancyType === "OVERAGE" ? "Excesso" : "Falta"}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <div className="flex gap-4 text-neutral-400">
          <span>Esperado: {discrepancy.quantitySent}</span>
          <span>Recebido: {discrepancy.quantityReceived}</span>
        </div>
        <span
          className={cn(
            "font-mono font-bold",
            discrepancy.discrepancyType === "OVERAGE"
              ? "text-rose-400"
              : "text-amber-400",
          )}
        >
          {discrepancy.difference > 0 ? "+" : ""}
          {discrepancy.difference}
        </span>
      </div>
    </div>
  );
}
