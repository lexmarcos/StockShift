import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import type { StockMovementDetailResponse, StartValidationResponse, ExistingValidationsResponse } from "./stock-movements-detail.types";
import { useBreadcrumb } from "@/components/breadcrumb";

export const useStockMovementDetailModel = (movementId: string) => {
  const router = useRouter();
  const [isCancelOpen, setCancelOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isStartingValidation, setIsStartingValidation] = useState(false);

  const { data, error, isLoading, mutate } =
    useSWR<StockMovementDetailResponse>(
      movementId ? `stock-movements/${movementId}` : null,
      async (url: string) => {
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

  const onStartValidation = async () => {
    if (!movementId) return;
    setIsStartingValidation(true);
    try {
      const { api } = await import("@/lib/api");

      // First, try to get existing validations
      try {
        const existingResponse = await api
          .get(`stock-movements/${movementId}/validations`)
          .json<ExistingValidationsResponse>();

        // If there's an existing IN_PROGRESS validation, redirect to it
        if (existingResponse.data && existingResponse.data.validationId) {
          toast.info("Continuando validação existente");
          router.push(`/stock-movements/${movementId}/validate/${existingResponse.data.validationId}`);
          return;
        }
      } catch {
        // No existing validation, proceed to create one
      }

      // Create new validation
      const response = await api
        .post(`stock-movements/${movementId}/validations`)
        .json<StartValidationResponse>();
      toast.success("Validação iniciada");
      router.push(`/stock-movements/${movementId}/validate/${response.data.validationId}`);
    } catch (err: any) {
      // Handle case where validation already exists (400 error)
      if (err?.message?.includes("already exists") || err?.response?.status === 400) {
        try {
          const { api } = await import("@/lib/api");
          const existingResponse = await api
            .get(`stock-movements/${movementId}/validations`)
            .json<ExistingValidationsResponse>();

          if (existingResponse.data && existingResponse.data.validationId) {
            toast.info("Continuando validação existente");
            router.push(`/stock-movements/${movementId}/validate/${existingResponse.data.validationId}`);
            return;
          }
        } catch {
          toast.error("Erro ao buscar validação existente");
        }
      } else {
        toast.error(err?.message || "Erro ao iniciar validação");
      }
    } finally {
      setIsStartingValidation(false);
    }
  };

  return {
    movement,
    isLoading,
    error,
    isExecuting,
    isCancelling,
    isStartingValidation,
    onExecute,
    onCancel,
    onStartValidation,
    isCancelOpen,
    onCancelOpenChange: setCancelOpen,
  };
};
