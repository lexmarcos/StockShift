import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  TransferDetailResponse,
  ScanResponse,
  DiscrepancyItem,
  DiscrepancyReportResponse,
  ValidationLogsResponse,
} from "../../transfers.types";
import { ScanResultItem, ExpectedItem } from "./validate-transfer.types";
import { useBreadcrumb } from "@/components/breadcrumb";

export const useValidateTransferModel = (transferId: string) => {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyItem[]>([]);
  const [lastScanResult, setLastScanResult] = useState<ScanResultItem | null>(null);
  const [barcode, setBarcode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep focus on input for scanner
  useEffect(() => {
    const focusInput = () => inputRef.current?.focus();
    focusInput();
    window.addEventListener("click", focusInput);
    return () => window.removeEventListener("click", focusInput);
  }, []);

  // Fetch transfer details
  const { data: transferData, isLoading: isLoadingTransfer } = useSWR<TransferDetailResponse>(
    transferId ? `transfers/${transferId}` : null,
    async (url: string) => {
      return await api.get(url).json<TransferDetailResponse>();
    }
  );

  const transfer = transferData?.data;

  // Fetch validation logs (scan history)
  const { data: logsData, isLoading: isLoadingLogs, mutate: mutateLogs } = useSWR<ValidationLogsResponse>(
    transferId ? `transfers/${transferId}/validation-logs` : null,
    async (url: string) => {
      return await api.get(url).json<ValidationLogsResponse>();
    }
  );

  const validationLogs = useMemo(() => logsData?.data || [], [logsData]);

  useBreadcrumb({
    title: transfer?.code ? `Validação ${transfer.code}` : "Validação",
    backUrl: transferId ? `/transfers/${transferId}` : "/transfers",
    section: "Transferências",
    subsection: "Validação",
  });

  const isLoading = isLoadingTransfer || isLoadingLogs;

  // Derive expected items from transfer items + validation logs
  const expectedItems: ExpectedItem[] = useMemo(() => {
    if (!transfer) return [];

    const scannedCounts: Record<string, number> = {};
    validationLogs.forEach((log) => {
      if (log.valid) {
        scannedCounts[log.productName] = (scannedCounts[log.productName] || 0) + 1;
      }
    });

    return transfer.items.map((item) => ({
      id: item.id,
      productName: item.productName || "Produto desconhecido",
      batchCode: item.batchCode || "Sem lote",
      expectedQuantity: item.quantity,
      scannedQuantity: scannedCounts[item.productName || ""] || 0,
    }));
  }, [transfer, validationLogs]);

  // Calculate global progress
  const progress = useMemo(() => {
    if (!expectedItems.length) return 0;
    const totalExpected = expectedItems.reduce((acc, item) => acc + item.expectedQuantity, 0);
    const totalScanned = expectedItems.reduce((acc, item) => acc + item.scannedQuantity, 0);
    if (totalExpected === 0) return 100;
    return Math.min(100, (totalScanned / totalExpected) * 100);
  }, [expectedItems]);

  const handleScan = async () => {
    const trimmedBarcode = barcode.trim();
    if (!transferId || !trimmedBarcode || isProcessing) return;

    try {
      setIsProcessing(true);
      setBarcode("");

      const result = await api
        .post(`transfers/${transferId}/scan`, { json: { barcode: trimmedBarcode } })
        .json<ScanResponse>();

      const scanData = result.data;
      setLastScanResult(scanData);

      if (!scanData.valid) {
        toast.error(scanData.message || "Erro ao escanear item");
      }

      await mutateLogs();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Erro de conexão ou código inválido.");
      setLastScanResult({
        valid: false,
        message: "Falha na comunicação com o servidor",
        productName: "Erro de leitura",
        productBarcode: trimmedBarcode,
        quantitySent: 0,
        quantityReceived: 0,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinish = async () => {
    if (!transferId) return;

    try {
      setIsProcessing(true);
      const report = await api
        .get(`transfers/${transferId}/discrepancy-report`)
        .json<DiscrepancyReportResponse>();

      setDiscrepancies(report.data.items);
      setShowFinishModal(true);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Erro ao gerar relatório de discrepâncias.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmFinish = async () => {
    if (!transferId) return;

    try {
      setIsFinishing(true);
      await api.post(`transfers/${transferId}/complete-validation`).json();

      toast.success("Validação concluída com sucesso!");
      setShowFinishModal(false);
      router.push(`/transfers/${transferId}`);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Erro ao finalizar validação.");
    } finally {
      setIsFinishing(false);
    }
  };

  return {
    isLoading,
    isProcessing,
    transfer,
    expectedItems,
    progress,
    lastScanResult,
    barcode,
    onBarcodeChange: setBarcode,
    onScan: handleScan,
    inputRef,
    onFinish: handleFinish,
    showFinishModal,
    setShowFinishModal,
    discrepancies,
    onConfirmFinish: handleConfirmFinish,
    isFinishing,
  };
};
