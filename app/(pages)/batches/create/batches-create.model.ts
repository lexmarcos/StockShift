import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import {
  batchCreateSchema,
  BatchCreateFormData,
} from "./batches-create.schema";
import type {
  BatchCreatePayload,
  BatchCreateResponse,
  ProductLookupResponse,
  ProductSearchOption,
  ProductSearchResponse,
} from "./batches-create.types";
import { useBreadcrumb } from "@/components/breadcrumb";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";

const PRODUCT_SEARCH_LIMIT = 5;

export const buildProductSearchUrl = (query: string): string | null => {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 2) return null;

  const params = new URLSearchParams({ q: trimmedQuery });
  return `products/search?${params.toString()}`;
};

export const buildProductBarcodeUrl = (barcode: string): string | null => {
  const trimmedBarcode = barcode.trim();
  if (!trimmedBarcode) return null;

  return `products/barcode/${encodeURIComponent(trimmedBarcode)}`;
};

export const limitProductSearchOptions = (
  products: ProductSearchOption[],
): ProductSearchOption[] => products.slice(0, PRODUCT_SEARCH_LIMIT);

export const formatProductOptionLabel = (
  product: ProductSearchOption,
): string => (product.sku ? `${product.name} (${product.sku})` : product.name);

export const buildBatchPayload = (
  data: BatchCreateFormData,
  warehouseId: string,
): BatchCreatePayload => ({
  productId: data.productId,
  warehouseId,
  quantity: data.quantity,
  manufacturedDate: data.manufacturedDate || undefined,
  expirationDate: data.expirationDate || undefined,
  costPrice: data.costPrice,
  sellingPrice: data.sellingPrice,
  notes: data.notes?.trim() || undefined,
});

export const useBatchCreateModel = () => {
  const router = useRouter();
  const { warehouseId } = useSelectedWarehouse();
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [debouncedProductSearchQuery, setDebouncedProductSearchQuery] =
    useState("");
  const [selectedProduct, setSelectedProduct] =
    useState<ProductSearchOption | null>(null);
  const [isProductOptionsOpen, setIsProductOptionsOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const productSearchBlurTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  useBreadcrumb({
    title: "Novo Lote",
    backUrl: "/batches",
    section: "Lotes",
    subsection: "Criar",
  });

  const form = useForm<BatchCreateFormData>({
    resolver: zodResolver(batchCreateSchema),
    defaultValues: {
      productId: "",
      quantity: 1,
      manufacturedDate: "",
      expirationDate: "",
      costPrice: undefined,
      sellingPrice: undefined,
      notes: "",
    },
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedProductSearchQuery(productSearchQuery);
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [productSearchQuery]);

  useEffect(() => {
    return () => {
      if (productSearchBlurTimeoutRef.current) {
        clearTimeout(productSearchBlurTimeoutRef.current);
      }
    };
  }, []);

  const productSearchUrl = buildProductSearchUrl(debouncedProductSearchQuery);
  const {
    data: productsData,
    isLoading: isProductSearchLoading,
    isValidating: isProductSearchValidating,
  } = useSWR<ProductSearchResponse>(
    productSearchUrl,
    async (url: string) => {
      const { api } = await import("@/lib/api");
      return api.get(url).json<ProductSearchResponse>();
    },
  );

  const productOptions = limitProductSearchOptions(productsData?.data || []);

  const clearProductSearchBlurTimeout = () => {
    if (!productSearchBlurTimeoutRef.current) return;
    clearTimeout(productSearchBlurTimeoutRef.current);
    productSearchBlurTimeoutRef.current = null;
  };

  const selectProduct = (product: ProductSearchOption) => {
    setSelectedProduct(product);
    setProductSearchQuery(formatProductOptionLabel(product));
    setIsProductOptionsOpen(false);
    form.setValue("productId", product.id, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onProductSearchFocus = () => {
    clearProductSearchBlurTimeout();
    setIsProductOptionsOpen(true);
  };

  const onProductSearchBlur = () => {
    productSearchBlurTimeoutRef.current = setTimeout(() => {
      setIsProductOptionsOpen(false);
    }, 120);
  };

  const onProductSearchChange = (query: string) => {
    setProductSearchQuery(query);
    setIsProductOptionsOpen(true);

    if (!selectedProduct) return;
    if (query === formatProductOptionLabel(selectedProduct)) return;

    setSelectedProduct(null);
    form.setValue("productId", "", { shouldDirty: true, shouldValidate: true });
  };

  const onProductClear = () => {
    setSelectedProduct(null);
    setProductSearchQuery("");
    setIsProductOptionsOpen(false);
    form.setValue("productId", "", { shouldDirty: true, shouldValidate: true });
  };

  const openScanner = () => setIsScannerOpen(true);
  const closeScanner = () => setIsScannerOpen(false);

  const handleBarcodeScan = async (barcode: string) => {
    const barcodeUrl = buildProductBarcodeUrl(barcode);
    setProductSearchQuery(barcode.trim());
    setIsProductOptionsOpen(true);

    if (!barcodeUrl) {
      toast.error("Código de barras vazio");
      return;
    }

    try {
      const { api } = await import("@/lib/api");
      const response = await api.get(barcodeUrl).json<ProductLookupResponse>();
      if (!response.success || !response.data) {
        toast.error(`Produto não encontrado para o código ${barcode}`);
        return;
      }

      selectProduct(response.data);
      toast.success(`Produto ${response.data.name} encontrado`);
    } catch (error) {
      console.error("Erro ao buscar produto por código de barras:", error);
      toast.error(`Produto não encontrado para o código ${barcode}`);
    }
  };

  const updateQuantity = (quantity: number) => {
    form.setValue("quantity", Math.max(1, quantity), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onQuantityIncrement = () => {
    updateQuantity((form.getValues("quantity") || 0) + 1);
  };

  const onQuantityDecrement = () => {
    updateQuantity((form.getValues("quantity") || 1) - 1);
  };

  const onSubmit = async (data: BatchCreateFormData) => {
    if (!warehouseId) {
      toast.error("Selecione um warehouse ativo para criar o batch");
      return;
    }

    if (selectedProduct?.hasExpiration && !data.expirationDate) {
      form.setError("expirationDate", {
        message: "Validade obrigatória para este produto",
      });
      return;
    }

    try {
      const payload = buildBatchPayload(data, warehouseId);
      const { api } = await import("@/lib/api");
      const response = await api
        .post("batches", { json: payload })
        .json<BatchCreateResponse>();

      if (response.success) {
        toast.success("Batch criado com sucesso");
        router.push(`/batches/${response.data.id}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao criar batch";
      toast.error(message);
    }
  };

  return {
    form,
    onSubmit,
    productSearchQuery,
    productOptions,
    isProductSearchLoading:
      Boolean(productSearchUrl) &&
      (isProductSearchLoading || isProductSearchValidating),
    isProductOptionsOpen,
    onProductSearchChange,
    onProductSearchFocus,
    onProductSearchBlur,
    onProductSelect: selectProduct,
    onProductClear,
    openScanner,
    closeScanner,
    isScannerOpen,
    handleBarcodeScan,
    selectedWarehouseId: warehouseId,
    onQuantityIncrement,
    onQuantityDecrement,
    selectedProduct,
  };
};
