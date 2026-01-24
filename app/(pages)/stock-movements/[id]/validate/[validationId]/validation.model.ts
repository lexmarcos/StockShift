"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { useBreadcrumb } from "@/components/breadcrumb";
import type {
  ValidationSessionResponse,
  ScanResponse,
  CompleteValidationResponse,
  ValidationScanResult,
  ValidationDiscrepancy,
} from "./validation.types";

export const useValidationModel = (movementId: string, validationId: string) => {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<ValidationScanResult | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<ValidationSessionResponse>(
    movementId && validationId
      ? `stock-movements/${movementId}/validations/${validationId}`
      : null,
    async (url) => {
      const { api } = await import("@/lib/api");
      return await api.get(url).json<ValidationSessionResponse>();
    },
    {
      refreshInterval: 5000, // Refresh every 5 seconds for real-time updates
    }
  );

  const validation = data?.data ?? null;
  const items = validation?.items ?? [];
  const progress = validation?.progress ?? {
    totalItems: 0,
    completeItems: 0,
    partialItems: 0,
    pendingItems: 0,
  };

  // Calculate discrepancies
  const discrepancies: ValidationDiscrepancy[] = items
    .filter((item) => item.scannedQuantity < item.expectedQuantity)
    .map((item) => ({
      productId: item.productId,
      productName: item.productName,
      expected: item.expectedQuantity,
      received: item.scannedQuantity,
      missing: item.expectedQuantity - item.scannedQuantity,
    }));

  const hasDiscrepancies = discrepancies.length > 0;

  useBreadcrumb({
    title: "Validação de Transferência",
    backUrl: `/stock-movements/${movementId}`,
  });

  const onScan = useCallback(
    async (barcode: string) => {
      if (!barcode || isScanning) return;

      setIsScanning(true);
      setLastScanResult(null);

      try {
        const { api } = await import("@/lib/api");
        const response = await api
          .post(`stock-movements/${movementId}/validations/${validationId}/scan`, {
            json: { barcode },
          })
          .json<ScanResponse>();

        setLastScanResult(response.data);

        if (response.data.success) {
          toast.success(response.data.message);
        } else {
          toast.error(response.data.message);
        }

        mutate();
      } catch (err) {
        const error = err instanceof Error ? err.message : "Erro ao escanear produto";
        toast.error(error);
      } finally {
        setIsScanning(false);
      }
    },
    [movementId, validationId, isScanning, mutate]
  );

  const onComplete = useCallback(async () => {
    setIsCompleting(true);

    try {
      const { api } = await import("@/lib/api");
      const response = await api
        .post(`stock-movements/${movementId}/validations/${validationId}/complete`)
        .json<CompleteValidationResponse>();

      if (response.data.status === "COMPLETED_WITH_DISCREPANCY") {
        toast.warning("Validação concluída com divergências");
      } else {
        toast.success("Validação concluída com sucesso");
      }

      setShowCompleteModal(false);
      router.push(`/stock-movements/${movementId}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : "Erro ao concluir validação";
      toast.error(error);
    } finally {
      setIsCompleting(false);
    }
  }, [movementId, validationId, router]);

  const onBack = useCallback(() => {
    router.push(`/stock-movements/${movementId}`);
  }, [movementId, router]);

  return {
    movementId,
    validationId,
    sourceWarehouseName: "", // Will be fetched from movement if needed
    destinationWarehouseName: "",
    items,
    progress,
    isLoading,
    error,
    isScanning,
    isCompleting,
    lastScanResult,
    onScan,
    onComplete,
    onBack,
    showCompleteModal,
    onCompleteModalChange: setShowCompleteModal,
    hasDiscrepancies,
    discrepancies,
  };
};
