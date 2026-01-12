import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import type { StockMovementDetailResponse } from "./stock-movements-detail.types";
import { useBreadcrumb } from "@/components/breadcrumb";

export const useStockMovementDetailModel = (movementId: string) => {
  const [isCancelOpen, setCancelOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const { data, error, isLoading, mutate } =
    useSWR<StockMovementDetailResponse>(
      movementId ? `stock-movements/${movementId}` : null,
      async (url) => {
        const { api } = await import("@/lib/api");
        return await api.get(url).json<StockMovementDetailResponse>();
      }
    );

  const movement = data?.data ?? null;

  useBreadcrumb({
    title: movement
      ? `Movimentação #${movement.id.substring(0, 8)}`
      : "Carregando...",
    backUrl: "/stock-movements",
  });

  const onExecute = async () => {
    if (!movementId) return;
    setIsExecuting(true);
    try {
      const { api } = await import("@/lib/api");
      await api.post(`stock-movements/${movementId}/execute`).json();
      toast.success("Movimentação executada");
      mutate();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao executar movimentação");
    } finally {
      setIsExecuting(false);
    }
  };

  const onCancel = async () => {
    if (!movementId) return;
    setIsCancelling(true);
    try {
      const { api } = await import("@/lib/api");
      await api.post(`stock-movements/${movementId}/cancel`).json();
      toast.success("Movimentação cancelada");
      setCancelOpen(false);
      mutate();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao cancelar movimentação");
    } finally {
      setIsCancelling(false);
    }
  };

  return {
    movement,
    isLoading,
    error,
    isExecuting,
    isCancelling,
    onExecute,
    onCancel,
    isCancelOpen,
    onCancelOpenChange: setCancelOpen,
  };
};
