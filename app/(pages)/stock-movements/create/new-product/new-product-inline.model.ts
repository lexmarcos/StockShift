"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useSWR from "swr";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { useBreadcrumb } from "@/components/breadcrumb";
import { api } from "@/lib/api";
import { CustomAttribute } from "@/components/product/custom-attributes-builder";
import {
  BrandsResponse,
  CategoriesResponse,
  ProductCreateFormData,
} from "../../../products/create/products-create.types";
import { productInlineSchema } from "../../../products/create/products-create.schema";
import { ProductFormProps } from "../../../products/components/product-form.types";
import type {
  InlineProductData,
  StockMovementDraftItem,
} from "../create-stock-movement.types";
import { isManualMovementType } from "../../stock-movements.constants";
import {
  fileToInlineProductImage,
  inlineProductImageToFile,
  readStockMovementDraft,
  writeStockMovementDraft,
} from "../create-stock-movement.storage";

const buildReturnHref = (type: string | null): string => {
  if (!isManualMovementType(type)) return "/stock-movements/create";
  return `/stock-movements/create?type=${type}`;
};

const parseEditItemIndex = (value: string | null): number | null => {
  if (!value) return null;
  const index = Number(value);
  return Number.isInteger(index) && index >= 0 ? index : null;
};

const buildCustomAttributes = (
  attributes: Record<string, string> | undefined,
): CustomAttribute[] => {
  if (!attributes) return [];
  return Object.entries(attributes)
    .filter(([key]) => key !== "weight" && key !== "dimensions")
    .map(([key, value]) => ({ id: `inline-${key}`, key, value }));
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
  hasExpiration: data.hasExpiration,
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
  draft: ReturnType<typeof readStockMovementDraft>,
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

const appendProductToMovementDraft = (
  product: InlineProductData,
  quantity: number,
): void => {
  const draft = readStockMovementDraft();
  if (!draft) return;
  writeStockMovementDraft({
    ...draft,
    items: [...draft.items, buildInlineMovementItem(product, quantity)],
    selectedProductId: "",
    itemQuantity: "",
    inlineProductBarcode: undefined,
  });
};

const updateProductInMovementDraft = (
  index: number,
  product: InlineProductData,
  quantity: number,
): void => {
  const draft = readStockMovementDraft();
  if (!draft) return;
  writeStockMovementDraft({
    ...draft,
    items: draft.items.map((item, itemIndex) => {
      return itemIndex === index
        ? buildInlineMovementItem(product, quantity)
        : item;
    }),
    selectedProductId: "",
    itemQuantity: "",
    inlineProductBarcode: undefined,
  });
};

export const useNewProductInlineModel = (): ProductFormProps => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const movementType = searchParams.get("type");
  const editItemIndex = parseEditItemIndex(searchParams.get("editItem"));
  const cancelHref = buildReturnHref(movementType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialDraftRef = useRef(readStockMovementDraft());
  const initialDraft = initialDraftRef.current;
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
  const nameInputRef = useRef<HTMLInputElement>(null);

  useBreadcrumb({
    title: isEditingInlineProduct ? "Editar Produto" : "Novo Produto",
    backUrl: cancelHref,
    section: "Movimentações",
    subsection: isEditingInlineProduct ? "Editar Produto" : "Produto Inline",
  });

  useEffect(() => {
    const hasValidEditItem = editItemIndex === null || isEditingInlineProduct;
    if (isManualMovementType(movementType) && initialDraft && hasValidEditItem) {
      return;
    }
    toast.error("Volte para a movimentação antes de criar o produto.");
    router.replace("/stock-movements");
  }, [
    editItemIndex,
    initialDraft,
    isEditingInlineProduct,
    movementType,
    router,
  ]);

  const { data: categoriesData, isLoading: isLoadingCategories } =
    useSWR<CategoriesResponse>("categories", (url: string) =>
      api.get(url).json<CategoriesResponse>(),
    );

  const { data: brandsData, isLoading: isLoadingBrands } =
    useSWR<BrandsResponse>("brands", (url: string) =>
      api.get(url).json<BrandsResponse>(),
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

  const onSubmit = async (data: ProductCreateFormData): Promise<void> => {
    if (!validateCustomAttributes()) return;

    if (
      hasDuplicateInlineProductName(
        data.name,
        readStockMovementDraft(),
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
        updateProductInMovementDraft(editItemIndex, product, data.quantity);
        toast.success(`${data.name} foi atualizado na movimentação.`);
        router.push(cancelHref);
        return;
      }

      appendProductToMovementDraft(product, data.quantity);
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
    handleBarcodeScan: (barcode: string) => form.setValue("barcode", barcode),
    nameInputRef,
    warehouseId: null,
    cancelHref,
    isInlineEdit: isEditingInlineProduct,
  };
};
