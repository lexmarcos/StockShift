"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useBreadcrumb } from "@/components/breadcrumb";
import { api } from "@/lib/api";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import { CustomAttribute } from "@/components/product/custom-attributes-builder";
import {
  AiFillData,
  BrandsResponse,
  CategoriesResponse,
  ProductCreateFormData,
} from "../../../products/create/products-create.types";
import { applyProductAiFillData } from "../../../products/components/product-ai-fill.model";
import { productInlineSchema } from "../../../products/create/products-create.schema";
import { ProductFormProps, ExistingProductInfo } from "../../../products/components/product-form.types";
import type {
  InlineProductData,
  StockMovementDraftItem,
  ExistingProductBatchFormState,
  StockMovementProductBatchesResponse,
  StockMovementProductOption,
} from "../create-stock-movement.types";
import { isManualMovementType } from "../../stock-movements.constants";
import {
  fileToInlineProductImage,
  inlineProductImageToFile,
  readStockMovementDraft,
  writeStockMovementDraft,
} from "../create-stock-movement.storage";
import type { StockMovementDraft } from "../create-stock-movement.storage";
import {
  buildExistingProductBatchesUrl,
  buildExistingProductProfitSummary,
  buildExistingProductSalePriceSuggestion,
  buildExistingProductCostPriceSuggestion,
  findMostRecentWarehouseProductBatch,
} from "../stock-movement-batch-pricing.model";

const buildReturnHref = (type: string | null): string => {
  if (!isManualMovementType(type)) return "/stock-movements/create";
  return `/stock-movements/create?type=${type}`;
};

interface NewProductInlineModelParams {
  movementType?: string | null;
  editItem?: string | null;
}

const parseEditItemIndex = (value: string | null): number | null => {
  if (!value) return null;
  const index = Number(value);
  return Number.isInteger(index) && index >= 0 ? index : null;
};

const buildCustomAttributes = (
  attributes: Record<string, string> | undefined,
): CustomAttribute[] => {
  if (!attributes) return [];
  return Object.entries(attributes).flatMap(([key, value]) =>
    key === "weight" || key === "dimensions"
      ? []
      : [{ id: `inline-${key}`, key, value }],
  );
};

const resolveInitialProductImage = (
  product: InlineProductData | undefined,
): File | null => {
  return product?.image ? inlineProductImageToFile(product.image) : null;
};

const buildInlineProductData = async (
  data: ProductCreateFormData,
  attributes: Record<string, string> | undefined,
  image: File | null,
): Promise<InlineProductData> => ({
  name: data.name,
  description: data.description || undefined,
  barcode: data.barcode || undefined,
  categoryId: data.categoryId || undefined,
  brandId: data.brandId || undefined,
  isKit: data.isKit,
  hasExpiration: Boolean(data.expirationDate),
  active: data.active,
  attributes,
  manufacturedDate: data.manufacturedDate || undefined,
  expirationDate: data.expirationDate || undefined,
  costPrice: data.costPrice,
  sellingPrice: data.sellingPrice,
  image: image ? await fileToInlineProductImage(image) : undefined,
});

const hasDuplicateInlineProductName = (
  productName: string,
  draft: StockMovementDraft | null,
  ignoredIndex: number | null,
): boolean => {
  const normalizedName = productName.toLowerCase();
  const duplicateInDraft = draft?.items.some((item, index) => {
    if (index === ignoredIndex) return false;
    return item.newProductData?.name.toLowerCase() === normalizedName;
  });
  return Boolean(duplicateInDraft);
};

const buildInlineMovementItem = (
  product: InlineProductData,
  quantity: number,
): StockMovementDraftItem => ({
  quantity,
  productName: product.name,
  newProductData: product,
});

const buildExistingProductBatchItem = (
  productId: string,
  productName: string,
  form: ExistingProductBatchFormState,
): StockMovementDraftItem => ({
  productId,
  productName,
  quantity: Number(form.quantity),
  manufacturedDate: form.manufacturedDate || undefined,
  expirationDate: form.expirationDate || undefined,
  costPrice: form.costPrice,
  sellingPrice: form.sellingPrice,
});

const EMPTY_BATCH_FORM: ExistingProductBatchFormState = {
  isOpen: false,
  productId: "",
  productName: "",
  quantity: "",
  manufacturedDate: "",
  expirationDate: "",
  editingIndex: null,
  error: null,
};

const isInlineProductRouteReady = (
  movementType: string | null,
  initialDraft: StockMovementDraft | null,
  editItemIndex: number | null,
  isEditingInlineProduct: boolean,
): boolean => {
  const hasValidEditItem = editItemIndex === null || isEditingInlineProduct;
  return Boolean(
    isManualMovementType(movementType) && initialDraft && hasValidEditItem,
  );
};

const appendProductToMovementDraft = (
  product: InlineProductData,
  quantity: number,
): Promise<void> => {
  return updateMovementDraft((draft) => ({
    ...draft,
    items: [...draft.items, buildInlineMovementItem(product, quantity)],
    selectedProductId: "",
    itemQuantity: "",
    inlineProductBarcode: undefined,
  }));
};

const appendExistingProductBatchToDraft = (
  item: StockMovementDraftItem,
): Promise<void> => {
  return updateMovementDraft((draft) => ({
    ...draft,
    items: [...draft.items, item],
    selectedProductId: "",
    itemQuantity: "",
    inlineProductBarcode: undefined,
  }));
};

const updateMovementDraft = async (
  buildNextDraft: (draft: StockMovementDraft) => StockMovementDraft,
): Promise<void> => {
  const draft = await readStockMovementDraft();
  if (!draft) return;
  await writeStockMovementDraft(buildNextDraft(draft));
};

const updateProductInMovementDraft = (
  index: number,
  product: InlineProductData,
  quantity: number,
): Promise<void> => {
  return updateMovementDraft((draft) => ({
    ...draft,
    items: draft.items.map((item, itemIndex) => {
      return itemIndex === index
        ? buildInlineMovementItem(product, quantity)
        : item;
    }),
    selectedProductId: "",
    itemQuantity: "",
    inlineProductBarcode: undefined,
  }));
};

export const useNewProductInlineModel = ({
  movementType = null,
  editItem = null,
}: NewProductInlineModelParams = {}): ProductFormProps => {
  const router = useRouter();
  const editItemIndex = parseEditItemIndex(editItem);
  const cancelHref = buildReturnHref(movementType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialDraft, setInitialDraft] = useState<StockMovementDraft | null>(
    null,
  );
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const editedItem =
    editItemIndex !== null ? initialDraft?.items[editItemIndex] : undefined;
  const editedProduct = editedItem?.newProductData;
  const isEditingInlineProduct = Boolean(editedProduct);

  const [customAttributes, setCustomAttributes] = useState<CustomAttribute[]>(
    () => buildCustomAttributes(editedProduct?.attributes),
  );
  const [productImage, setProductImage] = useState<File | null>(() =>
    resolveInitialProductImage(editedProduct),
  );
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [scannedExistingProduct, setScannedExistingProduct] = useState<ExistingProductInfo | null>(null);
  const [existingProductBatchForm, setExistingProductBatchForm] = useState<ExistingProductBatchFormState>(EMPTY_BATCH_FORM);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const { warehouseId } = useSelectedWarehouse();

  useBreadcrumb({
    title: isEditingInlineProduct ? "Editar Produto" : "Novo Produto",
    backUrl: cancelHref,
    section: "Movimentações",
    subsection: isEditingInlineProduct ? "Editar Produto" : "Produto Inline",
  });

  const { data: categoriesData, isLoading: isLoadingCategories } =
    useSWR<CategoriesResponse>("categories", (url: string) =>
      api.get(url).json<CategoriesResponse>(),
    );

  const { data: brandsData, isLoading: isLoadingBrands } =
    useSWR<BrandsResponse>("brands", (url: string) =>
      api.get(url).json<BrandsResponse>(),
    );

  const batchProductId = existingProductBatchForm.isOpen ? existingProductBatchForm.productId : null;
  const productBatchesUrl = buildExistingProductBatchesUrl(warehouseId, batchProductId);
  const { data: productBatchesData, isLoading: isLoadingProductBatches } =
    useSWR<StockMovementProductBatchesResponse>(
      productBatchesUrl,
      (url: string) => api.get(url).json<StockMovementProductBatchesResponse>(),
    );
  const mostRecentBatch = findMostRecentWarehouseProductBatch(productBatchesData?.data ?? []);
  const batchCostPriceSuggestion = buildExistingProductCostPriceSuggestion(mostRecentBatch);
  const batchSalePriceSuggestion = buildExistingProductSalePriceSuggestion(mostRecentBatch);
  const batchProfitSummary = buildExistingProductProfitSummary({
    quantity: existingProductBatchForm.quantity,
    costPrice: existingProductBatchForm.costPrice,
    sellingPrice: existingProductBatchForm.sellingPrice,
  });
  const shouldShowMissingBatchCostPriceSuggestion = Boolean(
    productBatchesUrl && !isLoadingProductBatches && !batchCostPriceSuggestion,
  );
  const shouldShowMissingBatchSalePriceSuggestion = Boolean(
    productBatchesUrl && !isLoadingProductBatches && !batchSalePriceSuggestion,
  );

  const form = useForm<ProductCreateFormData>({
    resolver: zodResolver(productInlineSchema),
    defaultValues: {
      name: editedProduct?.name || "",
      description: editedProduct?.description || "",
      barcode: editedProduct?.barcode || initialDraft?.inlineProductBarcode || "",
      isKit: editedProduct?.isKit || false,
      hasExpiration: editedProduct?.hasExpiration || false,
      active: editedProduct?.active ?? true,
      continuousMode: false,
      categoryId: editedProduct?.categoryId || "",
      brandId: editedProduct?.brandId || "",
      attributes: {
        weight: editedProduct?.attributes?.weight || "",
        dimensions: editedProduct?.attributes?.dimensions || "",
      },
      quantity: editedItem?.quantity || 0,
      manufacturedDate: editedProduct?.manufacturedDate || "",
      expirationDate: editedProduct?.expirationDate || "",
      costPrice: editedProduct?.costPrice,
      sellingPrice: editedProduct?.sellingPrice,
    },
  });

  useEffect(() => {
    let isMounted = true;

    const loadDraft = async (): Promise<void> => {
      const draft = await readStockMovementDraft();
      if (!isMounted) return;
      setInitialDraft(draft);
      setIsDraftLoaded(true);
    };

    void loadDraft();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isDraftLoaded) return;
    if (
      isInlineProductRouteReady(
        movementType,
        initialDraft,
        editItemIndex,
        isEditingInlineProduct,
      )
    ) {
      return;
    }
    router.replace("/stock-movements");
  }, [
    editItemIndex,
    initialDraft,
    isDraftLoaded,
    isEditingInlineProduct,
    movementType,
    router,
  ]);

  useEffect(() => {
    if (!isDraftLoaded || !initialDraft) return;
    if (
      !isInlineProductRouteReady(
        movementType,
        initialDraft,
        editItemIndex,
        isEditingInlineProduct,
      )
    ) {
      return;
    }

    form.reset({
      name: editedProduct?.name || "",
      description: editedProduct?.description || "",
      barcode: editedProduct?.barcode || initialDraft.inlineProductBarcode || "",
      isKit: editedProduct?.isKit || false,
      hasExpiration: editedProduct?.hasExpiration || false,
      active: editedProduct?.active ?? true,
      continuousMode: false,
      categoryId: editedProduct?.categoryId || "",
      brandId: editedProduct?.brandId || "",
      attributes: {
        weight: editedProduct?.attributes?.weight || "",
        dimensions: editedProduct?.attributes?.dimensions || "",
      },
      quantity: editedItem?.quantity || 0,
      manufacturedDate: editedProduct?.manufacturedDate || "",
      expirationDate: editedProduct?.expirationDate || "",
      costPrice: editedProduct?.costPrice,
      sellingPrice: editedProduct?.sellingPrice,
    });
    setCustomAttributes(buildCustomAttributes(editedProduct?.attributes));
    setProductImage(resolveInitialProductImage(editedProduct));
  }, [
    editItemIndex,
    editedItem?.quantity,
    editedProduct,
    form,
    initialDraft,
    isDraftLoaded,
    isEditingInlineProduct,
    movementType,
  ]);

  const addCustomAttribute = (): void => {
    setCustomAttributes((current) => [
      ...current,
      { id: crypto.randomUUID(), key: "", value: "" },
    ]);
  };

  const removeCustomAttribute = (index: number): void => {
    setCustomAttributes((current) => current.filter((_, i) => i !== index));
  };

  const updateCustomAttribute = (
    index: number,
    field: "key" | "value",
    value: string,
  ): void => {
    setCustomAttributes((current) =>
      current.map((attr, i) => (i === index ? { ...attr, [field]: value } : attr)),
    );
  };

  const handleAiFill = (data: AiFillData, file: File, useImage: boolean): void => {
    applyProductAiFillData(form, data);
    if (useImage) setProductImage(file);
    toast.success("Dados preenchidos via IA!");
  };

  const validateCustomAttributes = (): boolean => {
    const invalidIndex = customAttributes.findIndex((attr) => {
      return !attr.key.trim() || !attr.value.trim();
    });
    if (invalidIndex >= 0) {
      toast.error(`Atributo ${invalidIndex + 1}: Nome e valor são obrigatórios`);
      return false;
    }

    const keys = customAttributes.map((attr) => attr.key.trim().toLowerCase());
    const duplicate = keys.find((key, index) => keys.indexOf(key) !== index);
    if (duplicate) {
      toast.error(`Já existe um atributo com o nome "${duplicate}"`);
      return false;
    }

    return true;
  };

  const mergeAttributes = (data: ProductCreateFormData): Record<string, string> | undefined => {
    const merged: Record<string, string> = {};
    if (data.attributes?.weight) merged.weight = data.attributes.weight;
    if (data.attributes?.dimensions) merged.dimensions = data.attributes.dimensions;
    customAttributes.forEach((attr) => {
      if (attr.key.trim() && attr.value.trim()) merged[attr.key.trim()] = attr.value.trim();
    });
    return Object.keys(merged).length > 0 ? merged : undefined;
  };

  const resetInlineFormForNextProduct = (): void => {
    form.reset({
      name: "",
      description: "",
      barcode: "",
      isKit: false,
      hasExpiration: false,
      active: true,
      continuousMode: true,
      categoryId: "",
      brandId: "",
      attributes: { weight: "", dimensions: "" },
      quantity: 0,
      manufacturedDate: "",
      expirationDate: "",
      costPrice: undefined,
      sellingPrice: undefined,
    });
    setCustomAttributes([]);
    setProductImage(null);
    window.scrollTo({ top: 0 });
    window.setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  const handleBarcodeScan = async (barcode: string): Promise<void> => {
    try {
      const response = await api
        .get(`products/barcode/${encodeURIComponent(barcode)}`)
        .json<{ success: boolean; data: StockMovementProductOption }>();
      setScannedExistingProduct({
        id: response.data.id,
        name: response.data.name,
        barcode,
      });
    } catch {
      form.setValue("barcode", barcode);
    }
  };

  const handleExistingProductModalOpenChange = (open: boolean): void => {
    if (!open) {
      setScannedExistingProduct(null);
    }
  };

  const handleCreateBatchForExistingProduct = (): void => {
    if (!scannedExistingProduct) return;
    setExistingProductBatchForm({
      ...EMPTY_BATCH_FORM,
      isOpen: true,
      productId: scannedExistingProduct.id,
      productName: scannedExistingProduct.name,
    });
    setScannedExistingProduct(null);
  };

  const updateBatchForm = (
    patch: Partial<ExistingProductBatchFormState>,
  ): void => {
    setExistingProductBatchForm((current) => ({
      ...current,
      ...patch,
      error: patch.error ?? null,
    }));
  };

  const handleBatchOpenChange = (open: boolean): void => {
    if (!open) {
      setExistingProductBatchForm(EMPTY_BATCH_FORM);
    }
  };

  const handleConfirmBatch = async (): Promise<void> => {
    const quantity = Number(existingProductBatchForm.quantity);
    if (!quantity || quantity <= 0) {
      updateBatchForm({ error: "Informe uma quantidade válida para o lote." });
      return;
    }

    if (existingProductBatchForm.costPrice === undefined || existingProductBatchForm.costPrice < 0) {
      updateBatchForm({ error: "Informe um preço de custo válido." });
      return;
    }

    if (existingProductBatchForm.sellingPrice === undefined || existingProductBatchForm.sellingPrice < 0) {
      updateBatchForm({ error: "Informe um preço de venda válido." });
      return;
    }

    const item = buildExistingProductBatchItem(
      existingProductBatchForm.productId,
      existingProductBatchForm.productName,
      existingProductBatchForm,
    );

    await appendExistingProductBatchToDraft(item);
    toast.success(`${existingProductBatchForm.productName} foi adicionado.`);
    setExistingProductBatchForm(EMPTY_BATCH_FORM);
    resetInlineFormForNextProduct();
  };

  const handleApplyBatchCostPriceSuggestion = (): void => {
    if (!batchCostPriceSuggestion) return;
    updateBatchForm({ costPrice: batchCostPriceSuggestion.priceCents });
  };

  const handleApplyBatchSalePriceSuggestion = (): void => {
    if (!batchSalePriceSuggestion) return;
    updateBatchForm({ sellingPrice: batchSalePriceSuggestion.priceCents });
  };

  const handleBatchQuantityIncrement = (): void => {
    const current = Number(existingProductBatchForm.quantity) || 0;
    updateBatchForm({ quantity: String(current + 1) });
  };

  const handleBatchQuantityDecrement = (): void => {
    const current = Number(existingProductBatchForm.quantity) || 0;
    const next = Math.max(current - 1, 0);
    updateBatchForm({ quantity: next > 0 ? String(next) : "" });
  };

  const updateInlineQuantity = (quantity: number): void => {
    form.setValue("quantity", Math.max(0, quantity), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onQuantityIncrement = (): void => {
    updateInlineQuantity((form.getValues("quantity") || 0) + 1);
  };

  const onQuantityDecrement = (): void => {
    updateInlineQuantity((form.getValues("quantity") || 0) - 1);
  };

  const onSubmit = async (data: ProductCreateFormData): Promise<void> => {
    if (!validateCustomAttributes()) return;

    const currentDraft = await readStockMovementDraft();
    if (!currentDraft) {
      router.replace("/stock-movements");
      return;
    }

    if (
      hasDuplicateInlineProductName(
        data.name,
        currentDraft,
        editItemIndex,
      )
    ) {
      toast.error(`O produto "${data.name}" já foi adicionado nesta movimentação.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const product = await buildInlineProductData(
        data,
        mergeAttributes(data),
        productImage,
      );
      if (isEditingInlineProduct && editItemIndex !== null) {
        await updateProductInMovementDraft(editItemIndex, product, data.quantity);
        toast.success(`${data.name} foi atualizado na movimentação.`);
        router.push(cancelHref);
        return;
      }

      await appendProductToMovementDraft(product, data.quantity);
      if (data.continuousMode) {
        toast.success(
          `${data.name} já está na movimentação. Continue adicionando novos produtos.`,
        );
        resetInlineFormForNextProduct();
        return;
      }

      router.push(cancelHref);
    } catch {
      toast.error("Não foi possível preparar a imagem do produto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    mode: "inline",
    form,
    onSubmit,
    isSubmitting,
    categories: categoriesData?.data || [],
    isLoadingCategories,
    brands: brandsData?.data || [],
    isLoadingBrands,
    customAttributes,
    addCustomAttribute,
    removeCustomAttribute,
    updateCustomAttribute,
    productImage,
    handleImageSelect: setProductImage,
    openScanner: () => setIsScannerOpen(true),
    closeScanner: () => setIsScannerOpen(false),
    isScannerOpen,
    handleBarcodeScan,
    isAiModalOpen,
    openAiModal: () => setIsAiModalOpen(true),
    closeAiModal: () => setIsAiModalOpen(false),
    handleAiFill,
    nameInputRef,
    warehouseId: null,
    cancelHref,
    isInlineEdit: isEditingInlineProduct,
    onQuantityIncrement,
    onQuantityDecrement,
    scannedExistingProduct,
    onExistingProductModalOpenChange: handleExistingProductModalOpenChange,
    onCreateBatchForExistingProduct: handleCreateBatchForExistingProduct,
    batchForm: existingProductBatchForm,
    onBatchOpenChange: handleBatchOpenChange,
    onBatchQuantityChange: (quantity: string) => updateBatchForm({ quantity }),
    onBatchQuantityIncrement: handleBatchQuantityIncrement,
    onBatchQuantityDecrement: handleBatchQuantityDecrement,
    onBatchManufacturedDateChange: (date: string) => updateBatchForm({ manufacturedDate: date }),
    onBatchExpirationDateChange: (date: string) => updateBatchForm({ expirationDate: date }),
    onBatchCostPriceChange: (price?: number) => updateBatchForm({ costPrice: price }),
    onBatchSellingPriceChange: (price?: number) => updateBatchForm({ sellingPrice: price }),
    onApplyBatchCostPriceSuggestion: handleApplyBatchCostPriceSuggestion,
    onApplyBatchSalePriceSuggestion: handleApplyBatchSalePriceSuggestion,
    onConfirmBatch: handleConfirmBatch,
    batchCostPriceSuggestion,
    batchSalePriceSuggestion,
    isBatchPriceSuggestionLoading: isLoadingProductBatches,
    shouldShowMissingBatchCostPriceSuggestion,
    shouldShowMissingBatchSalePriceSuggestion,
    batchProfitSummary,
  };
};
