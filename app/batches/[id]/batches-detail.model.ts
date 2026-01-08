import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import type { BatchDetailResponse } from "./batches-detail.types";

export const useBatchDetailModel = (batchId: string) => {
  const router = useRouter();
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<BatchDetailResponse>(
    batchId ? `batches/${batchId}` : null,
    async (url) => {
      const { api } = await import("@/lib/api");
      return await api.get(url).json<BatchDetailResponse>();
    }
  );

  const batch = data?.data ?? null;

  const onDelete = async () => {
    if (!batchId) return;
    setIsDeleting(true);
    try {
      const { api } = await import("@/lib/api");
      await api.delete(`batches/${batchId}`).json();
      toast.success("Batch removido com sucesso");
      setDeleteOpen(false);
      router.push("/batches");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao remover batch");
    } finally {
      setIsDeleting(false);
      mutate();
    }
  };

  return {
    batch,
    isLoading,
    error,
    isDeleting,
    isDeleteOpen,
    onDeleteOpenChange: setDeleteOpen,
    onDelete,
  };
};
