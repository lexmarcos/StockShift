import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import { useBreadcrumb } from "@/components/breadcrumb";
import { TransferResponse, TransferActionResponse } from "../transfers.types";

export const useTransferDetailModel = () => {
  const params = useParams();
  const router = useRouter();
  const transferId = params.id as string;
  const { warehouseId } = useSelectedWarehouse();

  const [isExecuting, setIsExecuting] = useState(false);
  const [isStartingValidation, setIsStartingValidation] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<TransferResponse>(
    transferId ? `transfers/${transferId}` : null,
    async (url) => await api.get(url).json<TransferResponse>()
  );

  const transfer = data?.data || null;

  useBreadcrumb({
    title: transfer ? `Transferência` : "Carregando...",
    backUrl: "/transfers",
    section: "Transferências",
    subsection: "Detalhes",
  });

  const isSource = transfer?.sourceWarehouse.id === warehouseId;
  const isDestination = transfer?.destinationWarehouse.id === warehouseId;

  const onExecute = async () => {
    try {
      setIsExecuting(true);
      const response = await api
        .post(`transfers/${transferId}/execute`)
        .json<TransferActionResponse>();

      if (response.success) {
        toast.success("Transferência enviada com sucesso");
        mutate();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao executar transferência";
      toast.error(message);
    } finally {
      setIsExecuting(false);
    }
  };

  const onStartValidation = async () => {
    try {
      setIsStartingValidation(true);
      const response = await api
        .post(`transfers/${transferId}/start-validation`)
        .json<TransferActionResponse>();

      if (response.success) {
        toast.success("Validação iniciada");
        router.push(`/transfers/${transferId}/validate`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao iniciar validação";
      toast.error(message);
    } finally {
      setIsStartingValidation(false);
    }
  };

  const onCancel = async (reason: string) => {
    try {
      setIsCancelling(true);
      const response = await api
        .delete(`transfers/${transferId}`, { json: { reason } })
        .json<TransferActionResponse>();

      if (response.success) {
        toast.success("Transferência cancelada");
        setShowCancelDialog(false);
        mutate();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao cancelar transferência";
      toast.error(message);
    } finally {
      setIsCancelling(false);
    }
  };

  return {
    transfer,
    isLoading,
    error,
    currentWarehouseId: warehouseId,
    isSource,
    isDestination,
    onExecute,
    onStartValidation,
    onCancel,
    isExecuting,
    isStartingValidation,
    isCancelling,
    showCancelDialog,
    setShowCancelDialog,
  };
};
