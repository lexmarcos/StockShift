import { useEffect, useRef, useState } from "react";
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
  inlineProductImageToFile,
  readStockMovementDraft,
  writeStockMovementDraft,
} from "./create-stock-movement.storage";
import {
  buildExistingProductBatchesUrl,
  buildExistingProductProfitSummary,
  buildExistingProductSalePriceSuggestion,
  buildExistingProductCostPriceSuggestion,
  findMostRecentWarehouseProductBatch,
} from "./stock-movement-batch-pricing.model";

const getOptionalText = (value: string | undefined): string | undefined => {
  const trimmedValue = value?.trim();
  return trimmedValue || undefined;
};

const resolveExistingProductBatchQuantity = (value: string): number => {
  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
};

const buildExistingProductItemPayload = (
  item: CreateStockMovementSchema["items"][number],
) => {
  const payload: {
    productId: string | undefined;
    quantity: number;
    manufacturedDate?: string;
    expirationDate?: string;
    costPrice?: number;
    sellingPrice?: number;
  } = { productId: item.productId, quantity: item.quantity };

  const manufacturedDate = getOptionalText(item.manufacturedDate);
  const expirationDate = getOptionalText(item.expirationDate);
  if (manufacturedDate) payload.manufacturedDate = manufacturedDate;
  if (expirationDate) payload.expirationDate = expirationDate;
  if (item.costPrice !== undefined) payload.costPrice = item.costPrice;
  if (item.sellingPrice !== undefined) payload.sellingPrice = item.sellingPrice;
  return payload;
};

const buildMovementItemPayload = (
  item: CreateStockMovementSchema["items"][number],
) => {
  if (!item.newProductData) return buildExistingProductItemPayload(item);
  const newProduct = {
    name: item.newProductData.name,
    description: item.newProductData.description,
    barcode: item.newProductData.barcode,
    categoryId: item.newProductData.categoryId,
    brandId: item.newProductData.brandId,
    isKit: item.newProductData.isKit,
    hasExpiration: Boolean(item.newProductData.expirationDate),
    active: item.newProductData.active,
    attributes: item.newProductData.attributes,
  };
  return {
    quantity: item.quantity,
    newProduct,
    manufacturedDate: getOptionalText(item.newProductData.manufacturedDate),
    expirationDate: getOptionalText(item.newProductData.expirationDate),
    costPrice: item.newProductData.costPrice,
    sellingPrice: item.newProductData.sellingPrice,
  };
};

const hasInlineProductImages = (
  items: CreateStockMovementSchema["items"],
): boolean => {
  return items.some((item) => Boolean(item.newProductData?.image));
};

export const buildMovementPayload = (
  selectedMovementType: NonNullable<CreateStockMovementSchema["type"]>,
  data: CreateStockMovementSchema,
) => ({
  type: selectedMovementType,
  notes: data.notes || undefined,
  items: data.items.map(buildMovementItemPayload),
});

const buildMovementFormData = (
  payload: ReturnType<typeof buildMovementPayload>,
  items: CreateStockMovementSchema["items"],
): FormData => {
  const formData = new FormData();
  const movementBlob = new Blob([JSON.stringify(payload)], {
    type: "application/json",
  });
  formData.append("movement", movementBlob);
  items.forEach((item) => {
    if (!item.newProductData) return;
    const imageFile = item.newProductData.image
      ? inlineProductImageToFile(item.newProductData.image)
      : new File([], "empty-inline-product-image");
    formData.append("inlineProductImages", imageFile);
  });
  return formData;
};

interface ProductListResponse {
  success: boolean;
  data:
    | { content: StockMovementProductOption[] }
    | StockMovementProductOption[];
}

interface ProductByBarcodeResponse {
  success: boolean;
  data: StockMovementProductOption;
}

interface CreateStockMovementModelParams {
  typeParam?: string | null;
}

const PRODUCT_SEARCH_LIMIT = 5;

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

interface FooterVisibilityParams {
  currentScrollY: number;
  lastScrollY: number;
  maxScrollY: number;
}

export const shouldShowStockMovementFooter = ({
  currentScrollY,
  lastScrollY,
  maxScrollY,
}: FooterVisibilityParams): boolean => {
  const isShortPage = maxScrollY <= 8;
  const isAtPageEnd = currentScrollY >= maxScrollY - 8;
  const isScrollingUp = currentScrollY < lastScrollY;
  return isShortPage || isAtPageEnd || isScrollingUp;
};

export const formatStockMovementProductLabel = (
  product: StockMovementProductOption,
): string => (product.sku ? `${product.name} (${product.sku})` : product.name);

export const filterStockMovementProductOptions = (
  products: StockMovementProductOption[],
  query: string,
): StockMovementProductOption[] => {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length < 2) return [];

  return products
    .filter((product) => {
      const searchText = [
        product.name,
        product.sku || "",
        product.barcode || "",
      ]
        .join(" ")
        .toLowerCase();
      return searchText.includes(normalizedQuery);
    })
    .slice(0, PRODUCT_SEARCH_LIMIT);
};

export function useCreateStockMovementModel({
  typeParam = null,
}: CreateStockMovementModelParams = {}): CreateStockMovementViewProps {
  const router = useRouter();
  const { warehouseId } = useSelectedWarehouse();
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    if (!selectedMovementType) {
      toast.error("Selecione o tipo de movimentação antes de continuar.");
      router.replace("/stock-movements");
      return;
    }

    form.setValue("type", selectedMovementType, { shouldValidate: true });
  }, [form, router, selectedMovementType]);

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    const draft = readStockMovementDraft();
    if (!draft) return;

    form.reset({
      type: draft.type,
      notes: draft.notes,
      items: draft.items,
    });
    setSelectedProductId("");
    setItemQuantity("");

    clearStockMovementDraft();
  }, [append, form]);

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

  const rawProducts = productsData?.data;
  const products = (
    Array.isArray(rawProducts) ? rawProducts : rawProducts?.content || []
  ).map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    imageUrl: p.imageUrl,
  }));

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

  const productOptions = filterStockMovementProductOptions(
    products,
    debouncedProductSearchQuery,
  );

  const clearProductSearchBlurTimeout = () => {
    if (!productSearchBlurTimeoutRef.current) return;
    clearTimeout(productSearchBlurTimeoutRef.current);
    productSearchBlurTimeoutRef.current = null;
  };

  const handleProductSelect = (product: StockMovementProductOption) => {
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

  const openExistingProductBatchForm = (
    params: Omit<ExistingProductBatchFormState, "isOpen" | "error">,
  ): void => {
    setExistingProductBatchForm({
      ...params,
      isOpen: true,
      error: null,
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
    return form.getValues("items").some((item) => item.productId === productId);
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
    const quantity = Number(existingProductBatchForm.quantity);
    if (!quantity || quantity <= 0) {
      updateExistingProductBatchForm({
        error: "Informe uma quantidade válida para o lote.",
      });
      return;
    }

    if (!existingProductBatchForm.manufacturedDate) {
      updateExistingProductBatchForm({ error: "Informe a data de fabricação." });
      return;
    }

    if (!existingProductBatchForm.expirationDate) {
      updateExistingProductBatchForm({ error: "Informe a data de validade." });
      return;
    }

    if (existingProductBatchForm.costPrice === undefined || existingProductBatchForm.costPrice < 0) {
      updateExistingProductBatchForm({ error: "Informe um preço de custo válido." });
      return;
    }

    if (existingProductBatchForm.sellingPrice === undefined || existingProductBatchForm.sellingPrice < 0) {
      updateExistingProductBatchForm({ error: "Informe um preço de venda válido." });
      return;
    }

    const mDate = new Date(existingProductBatchForm.manufacturedDate);
    const eDate = new Date(existingProductBatchForm.expirationDate);

    if (eDate < mDate) {
      updateExistingProductBatchForm({ error: "A data de validade não pode ser anterior à data de fabricação." });
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

  const handleCreateNewProduct = () => {
    setAddItemError(null);

    if (!selectedMovementType) {
      toast.error("Selecione o tipo de movimentação antes de continuar.");
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

    writeStockMovementDraft({
      type: selectedMovementType,
      notes: form.getValues("notes") || "",
      items: form.getValues("items"),
      selectedProductId,
      itemQuantity,
    });
    router.push(`/stock-movements/create/new-product?type=${selectedMovementType}`);
  };

  const navigateToInlineProductWithBarcode = (barcode: string) => {
    if (!selectedMovementType) return;

    writeStockMovementDraft({
      type: selectedMovementType,
      notes: form.getValues("notes") || "",
      items: form.getValues("items"),
      selectedProductId,
      itemQuantity,
      inlineProductBarcode: barcode,
    });
    setIsScannerOpen(false);
    router.push(`/stock-movements/create/new-product?type=${selectedMovementType}`);
  };

  const handleEditNewProductItem = (index: number) => {
    if (!selectedMovementType) return;

    const item = form.getValues("items")[index];
    if (!item?.newProductData) return;

    writeStockMovementDraft({
      type: selectedMovementType,
      notes: form.getValues("notes") || "",
      items: form.getValues("items"),
      selectedProductId,
      itemQuantity,
    });
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
      toast.error(`${product.name} já está na movimentação.`);
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

    try {
      const response = await api
        .get(`products/barcode/${encodeURIComponent(barcode)}`)
        .json<ProductByBarcodeResponse>();
      appendScannedProduct(response.data);
    } catch {
      showMissingProductToast(barcode);
    }
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

    toast.error(`Produto com código ${barcode} não existe.`, {
      action: {
        label: "Criar Produto",
        onClick: () => navigateToInlineProductWithBarcode(barcode),
      },
    });
  };

  const onSubmit = async (data: CreateStockMovementSchema) => {
    if (!selectedMovementType) {
      toast.error("Selecione o tipo de movimentação antes de continuar.");
      router.replace("/stock-movements");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildMovementPayload(selectedMovementType, data);
      const postOptions = hasInlineProductImages(data.items)
        ? { body: buildMovementFormData(payload, data.items) }
        : { json: payload };
      await api.post("stock-movements", postOptions);

      toast.success("Movimentação criada com sucesso!");
      router.push("/stock-movements");
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Erro ao criar movimentação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    onSubmit,
    products,
    isLoadingProducts,
    isSubmitting,
    isFooterVisible,
    selectedProductId,
    productSearchQuery,
    productOptions,
    isProductOptionsOpen,
    isProductSearchLoading:
      isLoadingProducts && debouncedProductSearchQuery.trim().length >= 2,
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
  };
}
