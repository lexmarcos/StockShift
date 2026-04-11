import useSWR from "swr";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";
import { SaleDetailResponse } from "../sales.types";

export function useSaleDetailModel(id: string) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<SaleDetailResponse>(
    id ? `sales/${id}` : null,
    async (url: string) => {
      try {
        return await api.get(url).json<SaleDetailResponse>();
      } catch (err) {
        console.error("Erro ao carregar venda:", err);
        toast.error("Erro ao carregar venda");
        throw err;
      }
    },
  );

  const sale = data?.data || null;

  const handleCancel = async (cancellationReason: string) => {
    setIsCancelling(true);
    try {
      await api.put(`sales/${id}/cancel`, {
        json: { cancellationReason },
      });
      toast.success("Venda cancelada com sucesso!");
      setCancelDialogOpen(false);
      mutate();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Erro ao cancelar venda.");
    } finally {
      setIsCancelling(false);
    }
  };

  return {
    sale,
    isLoading,
    error: error || null,
    isCancelling,
    cancelDialogOpen,
    setCancelDialogOpen,
    handleCancel,
  };
}
