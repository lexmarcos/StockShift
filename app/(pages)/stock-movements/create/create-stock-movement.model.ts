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
  inlineProductImageToFile,
  isStockMovementDraftRecoveredFromPreviousRuntime,
  readStockMovementDraft,
  writeStockMovementDraft,
} from "./create-stock-movement.storage";
import type { WritableStockMovementDraft } from "./create-stock-movement.storage";
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

const isExistingProductBatchDateRangeInvalid = (
  manufacturedDate: string,
  expirationDate: string,
): boolean => {
  const optionalManufacturedDate = getOptionalText(manufacturedDate);
  const optionalExpirationDate = getOptionalText(expirationDate);
  if (!optionalManufacturedDate || !optionalExpirationDate) return false;
  return new Date(optionalExpirationDate) < new Date(optionalManufacturedDate);
};

const buildExistingProductItemPayload = (
  item: CreateStockMovementSchema["items"][number],
): ExistingProductMovementPayload => {
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

interface ExistingProductMovementPayload {
  productId: string | undefined;
  quantity: number;
  manufacturedDate?: string;
  expirationDate?: string;
  costPrice?: number;
  sellingPrice?: number;
}

interface NewProductMovementPayload {
  quantity: number;
  newProduct: {
    name: string;
    description?: string;
    barcode?: string;
    categoryId?: string;
    brandId?: string;
    isKit?: boolean;
    hasExpiration: boolean;
    active?: boolean;
    attributes?: Record<string, string>;
  };
  manufacturedDate?: string;
  expirationDate?: string;
  costPrice?: number;
  sellingPrice?: number;
  imageUploadId?: string;
}

type MovementItemPayload =
  | ExistingProductMovementPayload
  | NewProductMovementPayload;

interface StockMovementPayload {
  type: NonNullable<CreateStockMovementSchema["type"]>;
  notes?: string;
  items: MovementItemPayload[];
}

const buildMovementItemPayload = (
  item: CreateStockMovementSchema["items"][number],
): MovementItemPayload => {
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

export const buildMovementPayload = (
  selectedMovementType: NonNullable<CreateStockMovementSchema["type"]>,
  data: CreateStockMovementSchema,
): StockMovementPayload => ({
  type: selectedMovementType,
  notes: data.notes || undefined,
  items: data.items.map(buildMovementItemPayload),
});

interface TemporaryProductImageUploadResponse {
  success: boolean;
  data: {
    uploadId: string;
    fileName: string;
    contentType: string;
    sizeBytes: number;
  };
}

const uploadTemporaryInlineProductImage = async (
  image: NonNullable<
    NonNullable<CreateStockMovementSchema["items"][number]["newProductData"]>["image"]
  >,
): Promise<string> => {
  const formData = new FormData();
  formData.append("image", inlineProductImageToFile(image));
  const response = await api
    .post("uploads/product-images/temp", { body: formData })
    .json<TemporaryProductImageUploadResponse>();
  return response.data.uploadId;
};

const uploadInlineProductImages = async (
  payload: StockMovementPayload,
  items: CreateStockMovementSchema["items"],
): Promise<StockMovementPayload> => {
  const movementItems = [...payload.items];
  for (const [index, formItem] of items.entries()) {
    if (!formItem.newProductData?.image) continue;
    const itemPayload = movementItems[index];
    if (!("newProduct" in itemPayload)) continue;
    movementItems[index] = {
      ...itemPayload,
      imageUploadId: await uploadTemporaryInlineProductImage(
        formItem.newProductData.image,
      ),
    };
  }
  return { ...payload, items: movementItems };
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
  const inlineProductBarcodeRef = useRef<string | undefined>(undefined);
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

  const [isDraftHydrated, setIsDraftHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const hydrateDraft = async (): Promise<void> => {
      if (!selectedMovementType) {
        setIsDraftHydrated(true);
        return;
      }

      const draft = await readStockMovementDraft();
      if (!isMounted) return;

      if (draft?.type === selectedMovementType) {
        form.reset({
          type: draft.type,
          notes: draft.notes,
          items: draft.items,
        });
        setSelectedProductId(draft.selectedProductId);
        setItemQuantity(draft.itemQuantity);
        inlineProductBarcodeRef.current = draft.inlineProductBarcode;
        if (isStockMovementDraftRecoveredFromPreviousRuntime(draft)) {
          toast.success("Rascunho da movimentação restaurado.");
        }
      }

      setIsDraftHydrated(true);
    };

    void hydrateDraft();
    return () => {
      isMounted = false;
    };
  }, [form, selectedMovementType]);

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
    if (!selectedProductId || productSearchQuery || products.length === 0) return;
    const restoredProduct = products.find((product) => {
      return product.id === selectedProductId;
    });
    if (!restoredProduct) return;
    setSelectedProduct(restoredProduct);
    setProductSearchQuery(formatStockMovementProductLabel(restoredProduct));
  }, [productSearchQuery, products, selectedProductId]);

  const buildCurrentDraft = useCallback(
    (inlineProductBarcode = inlineProductBarcodeRef.current): WritableStockMovementDraft | null => {
      if (!selectedMovementType) return null;
      return {
        type: selectedMovementType,
        notes: form.getValues("notes") || "",
        items: form.getValues("items"),
        selectedProductId,
        itemQuantity,
        inlineProductBarcode,
      };
    },
    [form, itemQuantity, selectedMovementType, selectedProductId],
  );

  const persistCurrentDraft = useCallback(
    async (inlineProductBarcode = inlineProductBarcodeRef.current): Promise<void> => {
      const draft = buildCurrentDraft(inlineProductBarcode);
      if (!draft) return;
      await writeStockMovementDraft(draft);
    },
    [buildCurrentDraft],
  );

  useEffect(() => {
    if (!isDraftHydrated || !selectedMovementType) return;
    void persistCurrentDraft();
  }, [
    isDraftHydrated,
    itemQuantity,
    persistCurrentDraft,
    selectedMovementType,
    selectedProductId,
  ]);

  useEffect(() => {
    if (!isDraftHydrated || !selectedMovementType) return;

    const subscription = form.watch((_value, { name }) => {
      if (!name || (name !== "notes" && !name.startsWith("items"))) return;
      void persistCurrentDraft();
    });

    return () => subscription.unsubscribe();
  }, [form, isDraftHydrated, persistCurrentDraft, selectedMovementType]);

  useEffect(() => {
    if (!isDraftHydrated || !selectedMovementType) return;

    const persistBeforePageHide = (): void => {
      void persistCurrentDraft();
    };
    const persistBeforeVisibilityLoss = (): void => {
      if (document.visibilityState !== "hidden") return;
      void persistCurrentDraft();
    };

    window.addEventListener("pagehide", persistBeforePageHide);
    document.addEventListener("visibilitychange", persistBeforeVisibilityLoss);
    return () => {
      window.removeEventListener("pagehide", persistBeforePageHide);
      document.removeEventListener(
        "visibilitychange",
        persistBeforeVisibilityLoss,
      );
    };
  }, [isDraftHydrated, persistCurrentDraft, selectedMovementType]);

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

    if (existingProductBatchForm.costPrice === undefined || existingProductBatchForm.costPrice < 0) {
      updateExistingProductBatchForm({ error: "Informe um preço de custo válido." });
      return;
    }

    if (existingProductBatchForm.sellingPrice === undefined || existingProductBatchForm.sellingPrice < 0) {
      updateExistingProductBatchForm({ error: "Informe um preço de venda válido." });
      return;
    }

    if (
      isExistingProductBatchDateRangeInvalid(
        existingProductBatchForm.manufacturedDate,
        existingProductBatchForm.expirationDate,
      )
    ) {
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

  const handleCreateNewProduct = async (): Promise<void> => {
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
      toast.error("Selecione o tipo de movimentação antes de continuar.");
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
    missingProductBarcode,
    onMissingProductModalOpenChange: handleMissingProductModalOpenChange,
    onCreateProductFromMissingModal: handleCreateProductFromMissingModal,
  };
}
