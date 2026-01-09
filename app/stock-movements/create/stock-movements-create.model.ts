import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { stockMovementCreateSchema, StockMovementCreateFormData } from "./stock-movements-create.schema";
import type {
  BatchSummary,
  StockMovementCreateResponse,
} from "./stock-movements-create.types";

interface WarehousesResponse {
  success: boolean;
  data: Array<{ id: string; name: string }>;
}

interface ProductsResponse {
  success: boolean;
  data: Array<{ id: string; name: string; sku?: string | null }>;
}

interface BatchesResponse {
  success: boolean;
  data: BatchSummary[];
}

export const filterBatchesByProduct = (
  batches: BatchSummary[],
  productId: string
) => {
  if (!productId) return [];
  return batches.filter((batch) => batch.productId === productId);
};

export const buildMovementPayload = (data: StockMovementCreateFormData) => ({
  movementType: data.movementType,
  sourceWarehouseId: data.sourceWarehouseId || null,
  destinationWarehouseId: data.destinationWarehouseId || null,
  notes: data.notes?.trim() || undefined,
  items: data.items.map((item) => ({
    productId: item.productId,
    batchId: item.batchId || undefined,
    quantity: item.quantity,
    reason: item.reason?.trim() || undefined,
  })),
});

export const useStockMovementCreateModel = () => {
  const router = useRouter();
  const totalSteps = 3;
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<StockMovementCreateFormData>({
    resolver: zodResolver(stockMovementCreateSchema),
    defaultValues: {
      movementType: "ENTRY",
      sourceWarehouseId: "",
      destinationWarehouseId: "",
      notes: "",
      executeNow: false,
      items: [{ productId: "", batchId: "", quantity: 1, reason: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { data: warehousesData } = useSWR<WarehousesResponse>(
    "warehouses",
    async () => {
      const { api } = await import("@/lib/api");
      return await api.get("warehouses").json<WarehousesResponse>();
    }
  );

  const { data: productsData } = useSWR<ProductsResponse>(
    "products",
    async () => {
      const { api } = await import("@/lib/api");
      return await api.get("products").json<ProductsResponse>();
    }
  );

  const sourceWarehouseId = form.watch("sourceWarehouseId");
  const { data: batchesData } = useSWR<BatchesResponse>(
    sourceWarehouseId ? `batches/warehouse/${sourceWarehouseId}` : null,
    async (url) => {
      const { api } = await import("@/lib/api");
      return await api.get(url).json<BatchesResponse>();
    }
  );

  const onSubmit = async (values: StockMovementCreateFormData) => {
    try {
      const payload = buildMovementPayload(values);
      const { api } = await import("@/lib/api");
      const response = await api
        .post("stock-movements", { json: payload })
        .json<StockMovementCreateResponse>();

      if (response.success) {
        if (values.executeNow) {
          await api.post(`stock-movements/${response.data.id}/execute`).json();
        }
        toast.success("Movimentação criada");
        router.push(`/stock-movements/${response.data.id}`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao criar movimentação");
    }
  };

  return {
    form,
    onSubmit,
    items: fields,
    addItem: () => append({ productId: "", batchId: "", quantity: 1, reason: "" }),
    removeItem: (index: number) => remove(index),
    warehouses: warehousesData?.data || [],
    products: productsData?.data || [],
    batches: batchesData?.data || [],
    currentStep,
    totalSteps,
    onNextStep: () => setCurrentStep((prev) => Math.min(prev + 1, totalSteps)),
    onPrevStep: () => setCurrentStep((prev) => Math.max(prev - 1, 1)),
  };
};
