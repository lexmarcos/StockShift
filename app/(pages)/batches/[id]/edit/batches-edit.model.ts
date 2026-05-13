import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { batchEditSchema, BatchEditFormData } from "./batches-edit.schema";
import type { BatchEditResponse } from "./batches-edit.types";
import type { Batch } from "../../batches.types";
import { useBreadcrumb } from "@/components/breadcrumb";

const DEFAULT_BATCH_EDIT_FORM_VALUES: BatchEditFormData = {
  productId: "",
  warehouseId: "",
  quantity: 1,
  batchCode: "",
  manufacturedDate: "",
  expirationDate: "",
  costPrice: undefined,
  sellingPrice: undefined,
  notes: "",
};

export const mapBatchToFormValues = (batch: Batch): BatchEditFormData => ({
  productId: batch.productId,
  warehouseId: batch.warehouseId,
  quantity: batch.quantity ?? 1,
  batchCode: batch.batchNumber || batch.batchCode || "",
  manufacturedDate: batch.manufacturedDate || "",
  expirationDate: batch.expirationDate || "",
  costPrice: batch.costPrice ?? undefined,
  sellingPrice: batch.sellingPrice ?? undefined,
  notes: batch.notes || "",
});

export const useBatchEditModel = (batchId: string) => {
  const router = useRouter();
  const { data, isLoading } = useSWR<BatchEditResponse>(
    batchId ? `batches/${batchId}` : null,
    async (url: string) => {
      const { api } = await import("@/lib/api");
      return await api.get(url).json<BatchEditResponse>();
    }
  );

  const batch = data?.data || null;
  const formValues = useMemo(
    () => (batch ? mapBatchToFormValues(batch) : DEFAULT_BATCH_EDIT_FORM_VALUES),
    [batch],
  );
  const form = useForm<BatchEditFormData>({
    resolver: zodResolver(batchEditSchema),
    defaultValues: DEFAULT_BATCH_EDIT_FORM_VALUES,
    values: formValues,
  });

  useBreadcrumb({
    title: batch?.batchNumber || batch?.batchCode || "Carregando...",
    backUrl: `/batches/${batchId}`,
    section: "Inventário",
    subsection: "Edição",
  });

  const onSubmit = async (values: BatchEditFormData) => {
    try {
      const { api } = await import("@/lib/api");
      await api.put(`batches/${batchId}`, { json: values }).json();
      toast.success("Batch atualizado");
      router.push(`/batches/${batchId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar batch";
      toast.error(message);
    }
  };

  return {
    form,
    onSubmit,
    batch,
    isLoading,
  };
};
