import { useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { TransferDetailResponse } from "../transfers.types";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import { useBreadcrumb } from "@/components/breadcrumb";

export const useTransferDetailModel = (transferId: string) => {
  const router = useRouter();
  const { warehouseId: currentWarehouseId } = useSelectedWarehouse();

  const [isExecuting, setIsExecuting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<TransferDetailResponse>(
    transferId ? `transfers/${transferId}` : null,
    async (url: string) => {
      return await api.get(url).json<TransferDetailResponse>();
    }
  );

  const transfer = data?.data ?? undefined;

  useBreadcrumb({
    title: transfer?.code || "Detalhes",
    backUrl: "/transfers",
    section: "Transferências",
    subsection: "Detalhes",
  });

  const isSource = transfer?.sourceWarehouseId === currentWarehouseId;
  const isDestination = transfer?.destinationWarehouseId === currentWarehouseId;

  const handleExecute = async () => {
    if (!transferId) return;
    setIsExecuting(true);
    try {
      await api.post(`transfers/${transferId}/execute`).json();
      toast.success("Transferência iniciada com sucesso!");
      mutate();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Erro ao executar transferência.");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCancel = async () => {
    if (!transferId) return;
    setIsCancelling(true);
    try {
      await api.delete(`transfers/${transferId}`).json();
      toast.success("Transferência cancelada.");
      mutate();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Erro ao cancelar transferência.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleStartValidation = async () => {
    if (!transferId) return;
    setIsValidating(true);
    try {
      await api.post(`transfers/${transferId}/start-validation`).json();
      toast.success("Validação iniciada!");
      router.push(`/transfers/${transferId}/validate`);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Erro ao iniciar validação.");
    } finally {
      setIsValidating(false);
    }
  };

  return {
    isLoading,
    error: error || null,
    transfer,
    isSource,
    isDestination,
    isExecuting,
    isCancelling,
    isValidating,
    onExecute: handleExecute,
    onCancel: handleCancel,
    onStartValidation: handleStartValidation,
  };
};
