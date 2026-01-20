import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import type {
  WizardPhase,
  MobileWizardItem,
  WarehouseOption,
  BatchOption,
  ProductSearchResult,
} from "./stock-movements-create.types";

interface WarehousesResponse {
  success: boolean;
  data: Array<{ id: string; name: string }>;
}

interface ProductsResponse {
  success: boolean;
  data: Array<{ id: string; name: string; sku?: string | null; barcode?: string | null }>;
}

interface BatchesResponse {
  success: boolean;
  data: Array<{
    id: string;
    batchCode?: string | null;
    batchNumber?: string | null;
    quantity: number;
    expirationDate?: string | null;
  }>;
}

interface CreateMovementResponse {
  success: boolean;
  data: { id: string; movementCode?: string };
}

export const useMobileWizardModel = () => {
  const router = useRouter();

  // Phase state
  const [phase, setPhase] = useState<WizardPhase>("setup");

  // Setup state
  const [sourceWarehouseId, setSourceWarehouseId] = useState<string | null>(null);
  const [destinationWarehouseId, setDestinationWarehouseId] = useState<string | null>(null);

  // Addition state
  const [items, setItems] = useState<MobileWizardItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null);
  const [isAddItemSheetOpen, setIsAddItemSheetOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Review state
  const [executeNow, setExecuteNow] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success state
  const [createdMovement, setCreatedMovement] = useState<{
    id: string;
    code: string;
    status: "PENDING" | "COMPLETED";
  } | null>(null);

  // Data fetching
  const { data: warehousesData } = useSWR<WarehousesResponse>(
    "warehouses",
    async () => {
      const { api } = await import("@/lib/api");
      return await api.get("warehouses").json<WarehousesResponse>();
    }
  );

  const { data: productsData } = useSWR<ProductsResponse>(
    sourceWarehouseId ? `products?warehouseId=${sourceWarehouseId}` : null,
    async () => {
      const { api } = await import("@/lib/api");
      return await api.get("products").json<ProductsResponse>();
    }
  );

  const { data: batchesData, isLoading: isLoadingBatches } = useSWR<BatchesResponse>(
    selectedProduct && sourceWarehouseId
      ? `batches/warehouse/${sourceWarehouseId}/product/${selectedProduct.id}`
      : null,
    async (url) => {
      const { api } = await import("@/lib/api");
      return await api.get(url).json<BatchesResponse>();
    }
  );

  // Derived data
  const warehouses: WarehouseOption[] = (warehousesData?.data || []).map((w) => ({
    id: w.id,
    name: w.name,
  }));

  const products: ProductSearchResult[] = (productsData?.data || []).map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
  }));

  const batches: BatchOption[] = (batchesData?.data || []).map((b) => ({
    id: b.id,
    batchCode: b.batchCode || b.batchNumber || b.id.slice(0, 8),
    quantity: b.quantity,
    expirationDate: b.expirationDate || undefined,
  }));

  const sourceWarehouse = warehouses.find((w) => w.id === sourceWarehouseId);
  const destinationWarehouse = warehouses.find((w) => w.id === destinationWarehouseId);

  // Navigation
  const goToSetup = useCallback(() => setPhase("setup"), []);
  const goToAddition = useCallback(() => setPhase("addition"), []);
  const goToReview = useCallback(() => setPhase("review"), []);

  const handleBack = useCallback(() => {
    if (phase === "addition") {
      setPhase("setup");
    } else if (phase === "review") {
      setPhase("addition");
    } else if (phase === "setup") {
      router.push("/stock-movements");
    }
  }, [phase, router]);

  // Setup handlers
  const handleSourceChange = useCallback((warehouse: WarehouseOption) => {
    setSourceWarehouseId(warehouse.id);
    if (destinationWarehouseId === warehouse.id) {
      setDestinationWarehouseId(null);
    }
    setItems([]);
  }, [destinationWarehouseId]);

  const handleDestinationChange = useCallback((warehouse: WarehouseOption) => {
    setDestinationWarehouseId(warehouse.id);
  }, []);

  const canContinueFromSetup = sourceWarehouseId && destinationWarehouseId;

  // Addition handlers
  const handleProductSelect = useCallback((product: ProductSearchResult) => {
    setSelectedProduct(product);
    setSearchQuery("");
    setIsAddItemSheetOpen(true);
  }, []);

  const handleBarcodeScan = useCallback((barcode: string) => {
    const product = products.find(
      (p) => p.barcode === barcode || p.sku === barcode
    );
    if (product) {
      handleProductSelect(product);
    } else {
      toast.error("Produto não encontrado");
    }
    setIsScannerOpen(false);
  }, [products, handleProductSelect]);

  const handleAddItem = useCallback((batchId: string, quantity: number) => {
    if (!selectedProduct) return;

    const batch = batches.find((b) => b.id === batchId);
    if (!batch) return;

    if (editingItemIndex !== null) {
      setItems((prev) =>
        prev.map((item, index) =>
          index === editingItemIndex
            ? { ...item, batchId, batchCode: batch.batchCode, quantity, maxQuantity: batch.quantity }
            : item
        )
      );
      setEditingItemIndex(null);
    } else {
      const newItem: MobileWizardItem = {
        id: uuidv4(),
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productSku: selectedProduct.sku || undefined,
        batchId,
        batchCode: batch.batchCode,
        quantity,
        maxQuantity: batch.quantity,
      };
      setItems((prev) => [...prev, newItem]);
    }

    setIsAddItemSheetOpen(false);
    setSelectedProduct(null);
    toast.success("Item adicionado");
  }, [selectedProduct, batches, editingItemIndex]);

  const handleAddAndFinish = useCallback((batchId: string, quantity: number) => {
    handleAddItem(batchId, quantity);
    setPhase("review");
  }, [handleAddItem]);

  const handleEditItem = useCallback((index: number) => {
    const item = items[index];
    const product = products.find((p) => p.id === item.productId);
    if (product) {
      setSelectedProduct(product);
      setEditingItemIndex(index);
      setIsAddItemSheetOpen(true);
    }
  }, [items, products]);

  const handleRemoveItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const canContinueFromAddition = items.length > 0;

  // Submit
  const handleSubmit = useCallback(async () => {
    if (!sourceWarehouseId || !destinationWarehouseId || items.length === 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { api } = await import("@/lib/api");

      const payload = {
        movementType: "TRANSFER",
        sourceWarehouseId,
        destinationWarehouseId,
        items: items.map((item) => ({
          productId: item.productId,
          batchId: item.batchId,
          quantity: item.quantity,
        })),
      };

      const response = await api
        .post("stock-movements", { json: payload })
        .json<CreateMovementResponse>();

      if (response.success) {
        let status: "PENDING" | "COMPLETED" = "PENDING";

        if (executeNow) {
          try {
            await api.post(`stock-movements/${response.data.id}/execute`).json();
            status = "COMPLETED";
          } catch {
            toast.error("Criada, mas não foi possível executar");
          }
        }

        setCreatedMovement({
          id: response.data.id,
          code: response.data.movementCode || `MOV-${response.data.id.slice(0, 8)}`,
          status,
        });
        setPhase("success");
        toast.success("Transferência criada");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao criar transferência";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [sourceWarehouseId, destinationWarehouseId, items, executeNow]);

  // Reset
  const handleNewMovement = useCallback(() => {
    setPhase("setup");
    setSourceWarehouseId(null);
    setDestinationWarehouseId(null);
    setItems([]);
    setSearchQuery("");
    setSelectedProduct(null);
    setExecuteNow(false);
    setCreatedMovement(null);
  }, []);

  return {
    phase,
    warehouses,
    sourceWarehouseId,
    destinationWarehouseId,
    sourceWarehouse,
    destinationWarehouse,
    handleSourceChange,
    handleDestinationChange,
    canContinueFromSetup,
    items,
    products,
    searchQuery,
    setSearchQuery,
    selectedProduct,
    isAddItemSheetOpen,
    setIsAddItemSheetOpen,
    batches,
    isLoadingBatches,
    handleProductSelect,
    handleAddItem,
    handleAddAndFinish,
    handleEditItem,
    handleRemoveItem,
    canContinueFromAddition,
    isScannerOpen,
    setIsScannerOpen,
    handleBarcodeScan,
    executeNow,
    setExecuteNow,
    isSubmitting,
    handleSubmit,
    createdMovement,
    handleNewMovement,
    goToSetup,
    goToAddition,
    goToReview,
    handleBack,
  };
};
