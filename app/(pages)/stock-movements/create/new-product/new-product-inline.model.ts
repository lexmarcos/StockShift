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
import type { InlineProductData } from "../create-stock-movement.types";
import { isManualMovementType } from "../../stock-movements.constants";
import {
  appendInlineProductItem,
  clearInlineProductItems,
  fileToInlineProductImage,
  readStockMovementDraft,
  readInlineProductItems,
} from "../create-stock-movement.storage";

const buildReturnHref = (type: string | null): string => {
  if (!isManualMovementType(type)) return "/stock-movements/create";
  return `/stock-movements/create?type=${type}`;
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
): boolean => {
  const normalizedName = productName.toLowerCase();
  const duplicateInDraft = draft?.items.some((item) => {
    return item.newProductData?.name.toLowerCase() === normalizedName;
  });
  const duplicateInPending = readInlineProductItems().some((item) => {
    return item.product.name.toLowerCase() === normalizedName;
  });
  return Boolean(duplicateInDraft || duplicateInPending);
};

export const useNewProductInlineModel = (): ProductFormProps => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const movementType = searchParams.get("type");
  const cancelHref = buildReturnHref(movementType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customAttributes, setCustomAttributes] = useState<CustomAttribute[]>(
    [],
  );
  const [productImage, setProductImage] = useState<File | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const initialDraftRef = useRef(readStockMovementDraft());
  const initialDraft = initialDraftRef.current;

  useBreadcrumb({
    title: "Novo Produto",
    backUrl: cancelHref,
    section: "Movimentações",
    subsection: "Produto Inline",
  });

  useEffect(() => {
    if (isManualMovementType(movementType) && initialDraft) return;
    toast.error("Volte para a movimentação antes de criar o produto.");
    router.replace("/stock-movements");
  }, [initialDraft, movementType, router]);

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
      name: "",
      description: "",
      barcode: initialDraft?.inlineProductBarcode || "",
      isKit: false,
      hasExpiration: false,
      active: true,
      continuousMode: false,
      categoryId: "",
      brandId: "",
      attributes: { weight: "", dimensions: "" },
      quantity: 0,
      manufacturedDate: "",
      expirationDate: "",
      costPrice: undefined,
      sellingPrice: undefined,
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
    window.setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  const onSubmit = async (data: ProductCreateFormData): Promise<void> => {
    if (!validateCustomAttributes()) return;

    if (hasDuplicateInlineProductName(data.name, readStockMovementDraft())) {
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
      appendInlineProductItem({
        product,
        quantity: data.quantity,
      });
      if (data.continuousMode) {
        toast.success(`${data.name} adicionado ao lote.`);
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
    onCancel: clearInlineProductItems,
  };
};
