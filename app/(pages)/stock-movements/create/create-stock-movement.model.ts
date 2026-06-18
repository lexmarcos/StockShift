import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { api } from "@/lib/api";
import {
  createStockMovementSchema,
  CreateStockMovementSchema,
} from "./create-stock-movement.schema";
import {
  CreateStockMovementViewProps,
  StockMovementProductBatchesResponse,
  StockMovementProductOption,
} from "./create-stock-movement.types";
import { useBreadcrumb } from "@/components/breadcrumb";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import {
  isManualMovementType,
} from "../stock-movements.constants";
import {
  clearStockMovementDraft,
} from "./create-stock-movement.storage";
import {
  buildMovementPayload,
  uploadInlineProductImages,
} from "./create-stock-movement.payload";
import {
  buildExistingProductBatchesUrl,
  buildExistingProductProfitSummary,
  buildExistingProductSalePriceSuggestion,
  buildExistingProductCostPriceSuggestion,
  findMostRecentWarehouseProductBatch,
} from "./stock-movement-batch-pricing.model";
import {
  getPendingInlineProductBarcodeConflictError,
  hasExistingProductInItems,
} from "./stock-movement-draft-guards";
import {
  buildStockMovementProductSearchUrl,
  formatStockMovementProductLabel,
  mapStockMovementProductOptions,
  PRODUCT_SEARCH_LIMIT,
  type ProductListResponse,
} from "./stock-movement-product-options";
import { useFooterVisibility } from "@/hooks/footer-visibility/use-footer-visibility";
import { useStockMovementDraftPersistence } from "./use-stock-movement-draft-persistence.model";
import { useExistingProductBatchForm } from "./use-existing-product-batch-form.model";
import { isSelectedInMovement, useStockMovementScanner } from "./use-stock-movement-scanner.model";

interface CreateStockMovementModelParams {
  typeParam?: string | null;
}

export function useCreateStockMovementModel({
  typeParam = null,
}: CreateStockMovementModelParams = {}): CreateStockMovementViewProps {
  const router = useRouter();
  const { warehouseId } = useSelectedWarehouse();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingStep, setSubmittingStep] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedProduct, setSelectedProduct] =
    useState<StockMovementProductOption | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [debouncedProductSearchQuery, setDebouncedProductSearchQuery] =
    useState("");
  const [isProductOptionsOpen, setIsProductOptionsOpen] = useState(false);
  const [itemQuantity, setItemQuantity] = useState("");
  const [addItemError, setAddItemError] = useState<string | null>(null);
  const { isFooterVisible } = useFooterVisibility();
  const productSearchBlurTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedMovementType = isManualMovementType(typeParam)
    ? typeParam
    : undefined;

  useBreadcrumb({
    title: "Nova Movimentação",
    backUrl: "/stock-movements",
    section: "Movimentações",
    subsection: "Criar",
  });

  const form = useForm<CreateStockMovementSchema>({
    resolver: zodResolver(createStockMovementSchema),
    defaultValues: {
      type: selectedMovementType,
      items: [],
      notes: "",
    },
  });

  useEffect(() => {
    if (!selectedMovementType) return;
    form.setValue("type", selectedMovementType, { shouldValidate: true });
  }, [form, selectedMovementType]);

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const handleDraftRestored = useCallback(
    ({ selectedProductId: restoredId, itemQuantity: restoredQty }: { selectedProductId: string; itemQuantity: string }) => {
      setSelectedProductId(restoredId);
      setItemQuantity(restoredQty);
    },
    [],
  );

  const {
    persistCurrentDraft,
    inlineProductBarcodeRef,
    resetDraftRevision,
  } = useStockMovementDraftPersistence({
    form,
    selectedMovementType,
    warehouseId,
    selectedProductId,
    itemQuantity,
    onDraftRestored: handleDraftRestored,
  });

  const { data: productsData, isLoading: isLoadingProducts } =
    useSWR<ProductListResponse>("products", (url: string) =>
      api.get(url).json<ProductListResponse>(),
    );

  const resetProductBuilder = (): void => {
    setSelectedProductId("");
    setSelectedProduct(null);
    setProductSearchQuery("");
    setItemQuantity("");
  };

  const salePriceSuggestionRef = useRef<{ priceCents: number } | undefined>(undefined);
  const costPriceSuggestionRef = useRef<{ priceCents: number } | undefined>(undefined);

  const {
    existingProductBatchForm,
    onExistingProductBatchOpenChange,
    onExistingProductBatchQuantityChange,
    onExistingProductBatchQuantityIncrement,
    onExistingProductBatchQuantityDecrement,
    onExistingProductBatchManufacturedDateChange,
    onExistingProductBatchExpirationDateChange,
    onExistingProductBatchCostPriceChange,
    onExistingProductBatchSellingPriceChange,
    onApplyExistingProductCostPriceSuggestion,
    onApplyExistingProductSalePriceSuggestion,
    onConfirmExistingProductBatchData,
    openExistingProductBatchForm,
  } = useExistingProductBatchForm({
    formItems: fields,
    append,
    update,
    onItemConfirmed: resetProductBuilder,
    salePriceSuggestionRef,
    costPriceSuggestionRef,
  });

  const {
    isScannerOpen,
    setScannerOpen,
    onBarcodeScan,
    missingProductBarcode,
    onMissingProductModalOpenChange,
    onCreateProductFromMissingModal,
    onCreateNewProduct,
    onEditNewProductItem,
    onEditExistingProductBatchData,
    inlineDuplicateWarning,
    onInlineDuplicateWarningOpenChange,
  } = useStockMovementScanner({
    selectedMovementType,
    router,
    form,
    append,
    persistCurrentDraft,
    inlineProductBarcodeRef,
    itemQuantity,
    openExistingProductBatchForm,
    setAddItemError,
  });

  const productBatchesUrl = buildExistingProductBatchesUrl(
    warehouseId,
    existingProductBatchForm.isOpen ? existingProductBatchForm.productId : null,
  );
  const { data: productBatchesData, isLoading: isLoadingProductBatches } =
    useSWR<StockMovementProductBatchesResponse>(
      productBatchesUrl,
      (url: string) => api.get(url).json<StockMovementProductBatchesResponse>(),
    );
  const mostRecentBatch = findMostRecentWarehouseProductBatch(productBatchesData?.data ?? []);
  const existingProductSalePriceSuggestion =
    buildExistingProductSalePriceSuggestion(mostRecentBatch);
  const existingProductCostPriceSuggestion =
    buildExistingProductCostPriceSuggestion(mostRecentBatch);
  const existingProductProfitSummary = buildExistingProductProfitSummary({
    quantity: existingProductBatchForm.quantity,
    costPrice: existingProductBatchForm.costPrice,
    sellingPrice: existingProductBatchForm.sellingPrice,
  });
  const shouldShowMissingSalePriceSuggestion = Boolean(
    productBatchesUrl &&
      !isLoadingProductBatches &&
      !existingProductSalePriceSuggestion,
  );
  const shouldShowMissingCostPriceSuggestion = Boolean(
    productBatchesUrl &&
      !isLoadingProductBatches &&
      !existingProductCostPriceSuggestion,
  );

  salePriceSuggestionRef.current = existingProductSalePriceSuggestion ?? undefined;
  costPriceSuggestionRef.current = existingProductCostPriceSuggestion ?? undefined;

  const products = mapStockMovementProductOptions(productsData);

  const productSearchUrl = selectedProduct
    ? null
    : buildStockMovementProductSearchUrl(debouncedProductSearchQuery);
  const { data: productSearchData, isLoading: isSearchingProducts } =
    useSWR<ProductListResponse>(productSearchUrl, (url: string) =>
      api.get(url).json<ProductListResponse>(),
    );

  useEffect(() => {
    if (!selectedProductId || productSearchQuery || products.length === 0) return;
    const restoredProduct = products.find((product) => {
      return product.id === selectedProductId;
    });
    if (!restoredProduct) return;
    setSelectedProduct(restoredProduct);
    setProductSearchQuery(formatStockMovementProductLabel(restoredProduct));
  }, [productSearchQuery, products, selectedProductId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedProductSearchQuery(productSearchQuery);
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [productSearchQuery]);

  useEffect(() => {
    return () => {
      if (!productSearchBlurTimeoutRef.current) return;
      clearTimeout(productSearchBlurTimeoutRef.current);
    };
  }, []);

  const productOptions = productSearchUrl
    ? mapStockMovementProductOptions(productSearchData).slice(
        0,
        PRODUCT_SEARCH_LIMIT,
      )
    : [];

  const clearProductSearchBlurTimeout = () => {
    if (!productSearchBlurTimeoutRef.current) return;
    clearTimeout(productSearchBlurTimeoutRef.current);
    productSearchBlurTimeoutRef.current = null;
  };

  const findBarcodeConflict = (barcode: string | null | undefined): string | null =>
    getPendingInlineProductBarcodeConflictError(form.getValues("items"), barcode);

  const handleProductSelect = (product: StockMovementProductOption) => {
    const barcodeConflictError = findBarcodeConflict(product.barcode);
    if (barcodeConflictError) {
      setIsProductOptionsOpen(false);
      setAddItemError(barcodeConflictError);
      return;
    }

    setSelectedProduct(product);
    setSelectedProductId(product.id);
    setProductSearchQuery(formatStockMovementProductLabel(product));
    setIsProductOptionsOpen(false);
    setAddItemError(null);

    if (isSelectedInMovement(selectedMovementType)) {
      openExistingProductBatchForm({
        productId: product.id,
        productName: product.name,
        quantity: "",
        manufacturedDate: "",
        expirationDate: "",
        costPrice: undefined,
        sellingPrice: undefined,
        editingIndex: null,
      });
    }
  };

  const handleProductSearchFocus = () => {
    clearProductSearchBlurTimeout();
    setIsProductOptionsOpen(true);
  };

  const handleProductSearchBlur = () => {
    productSearchBlurTimeoutRef.current = setTimeout(() => {
      setIsProductOptionsOpen(false);
    }, 120);
  };

  const handleProductSearchChange = (query: string) => {
    setProductSearchQuery(query);
    setIsProductOptionsOpen(true);
    setAddItemError(null);

    if (!selectedProduct) return;
    if (query === formatStockMovementProductLabel(selectedProduct)) return;

    setSelectedProduct(null);
    setSelectedProductId("");
  };

  const handleProductClear = () => {
    setSelectedProduct(null);
    setSelectedProductId("");
    setProductSearchQuery("");
    setIsProductOptionsOpen(false);
    setAddItemError(null);
  };

  const appendExistingProductItem = (
    productId: string,
    productName: string,
    quantity: number,
  ): void => {
    append({ productId, quantity, productName });
    resetProductBuilder();
  };

  const hasExistingProductAlreadyAdded = (productId: string): boolean => {
    return hasExistingProductInItems(form.getValues("items"), productId);
  };

  const getSelectedProductQuantity = (): number | null => {
    const quantity = Number(itemQuantity);
    return quantity > 0 ? quantity : null;
  };

  const handleAddItem = () => {
    setAddItemError(null);
    if (!selectedProductId) {
      setAddItemError("Selecione um produto.");
      return;
    }

    const product =
      selectedProduct || products.find((p) => p.id === selectedProductId);
    const productName = product?.name || "Produto";

    const barcodeConflictError = findBarcodeConflict(product?.barcode);
    if (barcodeConflictError) {
      setAddItemError(barcodeConflictError);
      return;
    }

    if (isSelectedInMovement(selectedMovementType)) {
      openExistingProductBatchForm({
        productId: selectedProductId,
        productName,
        quantity: itemQuantity || "",
        manufacturedDate: "",
        expirationDate: "",
        costPrice: undefined,
        sellingPrice: undefined,
        editingIndex: null,
      });
      return;
    }

    const quantity = getSelectedProductQuantity();
    if (!quantity) {
      setAddItemError("Informe uma quantidade válida.");
      return;
    }

    if (hasExistingProductAlreadyAdded(selectedProductId)) {
      setAddItemError(
        "Este produto já foi adicionado. Remova-o para alterar a quantidade.",
      );
      return;
    }

    appendExistingProductItem(selectedProductId, productName, quantity);
  };

  const onSubmit = async (data: CreateStockMovementSchema) => {
    if (!selectedMovementType) {
      toast.warning("Selecione o tipo de movimentação antes de continuar.");
      router.replace("/stock-movements");
      return;
    }

    setIsSubmitting(true);
    setSubmittingStep("Preparando dados da movimentação…");
    try {
      const payload = buildMovementPayload(selectedMovementType, data);

      setSubmittingStep("Fazendo upload das imagens…");
      const payloadWithImages = await uploadInlineProductImages(payload, data.items);

      setSubmittingStep("Ajustando preços e quantidades…");
      await api.post("stock-movements", { json: payloadWithImages });

      setSubmittingStep("Finalizando…");
      await clearStockMovementDraft();
      resetDraftRevision();
      toast.success("Movimentação criada com sucesso!");
      router.push("/stock-movements");
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Erro ao criar movimentação.");
    } finally {
      setIsSubmitting(false);
      setSubmittingStep(null);
    }
  };

  return {
    form,
    onSubmit,
    products,
    isLoadingProducts,
    isSubmitting,
    submittingStep,
    isFooterVisible,
    selectedProductId,
    productSearchQuery,
    productOptions,
    isProductOptionsOpen,
    isProductSearchLoading: Boolean(productSearchUrl) && isSearchingProducts,
    itemQuantity,
    addItemError,
    isScannerOpen,
    onProductSearchChange: handleProductSearchChange,
    onProductSearchFocus: handleProductSearchFocus,
    onProductSearchBlur: handleProductSearchBlur,
    onProductSelect: handleProductSelect,
    onProductClear: handleProductClear,
    onQuantityChange: setItemQuantity,
    onAddItem: handleAddItem,
    onCreateNewProduct,
    onEditNewProductItem,
    onEditExistingProductBatchData,
    onScannerOpenChange: setScannerOpen,
    onBarcodeScan,
    onRemoveItem: remove,
    existingProductBatchForm,
    onExistingProductBatchOpenChange,
    onExistingProductBatchQuantityChange,
    onExistingProductBatchQuantityIncrement,
    onExistingProductBatchQuantityDecrement,
    onExistingProductBatchManufacturedDateChange,
    onExistingProductBatchExpirationDateChange,
    onExistingProductBatchCostPriceChange,
    onExistingProductBatchSellingPriceChange,
    onApplyExistingProductCostPriceSuggestion,
    onApplyExistingProductSalePriceSuggestion,
    onConfirmExistingProductBatchData,
    existingProductCostPriceSuggestion,
    existingProductSalePriceSuggestion,
    isExistingProductPriceSuggestionLoading: isLoadingProductBatches,
    shouldShowMissingCostPriceSuggestion,
    shouldShowMissingSalePriceSuggestion,
    existingProductProfitSummary,
    items: fields,
    missingProductBarcode,
    onMissingProductModalOpenChange,
    onCreateProductFromMissingModal,
    inlineDuplicateWarning,
    onInlineDuplicateWarningOpenChange,
  };
}
