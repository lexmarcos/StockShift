import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useBreadcrumb } from "@/components/breadcrumb";
import {
  TransferResponse,
  ScanResponse,
  CompleteValidationResponse,
  DiscrepancyItem,
} from "../../transfers.types";
import { ScanResult } from "./validate-transfer.types";

export const useValidateTransferModel = () => {
  const params = useParams();
  const router = useRouter();
  const transferId = params.id as string;

  const [barcode, setBarcode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyItem[]>([]);

  const { data, error, isLoading, mutate } = useSWR<TransferResponse>(
    transferId ? `transfers/${transferId}` : null,
    async (url) => await api.get(url).json<TransferResponse>()
  );

  const transfer = data?.data || null;

  useBreadcrumb({
    title: "Validar Transferência",
    backUrl: `/transfers/${transferId}`,
    section: "Transferências",
    subsection: "Validação",
  });

  const progress = useMemo(() => {
    if (!transfer) return { received: 0, total: 0 };

    const total = transfer.items.reduce((sum, item) => sum + item.quantitySent, 0);
    const received = transfer.items.reduce(
      (sum, item) => sum + (item.quantityReceived || 0),
      0
    );

    return { received, total };
  }, [transfer]);

  const onScan = async () => {
    if (!barcode.trim()) return;

    try {
      setIsScanning(true);
      const response = await api
        .post(`transfers/${transferId}/scan`, { json: { barcode: barcode.trim() } })
        .json<ScanResponse>();

      setLastScanResult({
        valid: response.data.valid,
        message: response.data.message,
        warning: response.data.warning,
        productName: response.data.productName,
      });

      if (response.data.valid) {
        toast.success(`${response.data.productName} validado`);
      } else {
        toast.warning(response.data.message);
      }

      setBarcode("");
      mutate();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao escanear";
      toast.error(message);
      setLastScanResult(null);
    } finally {
      setIsScanning(false);
    }
  };

  const checkDiscrepancies = async () => {
    try {
      // In this implementation, we fetch the report before completing
      const response = await api
        .get(`transfers/${transferId}/discrepancy-report`)
        .json<{ success: boolean; data: DiscrepancyItem[] }>();

      setDiscrepancies(response.data);

      if (response.data.length > 0) {
        setShowConfirmDialog(true);
      } else {
        await completeValidation();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao verificar discrepâncias";
      toast.error(message);
    }
  };

  const completeValidation = async () => {
    try {
      setIsCompleting(true);
      const response = await api
        .post(`transfers/${transferId}/complete-validation`)
        .json<CompleteValidationResponse>();

      if (response.success) {
        toast.success("Transferência concluída com sucesso");
        router.push(`/transfers/${transferId}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao concluir validação";
      toast.error(message);
    } finally {
      setIsCompleting(false);
      setShowConfirmDialog(false);
    }
  };

  return {
    transfer,
    isLoading,
    barcode,
    setBarcode,
    onScan,
    isScanning,
    lastScanResult,
    onComplete: checkDiscrepancies,
    isCompleting,
    showConfirmDialog,
    setShowConfirmDialog,
    discrepancies,
    progress,
    confirmComplete: completeValidation,
  };
};
