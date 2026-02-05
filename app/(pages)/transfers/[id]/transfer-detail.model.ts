import useSWR, { mutate } from "swr";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ky from "ky";
import { toast } from "sonner";
import { Transfer, TransferStatus } from "../transfers.types";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";

export const useTransferDetailModel = (transferId: string) => {
  const router = useRouter();
  const { warehouseId: currentWarehouseId } = useSelectedWarehouse();
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const { data: transfer, error, isLoading } = useSWR<Transfer>(
    transferId ? `/stockshift/api/transfers/${transferId}` : null
  );

  const isSource = transfer?.sourceWarehouseId === currentWarehouseId;
  const isDestination = transfer?.destinationWarehouseId === currentWarehouseId;

  const handleExecute = async () => {
    if (!transferId) return;
    
    try {
      setIsExecuting(true);
      await ky.post(`/stockshift/api/transfers/${transferId}/execute`).json();
      toast.success("Transferência iniciada com sucesso!");
      mutate(`/stockshift/api/transfers/${transferId}`);
    } catch (error) {
      console.error("Failed to execute transfer:", error);
      toast.error("Erro ao executar transferência.");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCancel = async () => {
    if (!transferId) return;

    if (!confirm("Tem certeza que deseja cancelar esta transferência?")) {
      return;
    }

    try {
      setIsCancelling(true);
      await ky.delete(`/stockshift/api/transfers/${transferId}`);
      toast.success("Transferência cancelada.");
      mutate(`/stockshift/api/transfers/${transferId}`);
    } catch (error) {
      console.error("Failed to cancel transfer:", error);
      toast.error("Erro ao cancelar transferência.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleStartValidation = async () => {
    if (!transferId) return;

    try {
      setIsValidating(true);
      await ky.post(`/stockshift/api/transfers/${transferId}/start-validation`).json();
      toast.success("Validação iniciada!");
      router.push(`/transfers/${transferId}/validate`);
    } catch (error) {
      console.error("Failed to start validation:", error);
      toast.error("Erro ao iniciar validação.");
    } finally {
      setIsValidating(false);
    }
  };

  return {
    isLoading,
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
