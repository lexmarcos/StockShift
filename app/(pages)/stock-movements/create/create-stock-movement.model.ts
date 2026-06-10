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
  ExistingProductBatchFormState,
  StockMovementProductBatchesResponse,
  StockMovementProductOption,
} from "./create-stock-movement.types";
import { useBreadcrumb } from "@/components/breadcrumb";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import {
  isManualMovementType,
  MANUAL_IN_MOVEMENT_TYPES,
} from "../stock-movements.constants";
import {
  clearStockMovementDraft,
} from "./create-stock-movement.storage";
import {
  buildMovementPayload,
  resolveExistingProductBatchQuantity,
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
  getOptionalText,
  validateExistingProductBatchForm,
} from "./stock-movement-batch-form-validation";
import {
  buildRepeatedProductBatchWarning,
  getPendingInlineProductBarcodeConflictError,
  hasExistingProductInItems,
} from "./stock-movement-draft-guards";
import { lookupStockMovementProductByBarcode } from "./stock-movement-product-lookup";
import {
  buildStockMovementProductSearchUrl,
  formatStockMovementProductLabel,
  mapStockMovementProductOptions,
  PRODUCT_SEARCH_LIMIT,
  shouldShowStockMovementFooter,
  type ProductListResponse,
} from "./stock-movement-product-options";
import { useStockMovementDraftPersistence } from "./use-stock-movement-draft-persistence.model";

interface CreateStockMovementModelParams {
  typeParam?: string | null;
}

const EMPTY_EXISTING_BATCH_FORM: ExistingProductBatchFormState = {
  isOpen: false,
  productId: "",
  productName: "",
  quantity: "",
  manufacturedDate: "",
  expirationDate: "",
  editingIndex: null,
  error: null,
};

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
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const [missingProductBarcode, setMissingProductBarcode] = useState<string | null>(null);
  const [existingProductBatchForm, setExistingProductBatchForm] =
    useState<ExistingProductBatchFormState>(EMPTY_EXISTING_BATCH_FORM);
  const lastScannedBarcodeRef = useRef<string | null>(null);
  const lastScrollYRef = useRef(0);
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
    isDraftHydrated,
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

  useEffect(() => {
    const handleScroll = (): void => {
      const currentScrollY = window.scrollY;
      const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
      setIsFooterVisible(
        shouldShowStockMovementFooter({
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

  const findScannedProductBarcodeConflict = (
    barcode: string | null | undefined,
  ): string | null => {
    return getPendingInlineProductBarcodeConflictError(
      form.getValues("items"),
      barcode,
    );
  };

  const handleProductSelect = (product: StockMovementProductOption) => {
    const barcodeConflictError = findScannedProductBarcodeConflict(product.barcode);
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

    if (isSelectedInMovement()) {
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

  const isSelectedInMovement = (): boolean => {
    if (!selectedMovementType) return false;
    return MANUAL_IN_MOVEMENT_TYPES.includes(
      selectedMovementType as (typeof MANUAL_IN_MOVEMENT_TYPES)[number],
    );
  };

  const resetProductBuilder = (): void => {
    setSelectedProductId("");
    setSelectedProduct(null);
    setProductSearchQuery("");
    setItemQuantity("");
  };

  const closeExistingProductBatchForm = (): void => {
    setExistingProductBatchForm(EMPTY_EXISTING_BATCH_FORM);
  };

  const buildBatchRepeatedProductWarning = (
    params: Pick<ExistingProductBatchFormState, "productId" | "productName" | "editingIndex">,
  ): string | null => {
    if (params.editingIndex !== null) return null;
    if (!hasExistingProductInItems(form.getValues("items"), params.productId)) {
      return null;
    }
    return buildRepeatedProductBatchWarning(params.productName);
  };

  const openExistingProductBatchForm = (
    params: Omit<ExistingProductBatchFormState, "isOpen" | "error">,
  ): void => {
    setExistingProductBatchForm({
      ...params,
      isOpen: true,
      error: null,
      repeatedProductWarning: buildBatchRepeatedProductWarning(params),
    });
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

    const barcodeConflictError = findScannedProductBarcodeConflict(product?.barcode);
    if (barcodeConflictError) {
      setAddItemError(barcodeConflictError);
      return;
    }

    if (isSelectedInMovement()) {
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

  const handleExistingProductBatchOpenChange = (open: boolean): void => {
    if (open) {
      setExistingProductBatchForm((current) => ({ ...current, isOpen: true }));
      return;
    }
    closeExistingProductBatchForm();
  };

  const updateExistingProductBatchForm = (
    patch: Partial<ExistingProductBatchFormState>,
  ): void => {
    setExistingProductBatchForm((current) => ({
      ...current,
      ...patch,
      error: patch.error ?? null,
    }));
  };

  const updateExistingProductBatchQuantity = (
    calculateNextQuantity: (quantity: number) => number,
  ): void => {
    setExistingProductBatchForm((current) => {
      const currentQuantity = resolveExistingProductBatchQuantity(
        current.quantity,
      );
      const nextQuantity = Math.max(calculateNextQuantity(currentQuantity), 0);
      return {
        ...current,
        quantity: nextQuantity > 0 ? String(nextQuantity) : "",
        error: null,
      };
    });
  };

  const handleExistingProductBatchQuantityIncrement = (): void => {
    updateExistingProductBatchQuantity((quantity) => quantity + 1);
  };

  const handleExistingProductBatchQuantityDecrement = (): void => {
    updateExistingProductBatchQuantity((quantity) => quantity - 1);
  };

  const handleApplyExistingProductSalePriceSuggestion = (): void => {
    if (!existingProductSalePriceSuggestion) return;
    updateExistingProductBatchForm({
      sellingPrice: existingProductSalePriceSuggestion.priceCents,
    });
  };

  const handleApplyExistingProductCostPriceSuggestion = (): void => {
    if (!existingProductCostPriceSuggestion) return;
    updateExistingProductBatchForm({
      costPrice: existingProductCostPriceSuggestion.priceCents,
    });
  };

  const buildExistingProductBatchItem = (): CreateStockMovementSchema["items"][number] => ({
    productId: existingProductBatchForm.productId,
    productName: existingProductBatchForm.productName,
    quantity: Number(existingProductBatchForm.quantity),
    manufacturedDate: getOptionalText(existingProductBatchForm.manufacturedDate),
    expirationDate: getOptionalText(existingProductBatchForm.expirationDate),
    costPrice: existingProductBatchForm.costPrice,
    sellingPrice: existingProductBatchForm.sellingPrice,
  });

  const handleConfirmExistingProductBatchData = (): void => {
    const validationError = validateExistingProductBatchForm(
      existingProductBatchForm,
    );
    if (validationError) {
      updateExistingProductBatchForm({ error: validationError });
      return;
    }

    const item = buildExistingProductBatchItem();
    if (existingProductBatchForm.editingIndex !== null) {
      update(existingProductBatchForm.editingIndex, item);
    } else {
      append(item);
      resetProductBuilder();
    }
    closeExistingProductBatchForm();
  };

  const handleCreateNewProduct = async (): Promise<void> => {
    setAddItemError(null);

    if (!selectedMovementType) {
      toast.warning("Selecione o tipo de movimentação antes de continuar.");
      router.replace("/stock-movements");
      return;
    }

    if (
      !MANUAL_IN_MOVEMENT_TYPES.includes(
        selectedMovementType as (typeof MANUAL_IN_MOVEMENT_TYPES)[number],
      )
    ) {
      setAddItemError(
        "Novos produtos só podem ser criados em movimentações de entrada.",
      );
      return;
    }

    inlineProductBarcodeRef.current = undefined;
    await persistCurrentDraft(undefined);
    router.push(`/stock-movements/create/new-product?type=${selectedMovementType}`);
  };

  const navigateToInlineProductWithBarcode = async (
    barcode: string,
  ): Promise<void> => {
    if (!selectedMovementType) return;

    inlineProductBarcodeRef.current = barcode;
    await persistCurrentDraft(barcode);
    setIsScannerOpen(false);
    router.push(`/stock-movements/create/new-product?type=${selectedMovementType}`);
  };

  const handleEditNewProductItem = async (index: number): Promise<void> => {
    if (!selectedMovementType) return;

    const item = form.getValues("items")[index];
    if (!item?.newProductData) return;

    inlineProductBarcodeRef.current = undefined;
    await persistCurrentDraft(undefined);
    router.push(
      `/stock-movements/create/new-product?type=${selectedMovementType}&editItem=${index}`,
    );
  };

  const handleEditExistingProductBatchData = (index: number): void => {
    if (!isSelectedInMovement()) return;
    const item = form.getValues("items")[index];
    if (!item?.productId || item.newProductData) return;

    openExistingProductBatchForm({
      productId: item.productId,
      productName: item.productName || "Produto",
      quantity: String(item.quantity),
      manufacturedDate: item.manufacturedDate || "",
      expirationDate: item.expirationDate || "",
      costPrice: item.costPrice,
      sellingPrice: item.sellingPrice,
      editingIndex: index,
    });
  };

  const resolveScannerQuantity = (): number => {
    const qty = Number(itemQuantity);
    return qty > 0 ? qty : 1;
  };

  const appendScannedProduct = (product: StockMovementProductOption) => {
    const barcodeConflictError = findScannedProductBarcodeConflict(product.barcode);
    if (barcodeConflictError) {
      toast.error(barcodeConflictError);
      return;
    }

    if (isSelectedInMovement()) {
      setIsScannerOpen(false);
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
      return;
    }

    if (hasExistingProductAlreadyAdded(product.id)) {
      toast.warning(`${product.name} já está na movimentação.`);
      return;
    }

    append({
      productId: product.id,
      productName: product.name,
      quantity: resolveScannerQuantity(),
    });
    toast.success(`${product.name} foi adicionado.`);
  };

  const handleBarcodeScan = async (barcode: string) => {
    if (lastScannedBarcodeRef.current === barcode) return;
    lastScannedBarcodeRef.current = barcode;
    window.setTimeout(() => {
      lastScannedBarcodeRef.current = null;
    }, 1500);

    const lookup = await lookupStockMovementProductByBarcode(barcode);
    if (lookup.status === "found") {
      appendScannedProduct(lookup.product);
      return;
    }
    if (lookup.status === "not-found") {
      showMissingProductToast(barcode);
      return;
    }
    toast.error(lookup.message);
  };

  const showMissingProductToast = (barcode: string) => {
    if (!selectedMovementType) {
      toast.error(`Produto com código ${barcode} não existe.`);
      return;
    }

    const canCreateInline = MANUAL_IN_MOVEMENT_TYPES.includes(
      selectedMovementType as (typeof MANUAL_IN_MOVEMENT_TYPES)[number],
    );
    if (!canCreateInline) {
      toast.error(`Produto com código ${barcode} não existe.`);
      return;
    }

    setMissingProductBarcode(barcode);
  };

  const handleMissingProductModalOpenChange = (open: boolean): void => {
    if (!open) {
      setMissingProductBarcode(null);
    }
  };

  const handleCreateProductFromMissingModal = async (): Promise<void> => {
    if (!missingProductBarcode) return;
    await navigateToInlineProductWithBarcode(missingProductBarcode);
    setMissingProductBarcode(null);
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
    onCreateNewProduct: handleCreateNewProduct,
    onEditNewProductItem: handleEditNewProductItem,
    onEditExistingProductBatchData: handleEditExistingProductBatchData,
    onScannerOpenChange: setIsScannerOpen,
    onBarcodeScan: handleBarcodeScan,
    onRemoveItem: remove,
    existingProductBatchForm,
    onExistingProductBatchOpenChange: handleExistingProductBatchOpenChange,
    onExistingProductBatchQuantityChange: (quantity: string) =>
      updateExistingProductBatchForm({ quantity }),
    onExistingProductBatchQuantityIncrement:
      handleExistingProductBatchQuantityIncrement,
    onExistingProductBatchQuantityDecrement:
      handleExistingProductBatchQuantityDecrement,
    onExistingProductBatchManufacturedDateChange: (manufacturedDate: string) =>
      updateExistingProductBatchForm({ manufacturedDate }),
    onExistingProductBatchExpirationDateChange: (expirationDate: string) =>
      updateExistingProductBatchForm({ expirationDate }),
    onExistingProductBatchCostPriceChange: (costPrice?: number) =>
      updateExistingProductBatchForm({ costPrice }),
    onExistingProductBatchSellingPriceChange: (sellingPrice?: number) =>
      updateExistingProductBatchForm({ sellingPrice }),
    onApplyExistingProductCostPriceSuggestion:
      handleApplyExistingProductCostPriceSuggestion,
    onApplyExistingProductSalePriceSuggestion:
      handleApplyExistingProductSalePriceSuggestion,
    onConfirmExistingProductBatchData: handleConfirmExistingProductBatchData,
    existingProductCostPriceSuggestion,
    existingProductSalePriceSuggestion,
    isExistingProductPriceSuggestionLoading: isLoadingProductBatches,
    shouldShowMissingCostPriceSuggestion,
    shouldShowMissingSalePriceSuggestion,
    existingProductProfitSummary,
    items: fields,
    missingProductBarcode,
    onMissingProductModalOpenChange: handleMissingProductModalOpenChange,
    onCreateProductFromMissingModal: handleCreateProductFromMissingModal,
  };
}
