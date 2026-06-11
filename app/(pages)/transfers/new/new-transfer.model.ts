import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useBreadcrumb } from "@/components/breadcrumb";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import { api } from "@/lib/api";
import { newTransferSchema, type NewTransferSchema } from "./new-transfer.schema";
import type {
  NewTransferViewProps,
  TransferBatchDrawerState,
  TransferBatchOption,
  TransferProductOption,
} from "./new-transfer.types";

const PRODUCT_SEARCH_LIMIT = 5;

const EMPTY_BATCH_DRAWER: TransferBatchDrawerState = {
  isOpen: false,
  productId: "",
  productName: "",
  selectedBatchId: "",
  quantity: "1",
  error: null,
};

interface WarehouseListResponse {
  success: boolean;
  data: Array<{ id: string; name: string }>;
}

interface ProductListResponse {
  success: boolean;
  data: { content: TransferProductOption[] } | TransferProductOption[];
}

interface ProductByBarcodeResponse {
  success: boolean;
  data: TransferProductOption;
}

interface TransferBatchSource {
  id: string;
  productId: string;
  productName?: string;
  batchCode?: string | null;
  code?: string | null;
  quantity: number;
  manufacturedDate?: string | null;
  expirationDate?: string | null;
}

interface BatchListResponse {
  success: boolean;
  data: { content: TransferBatchSource[] } | TransferBatchSource[];
}

export const formatTransferProductLabel = (
  product: TransferProductOption,
): string => (product.sku ? `${product.name} (${product.sku})` : product.name);

export const formatTransferProductQuantityLabel = (
  product: TransferProductOption,
): string => `Quantidade: ${product.totalQuantity ?? 0} un.`;

export const filterTransferProductOptions = (
  products: TransferProductOption[],
  query: string,
): TransferProductOption[] => {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length < 2) return [];

  return products
    .filter((product) => doesTransferProductMatch(product, normalizedQuery))
    .slice(0, PRODUCT_SEARCH_LIMIT);
};

export const buildTransferProductBatchesUrl = (
  warehouseId: string | null,
  productId: string,
  isDrawerOpen: boolean,
): string | null => {
  if (!warehouseId || !productId || !isDrawerOpen) return null;
  return `batches/warehouses/${warehouseId}/products/${productId}/batches`;
};

export const clampTransferBatchQuantity = (
  value: string,
  maxQuantity?: number,
): string => {
  const quantity = Number(value);
  if (!Number.isFinite(quantity) || quantity < 1) return "1";
  if (maxQuantity === undefined) return String(quantity);
  return String(Math.min(quantity, Math.max(1, maxQuantity)));
};

const doesTransferProductMatch = (
  product: TransferProductOption,
  normalizedQuery: string,
): boolean => {
  const searchText = [product.name, product.sku || "", product.barcode || ""]
    .join(" ")
    .toLowerCase();
  return searchText.includes(normalizedQuery);
};

const getRawResponseContent = <T>(response: { content: T[] } | T[] | undefined): T[] => {
  if (!response) return [];
  return Array.isArray(response) ? response : response.content;
};

const normalizeTransferBatch = (
  batch: TransferBatchSource,
): TransferBatchOption => ({
  id: batch.id,
  productId: batch.productId,
  productName: batch.productName,
  batchCode: batch.batchCode?.trim() || batch.code?.trim() || batch.id,
  quantity: batch.quantity,
  manufacturedDate: batch.manufacturedDate ?? null,
  expirationDate: batch.expirationDate ?? null,
});

export const getWarehouseBatchQuantityByProduct = (
  batches: TransferBatchSource[],
): Map<string, number> => {
  return batches.reduce((quantityByProduct, batch) => {
    const currentQuantity = quantityByProduct.get(batch.productId) ?? 0;
    quantityByProduct.set(batch.productId, currentQuantity + batch.quantity);
    return quantityByProduct;
  }, new Map<string, number>());
};

interface TransferFooterVisibilityParams {
  currentScrollY: number;
  lastScrollY: number;
  maxScrollY: number;
}

export const shouldShowTransferFooter = ({
  currentScrollY,
  lastScrollY,
  maxScrollY,
}: TransferFooterVisibilityParams): boolean => {
  const isShortPage = maxScrollY <= 8;
  const isAtPageEnd = currentScrollY >= maxScrollY - 8;
  const isScrollingUp = currentScrollY < lastScrollY;
  return isShortPage || isAtPageEnd || isScrollingUp;
};

const resolvePositiveQuantity = (value: string): number => {
  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
};

export function useNewTransferModel(): NewTransferViewProps {
  const router = useRouter();
  const { warehouseId: currentWarehouseId } = useSelectedWarehouse();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<TransferProductOption | null>(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [debouncedProductSearchQuery, setDebouncedProductSearchQuery] =
    useState("");
  const [isProductOptionsOpen, setIsProductOptionsOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [batchDrawer, setBatchDrawer] =
    useState<TransferBatchDrawerState>(EMPTY_BATCH_DRAWER);
  const [addItemError, setAddItemError] = useState<string | null>(null);
  const [isFooterVisible, setIsFooterVisible] = useState(true);
  const productSearchBlurTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScannedBarcodeRef = useRef<string | null>(null);
  const barcodeResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const lastScrollYRef = useRef(0);

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

  const { data: warehousesData, isLoading: isLoadingWarehouses } =
    useSWR<WarehouseListResponse>("warehouses", (url: string) =>
      api.get(url).json<WarehouseListResponse>(),
    );

  const { data: productsData, isLoading: isLoadingProducts } =
    useSWR<ProductListResponse>("products", (url: string) =>
      api.get(url).json<ProductListResponse>(),
    );

  const { data: warehouseBatchesData } = useSWR<BatchListResponse>(
    currentWarehouseId ? `batches/warehouse/${currentWarehouseId}` : null,
    (url: string) => api.get(url).json<BatchListResponse>(),
  );

  const batchesUrl = buildTransferProductBatchesUrl(
    currentWarehouseId,
    batchDrawer.productId,
    batchDrawer.isOpen,
  );
  const { data: batchesData, isLoading: isBatchLoading } =
    useSWR<BatchListResponse>(batchesUrl, (url: string) =>
      api.get(url).json<BatchListResponse>(),
    );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedProductSearchQuery(productSearchQuery);
    }, 350);
    return () => clearTimeout(timeoutId);
  }, [productSearchQuery]);

  useEffect(() => {
    return () => {
      clearProductSearchBlurTimeout();
      if (!barcodeResetTimeoutRef.current) return;
      clearTimeout(barcodeResetTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const handleScroll = (): void => {
      const currentScrollY = window.scrollY;
      const maxScrollY =
        document.documentElement.scrollHeight - window.innerHeight;
      setIsFooterVisible(
        shouldShowTransferFooter({
          currentScrollY,
          lastScrollY: lastScrollYRef.current,
          maxScrollY,
        }),
      );
      lastScrollYRef.current = Math.max(currentScrollY, 0);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const warehouses = (warehousesData?.data || []).flatMap((warehouse) =>
    warehouse.id === currentWarehouseId
      ? []
      : [{ id: warehouse.id, name: warehouse.name }],
  );
  const warehouseBatchQuantityByProduct = getWarehouseBatchQuantityByProduct(
    getRawResponseContent(warehouseBatchesData?.data),
  );
  const products = getRawResponseContent(productsData?.data).map((product) => {
    const totalQuantity = warehouseBatchQuantityByProduct.get(product.id) ?? 0;
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      imageUrl: product.imageUrl,
      totalQuantity,
      stockQuantityLabel: formatTransferProductQuantityLabel({
        ...product,
        totalQuantity,
      }),
    };
  });
  const batches = getRawResponseContent(batchesData?.data).flatMap((batch) => {
    const normalizedBatch = normalizeTransferBatch(batch);
    if (normalizedBatch.productId !== batchDrawer.productId) return [];
    return normalizedBatch.quantity > 0 ? [normalizedBatch] : [];
  });
  const productOptions = filterTransferProductOptions(
    products,
    debouncedProductSearchQuery,
  );

  const clearProductSearchBlurTimeout = (): void => {
    if (!productSearchBlurTimeoutRef.current) return;
    clearTimeout(productSearchBlurTimeoutRef.current);
    productSearchBlurTimeoutRef.current = null;
  };

  const openBatchDrawerForProduct = (product: TransferProductOption): void => {
    if (!currentWarehouseId) {
      setAddItemError("Selecione um warehouse de origem.");
      return;
    }

    setBatchDrawer({
      isOpen: true,
      productId: product.id,
      productName: product.name,
      selectedBatchId: "",
      quantity: "1",
      error: null,
    });
  };

  const handleProductSelect = (product: TransferProductOption): void => {
    setSelectedProduct(product);
    setSelectedProductId(product.id);
    setProductSearchQuery(formatTransferProductLabel(product));
    setIsProductOptionsOpen(false);
    setAddItemError(null);
    openBatchDrawerForProduct(product);
  };

  const handleProductSearchFocus = (): void => {
    clearProductSearchBlurTimeout();
    setIsProductOptionsOpen(true);
  };

  const handleProductSearchBlur = (): void => {
    productSearchBlurTimeoutRef.current = setTimeout(() => {
      setIsProductOptionsOpen(false);
    }, 120);
  };

  const handleProductSearchChange = (query: string): void => {
    setProductSearchQuery(query);
    setIsProductOptionsOpen(true);
    setAddItemError(null);
    if (!selectedProduct) return;
    if (query === formatTransferProductLabel(selectedProduct)) return;
    setSelectedProduct(null);
    setSelectedProductId("");
  };

  const resetProductBuilder = (): void => {
    setSelectedProduct(null);
    setSelectedProductId("");
    setProductSearchQuery("");
    setIsProductOptionsOpen(false);
    setBatchDrawer(EMPTY_BATCH_DRAWER);
  };

  const handleProductClear = (): void => {
    resetProductBuilder();
    setAddItemError(null);
  };

  const handleBatchDrawerOpenChange = (open: boolean): void => {
    setBatchDrawer((current) => ({
      ...current,
      isOpen: open,
      error: open ? current.error : null,
    }));
  };

  const updateBatchDrawer = (
    patch: Partial<TransferBatchDrawerState>,
  ): void => {
    setBatchDrawer((current) => ({
      ...current,
      ...patch,
      error: patch.error ?? null,
    }));
  };

  const updateBatchQuantity = (
    calculateNextQuantity: (quantity: number) => number,
  ): void => {
    setBatchDrawer((current) => {
      const batch = batches.find((item) => item.id === current.selectedBatchId);
      const currentQuantity = Number(
        clampTransferBatchQuantity(current.quantity, batch?.quantity),
      );
      const nextQuantity = calculateNextQuantity(currentQuantity);
      return {
        ...current,
        quantity: clampTransferBatchQuantity(String(nextQuantity), batch?.quantity),
        error: null,
      };
    });
  };

  const handleBatchChange = (batchId: string): void => {
    const batch = batches.find((item) => item.id === batchId);
    setBatchDrawer((current) => ({
      ...current,
      selectedBatchId: batchId,
      quantity: clampTransferBatchQuantity(current.quantity, batch?.quantity),
      error: null,
    }));
  };

  const handleQuantityChange = (quantity: string): void => {
    const batch = batches.find((item) => item.id === batchDrawer.selectedBatchId);
    updateBatchDrawer({
      quantity: clampTransferBatchQuantity(quantity, batch?.quantity),
    });
  };

  const appendSelectedBatch = (
    batch: TransferBatchOption,
    quantity: number,
  ): void => {
    append({
      sourceBatchId: batch.id,
      quantity,
      productName: batch.productName || batchDrawer.productName,
      batchCode: batch.batchCode,
      availableQuantity: batch.quantity,
    });
    resetProductBuilder();
  };

  const handleConfirmBatch = (): void => {
    const batch = batches.find((item) => item.id === batchDrawer.selectedBatchId);
    const quantity = resolvePositiveQuantity(batchDrawer.quantity);
    if (!batchDrawer.selectedBatchId) {
      updateBatchDrawer({ error: "Selecione um lote." });
      return;
    }
    if (!batch) {
      updateBatchDrawer({ error: "Lote indisponível para o produto selecionado." });
      return;
    }
    if (!quantity) {
      updateBatchDrawer({ error: "Informe uma quantidade válida." });
      return;
    }
    if (quantity > batch.quantity) {
      updateBatchDrawer({ error: `Quantidade indisponível no lote (Máx: ${batch.quantity}).` });
      return;
    }
    appendSelectedBatch(batch, quantity);
  };

  const markBarcodeAsProcessing = (barcode: string): boolean => {
    if (lastScannedBarcodeRef.current === barcode) return false;
    lastScannedBarcodeRef.current = barcode;
    if (barcodeResetTimeoutRef.current) clearTimeout(barcodeResetTimeoutRef.current);
    barcodeResetTimeoutRef.current = setTimeout(() => {
      lastScannedBarcodeRef.current = null;
    }, 1500);
    return true;
  };

  const handleBarcodeScan = async (barcode: string): Promise<void> => {
    if (!markBarcodeAsProcessing(barcode)) return;
    try {
      const response = await api
        .get(`products/barcode/${encodeURIComponent(barcode)}`)
        .json<ProductByBarcodeResponse>();
      setIsScannerOpen(false);
      handleProductSelect(response.data);
    } catch {
      toast.error(`Produto com código ${barcode} não existe.`);
    }
  };

  const onSubmit = async (data: NewTransferSchema): Promise<void> => {
    if (!currentWarehouseId) {
      toast.warning("Selecione um estoque de origem.");
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
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Erro ao criar transferência.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    onSubmit,
    warehouses,
    products,
    productOptions,
    batches,
    batchDrawer,
    isLoading: isLoadingWarehouses || isLoadingProducts,
    isProductSearchLoading:
      isLoadingProducts && debouncedProductSearchQuery.trim().length >= 2,
    isProductOptionsOpen,
    isBatchLoading,
    isScannerOpen,
    isFooterVisible,
    isSubmitting,
    selectedProductId,
    productSearchQuery,
    addItemError,
    onProductSearchChange: handleProductSearchChange,
    onProductSearchFocus: handleProductSearchFocus,
    onProductSearchBlur: handleProductSearchBlur,
    onProductSelect: handleProductSelect,
    onProductClear: handleProductClear,
    onScannerOpenChange: setIsScannerOpen,
    onBarcodeScan: handleBarcodeScan,
    onBatchDrawerOpenChange: handleBatchDrawerOpenChange,
    onBatchChange: handleBatchChange,
    onQuantityChange: handleQuantityChange,
    onQuantityIncrement: () => updateBatchQuantity((quantity) => quantity + 1),
    onQuantityDecrement: () => updateBatchQuantity((quantity) => quantity - 1),
    onConfirmBatch: handleConfirmBatch,
    onRemoveItem: remove,
    items: fields,
  };
}
