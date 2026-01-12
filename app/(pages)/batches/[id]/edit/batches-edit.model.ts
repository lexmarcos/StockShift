import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { batchEditSchema, BatchEditFormData } from "./batches-edit.schema";
import type { BatchEditResponse } from "./batches-edit.types";
import type { Batch } from "../../batches.types";
import { useBreadcrumb } from "@/components/breadcrumb";

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
  const form = useForm<BatchEditFormData>({
    resolver: zodResolver(batchEditSchema),
    defaultValues: {
      productId: "",
      warehouseId: "",
      quantity: 1,
      batchCode: "",
      manufacturedDate: "",
      expirationDate: "",
      costPrice: undefined,
      sellingPrice: undefined,
      notes: "",
    },
  });

  const { data, isLoading } = useSWR<BatchEditResponse>(
    batchId ? `batches/${batchId}` : null,
    async (url) => {
      const { api } = await import("@/lib/api");
      return await api.get(url).json<BatchEditResponse>();
    }
  );

  const batch = data?.data || null;

  useBreadcrumb({
    title: batch?.batchNumber || batch?.batchCode || "Carregando...",
    backUrl: `/batches/${batchId}`,
    section: "Inventário",
    subsection: "Edição",
  });

  useEffect(() => {
    if (batch) {
      form.reset(mapBatchToFormValues(batch));
    }
  }, [batch, form]);

  const onSubmit = async (values: BatchEditFormData) => {
    try {
      const { api } = await import("@/lib/api");
      await api.put(`batches/${batchId}`, { json: values }).json();
      toast.success("Batch atualizado");
      router.push(`/batches/${batchId}`);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar batch");
    }
  };

  return {
    form,
    onSubmit,
    batch,
    isLoading,
  };
};
