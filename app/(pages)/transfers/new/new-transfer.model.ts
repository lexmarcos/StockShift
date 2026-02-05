import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import { newTransferSchema, NewTransferSchema } from "./new-transfer.schema";
import { NewTransferViewProps } from "./new-transfer.types";

const fetcher = async (url: string) => {
  return await api.get(url).json<any>();
};

export function useNewTransferModel(): NewTransferViewProps {
  const router = useRouter();
  const { warehouseId: currentWarehouseId } = useSelectedWarehouse();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProductForBatch, setSelectedProductForBatch] = useState<string | null>(null);

  const form = useForm<NewTransferSchema>({
    resolver: zodResolver(newTransferSchema),
    defaultValues: {
      items: [],
      notes: "",
    },
  });

  // Fetch data
  const { data: warehousesData, isLoading: isLoadingWarehouses } = useSWR<any[]>(
    "warehouses",
    fetcher
  );

  const { data: productsData, isLoading: isLoadingProducts } = useSWR<any[]>(
    "products",
    fetcher
  );

  // Fetch batches only when a product is selected in the "Add Item" section
  const { data: batchesData, isLoading: isLoadingBatches } = useSWR<any[]>(
    selectedProductForBatch ? `batches?productId=${selectedProductForBatch}` : null,
    fetcher
  );

  // Filter warehouses to exclude current source
  const warehouses = (warehousesData || [])
    .filter((w) => w.id !== currentWarehouseId)
    .map((w) => ({ id: w.id, name: w.name }));

  const products = (productsData || []).map((p) => ({ id: p.id, name: p.name }));

  const batches = (batchesData || []).map((b) => ({
    id: b.id,
    code: b.code,
    quantity: b.quantity,
  }));

  const handleSelectProduct = (productId: string) => {
    setSelectedProductForBatch(productId);
  };

  const onSubmit = async (data: NewTransferSchema) => {
    if (!currentWarehouseId) {
      toast.error("Selecione um warehouse de origem.");
      return;
    }

    if (data.destinationWarehouseId === currentWarehouseId) {
      form.setError("destinationWarehouseId", {
        message: "O destino não pode ser igual à origem."
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("transfers", {
        json: {
          sourceWarehouseId: currentWarehouseId,
          destinationWarehouseId: data.destinationWarehouseId,
          notes: data.notes,
          items: data.items.map((item) => ({
            batchId: item.sourceBatchId,
            quantity: item.quantity,
          })),
        },
      });

      toast.success("Transferência criada com sucesso!");
      router.push("/transfers");
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message || "Erro ao criar transferência.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    onSubmit,
    warehouses,
    products,
    batches,
    onSearchProduct: () => {}, // Not implemented client-side filter is enough for now
    onSelectProduct: handleSelectProduct,
    isLoading: isLoadingWarehouses || isLoadingProducts,
    isSubmitting,
  };
}
