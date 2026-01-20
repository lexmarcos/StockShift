import { useState, useCallback, useMemo } from "react";
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

export const buildMovementPayload = (data: StockMovementCreateFormData, notes: string) => ({
  movementType: data.movementType,
  sourceWarehouseId: data.sourceWarehouseId || null,
  destinationWarehouseId: data.destinationWarehouseId || null,
  notes: notes?.trim() || undefined,
  items: data.items.map((item) => ({
    productId: item.productId,
    batchId: item.batchId || undefined,
    quantity: item.quantity,
    reason: item.reason?.trim() || undefined,
  })),
});

export const useStockMovementCreateModel = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState("");

  const form = useForm<StockMovementCreateFormData>({
    resolver: zodResolver(stockMovementCreateSchema) as any,
    defaultValues: {
      movementType: "TRANSFER",
      sourceWarehouseId: "",
      destinationWarehouseId: "",
      notes: "",
      executeNow: false,
      items: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Data fetching
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
    async (url: string) => {
      const { api } = await import("@/lib/api");
      return await api.get(url).json<BatchesResponse>();
    }
  );

  const warehouses = warehousesData?.data || [];
  const products = productsData?.data || [];
  const batches = batchesData?.data || [];

  const movementType = form.watch("movementType");
  const watchedItems = form.watch("items");
  const executeNow = form.watch("executeNow");
  const destinationWarehouseId = form.watch("destinationWarehouseId");

  // Derived state
  const requiresSource = movementType === "EXIT" || movementType === "TRANSFER" || movementType === "ADJUSTMENT";
  const requiresDestination = movementType === "ENTRY" || movementType === "TRANSFER";
  const requiresBatch = movementType === "EXIT" || movementType === "TRANSFER";

  const sourceWarehouse = warehouses.find((w) => w.id === sourceWarehouseId);
  const destinationWarehouse = warehouses.find((w) => w.id === destinationWarehouseId);

  const totalQuantity = useMemo(() => {
    return watchedItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [watchedItems]);

  const canSubmit = useMemo(() => {
    if (!movementType) return false;
    if (requiresSource && !sourceWarehouseId) return false;
    if (requiresDestination && !destinationWarehouseId) return false;
    if (watchedItems.length === 0) return false;
    return true;
  }, [movementType, requiresSource, requiresDestination, sourceWarehouseId, destinationWarehouseId, watchedItems]);

  // Handlers
  const addItem = useCallback((productId: string, batchId: string, quantity: number) => {
    append({
      productId,
      batchId: batchId || undefined,
      quantity,
      reason: "",
    });
  }, [append]);

  const removeItem = useCallback((index: number) => {
    remove(index);
  }, [remove]);

  const updateItemQuantity = useCallback((index: number, quantity: number) => {
    const item = watchedItems[index];
    if (item) {
      update(index, { ...item, quantity });
    }
  }, [update, watchedItems]);

  const handleSubmit = async (data: StockMovementCreateFormData) => {
    setIsSubmitting(true);
    try {
      const { api } = await import("@/lib/api");
      const payload = buildMovementPayload(data, notes);

      await api.post("stock-movements", { json: payload }).json<StockMovementCreateResponse>();

      toast.success("Movimentação criada com sucesso!");
      router.push("/stock-movements");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar movimentação";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBatchesForProduct = useCallback((productId: string) => {
    return filterBatchesByProduct(batches, productId).map((b) => ({
      id: b.id,
      batchCode: b.batchCode || b.batchNumber || b.id.slice(0, 8),
      quantity: b.quantity,
      productId: b.productId,
    }));
  }, [batches]);

  return {
    form,
    items: fields,
    watchedItems,
    warehouses,
    products,
    batches,
    movementType,
    sourceWarehouseId,
    destinationWarehouseId,
    sourceWarehouse,
    destinationWarehouse,
    executeNow: executeNow || false,
    notes,
    setNotes,
    requiresSource,
    requiresDestination,
    requiresBatch,
    totalQuantity,
    canSubmit,
    isSubmitting,
    addItem,
    removeItem,
    updateItemQuantity,
    handleSubmit: form.handleSubmit(handleSubmit),
    getBatchesForProduct,
  };
};
