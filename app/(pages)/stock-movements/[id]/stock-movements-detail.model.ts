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
    } catch (err) {
      const error = err instanceof Error ? err.message : "Erro ao executar movimentação";
      toast.error(error);
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
    } catch (err) {
      const error = err instanceof Error ? err.message : "Erro ao cancelar movimentação";
      toast.error(error);
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

        // Find an IN_PROGRESS validation
        const inProgressValidation = existingResponse.data?.find(
          (v) => v.status === "IN_PROGRESS"
        );

        if (inProgressValidation) {
          toast.info("Continuando validação existente");
          router.push(`/stock-movements/${movementId}/validate/${inProgressValidation.validationId}`);
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
    } catch (err) {
      // Handle case where validation already exists (400 error)
      const error = err as { message?: string; response?: { status?: number } };
      if (error?.message?.includes("already exists") || error?.response?.status === 400) {
        try {
          const { api } = await import("@/lib/api");
          const existingResponse = await api
            .get(`stock-movements/${movementId}/validations`)
            .json<ExistingValidationsResponse>();

          const inProgressValidation = existingResponse.data?.find(
            (v) => v.status === "IN_PROGRESS"
          );

          if (inProgressValidation) {
            toast.info("Continuando validação existente");
            router.push(`/stock-movements/${movementId}/validate/${inProgressValidation.validationId}`);
            return;
          }
        } catch {
          toast.error("Erro ao buscar validação existente");
        }
      } else {
        const errorMsg = error?.message || "Erro ao iniciar validação";
        toast.error(errorMsg);
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
