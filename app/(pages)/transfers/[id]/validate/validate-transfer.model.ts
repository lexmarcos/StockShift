import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import ky from "ky";
import { toast } from "sonner";
import { Transfer, DiscrepancyItem } from "../../transfers.types";
import { ScannedItem, ExpectedItem } from "./validate-transfer.types";

interface ValidationStatus {
  scannedItems: ScannedItem[];
  itemsProgress: Record<string, number>; // itemId -> scannedQuantity
}

export const useValidateTransferModel = (transferId: string) => {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyItem[]>([]);
  const [lastScannedItem, setLastScannedItem] = useState<ScannedItem | null>(null);

  // Fetch transfer details
  const { data: transfer, isLoading: isLoadingTransfer } = useSWR<Transfer>(
    transferId ? `/stockshift/api/transfers/${transferId}` : null
  );

  // Fetch validation status (scanned items history and counts)
  const { data: validationStatus, isLoading: isLoadingStatus, mutate: mutateStatus } = useSWR<ValidationStatus>(
    transferId ? `/stockshift/api/transfers/${transferId}/validation-status` : null
  );

  const isLoading = isLoadingTransfer || isLoadingStatus;

  // Derive Expected Items from Transfer + Validation Status
  const expectedItems: ExpectedItem[] = useMemo(() => {
    if (!transfer) return [];
    
    return transfer.items.map(item => ({
      id: item.id,
      productName: item.productName || "Produto desconhecido",
      batchCode: item.batchCode || "Sem lote",
      expectedQuantity: item.quantity,
      scannedQuantity: validationStatus?.itemsProgress[item.id] || 0
    }));
  }, [transfer, validationStatus]);

  // Calculate global progress
  const progress = useMemo(() => {
    if (!expectedItems.length) return 0;
    const totalExpected = expectedItems.reduce((acc, item) => acc + item.expectedQuantity, 0);
    const totalScanned = expectedItems.reduce((acc, item) => acc + item.scannedQuantity, 0); // Note: scanned can exceed expected
    
    // Cap visual progress at 100% even if overage
    if (totalExpected === 0) return 100;
    return Math.min(100, (totalScanned / totalExpected) * 100);
  }, [expectedItems]);

  const handleScan = async (barcode: string) => {
    if (!transferId || isProcessing) return;

    try {
      setIsProcessing(true);
      // Optimistic update could go here, but for now we wait for server response to ensure validation rules
      
      const result = await ky.post(`/stockshift/api/transfers/${transferId}/scan`, {
        json: { barcode }
      }).json<{ success: boolean; message: string; scannedItem: ScannedItem }>();

      if (result.success) {
        // toast.success("Item escaneado!"); // Optional, maybe too noisy
        // Play sound if implemented
      } else {
        toast.error(result.message || "Erro ao escanear item");
      }

      setLastScannedItem({
        ...result.scannedItem,
        isSuccess: result.success,
        message: result.message
      });

      // Refresh validation status
      await mutateStatus();
      
    } catch (error) {
      console.error("Scan error:", error);
      toast.error("Erro de conexão ou código inválido.");
      setLastScannedItem({
        productName: "Erro de leitura",
        batchCode: barcode,
        timestamp: new Date(),
        isSuccess: false,
        message: "Falha na comunicação com o servidor"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinish = async () => {
    if (!transferId) return;

    try {
      setIsProcessing(true);
      const report = await ky.get(`/stockshift/api/transfers/${transferId}/discrepancy-report`).json<{ discrepancies: DiscrepancyItem[] }>();
      
      setDiscrepancies(report.discrepancies);
      setShowFinishModal(true);
    } catch (error) {
      console.error("Failed to get discrepancy report:", error);
      toast.error("Erro ao gerar relatório de discrepâncias.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmFinish = async () => {
    if (!transferId) return;

    try {
      setIsFinishing(true);
      await ky.post(`/stockshift/api/transfers/${transferId}/complete-validation`).json();
      
      toast.success("Validação concluída com sucesso!");
      setShowFinishModal(false);
      router.push(`/transfers/${transferId}`);
    } catch (error) {
      console.error("Failed to complete validation:", error);
      toast.error("Erro ao finalizar validação.");
    } finally {
      setIsFinishing(false);
    }
  };

  return {
    isLoading,
    isProcessing,
    transfer,
    scannedItems: validationStatus?.scannedItems || [],
    expectedItems,
    progress,
    lastScannedItem,
    onScan: handleScan,
    onFinish: handleFinish,
    showFinishModal,
    setShowFinishModal,
    discrepancies,
    onConfirmFinish: handleConfirmFinish,
    isFinishing
  };
};
