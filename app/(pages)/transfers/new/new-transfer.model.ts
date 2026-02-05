import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import { newTransferSchema, NewTransferSchema } from "./new-transfer.schema";
import { NewTransferViewProps } from "./new-transfer.types";
import { useBreadcrumb } from "@/components/breadcrumb";

const fetcher = async (url: string) => {
  return await api.get(url).json<any>();
};

export function useNewTransferModel(): NewTransferViewProps {
  const router = useRouter();
  const { warehouseId: currentWarehouseId } = useSelectedWarehouse();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [addItemError, setAddItemError] = useState<string | null>(null);

  useBreadcrumb({
    title: "Nova Transferência",
    backUrl: "/transfers",
    section: "Transferências",
    subsection: "Criar",
  });

  const form = useForm<NewTransferSchema>({
    resolver: zodResolver(newTransferSchema),
    defaultValues: {
      items: [],
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { data: warehousesData, isLoading: isLoadingWarehouses } = useSWR(
    "warehouses",
    fetcher
  );

  const { data: productsData, isLoading: isLoadingProducts } = useSWR(
    "products",
    fetcher
  );

  const { data: batchesData } = useSWR(
    selectedProductId ? `batches?productId=${selectedProductId}` : null,
    fetcher
  );

  const warehouses = (warehousesData?.data || [])
    .filter((w: any) => w.id !== currentWarehouseId)
    .map((w: any) => ({ id: w.id, name: w.name }));

  const products = (productsData?.data?.content || productsData?.data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
  }));

  const batches = (batchesData?.data?.content || batchesData?.data || []).map((b: any) => ({
    id: b.id,
    code: b.code,
    quantity: b.quantity,
  }));

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    setSelectedBatchId("");
    setItemQuantity("");
    setAddItemError(null);
  };

  const handleAddItem = () => {
    setAddItemError(null);

    if (!selectedProductId) {
      setAddItemError("Selecione um produto.");
      return;
    }
    if (!selectedBatchId) {
      setAddItemError("Selecione um lote.");
      return;
    }

    const qty = Number(itemQuantity);
    if (!qty || qty <= 0) {
      setAddItemError("Quantidade inválida.");
      return;
    }

    const batch = batches.find((b: { id: string }) => b.id === selectedBatchId);
    if (!batch) {
      setAddItemError("Lote inválido.");
      return;
    }

    if (qty > batch.quantity) {
      setAddItemError(`Quantidade indisponível no lote (Máx: ${batch.quantity}).`);
      return;
    }

    const product = products.find((p: { id: string }) => p.id === selectedProductId);

    append({
      sourceBatchId: selectedBatchId,
      quantity: qty,
      productName: product?.name || "Desconhecido",
      batchCode: batch.code,
      availableQuantity: batch.quantity,
    });

    setSelectedProductId("");
    setSelectedBatchId("");
    setItemQuantity("");
  };

  const onSubmit = async (data: NewTransferSchema) => {
    if (!currentWarehouseId) {
      toast.error("Selecione um warehouse de origem.");
      return;
    }

    if (data.destinationWarehouseId === currentWarehouseId) {
      form.setError("destinationWarehouseId", {
        message: "O destino não pode ser igual à origem.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("transfers", {
        json: {
          destinationWarehouseId: data.destinationWarehouseId,
          notes: data.notes || undefined,
          items: data.items.map((item) => ({
            sourceBatchId: item.sourceBatchId,
            quantity: item.quantity,
          })),
        },
      });

      toast.success("Transferência criada com sucesso!");
      router.push("/transfers");
    } catch (error: any) {
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
    onSelectProduct: handleProductChange,
    isLoading: isLoadingWarehouses || isLoadingProducts,
    isSubmitting,
    selectedProductId,
    selectedBatchId,
    itemQuantity,
    addItemError,
    onProductChange: handleProductChange,
    onBatchChange: setSelectedBatchId,
    onQuantityChange: setItemQuantity,
    onAddItem: handleAddItem,
    onRemoveItem: remove,
    items: fields,
  };
}
