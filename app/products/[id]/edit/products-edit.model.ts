// app/products/[id]/edit/products-edit.model.ts
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  productCreateSchema,
  ProductCreateFormData,
} from "../../create/products-create.schema";
import {
  batchEditFormSchema,
  BatchEditFormValues,
} from "./products-edit.schema";
import { BatchesResponse } from "./products-edit.types";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import {
  CategoriesResponse,
  BrandsResponse,
  CustomAttribute,
} from "../../create/products-create.types";

interface ProductBrand {
  id: string;
  name: string;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProductCategory {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName?: string | null;
  category?: ProductCategory | null;
  brandId: string | null;
  brand?: ProductBrand | null;
  barcode: string | null;
  barcodeType: string | null;
  sku: string | null;
  isKit: boolean;
  attributes: Record<string, string> | null;
  hasExpiration: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductResponse {
  success: boolean;
  message: string | null;
  data: Product;
}

export const useProductEditModel = (productId: string) => {
  const router = useRouter();
  const { warehouseId } = useSelectedWarehouse();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customAttributes, setCustomAttributes] = useState<CustomAttribute[]>([]);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const [isBatchesDrawerOpen, setBatchesDrawerOpen] = useState(false);
  const [batchesDrawerDirection, setBatchesDrawerDirection] = useState<
    "right" | "bottom"
  >("bottom");
  const [updatingBatchId, setUpdatingBatchId] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const loadedProductIdRef = useRef<string | null>(null);
  const [isFormReady, setIsFormReady] = useState(false);

  // Fetch product data
  const { data: productData, isLoading: isLoadingProduct } = useSWR<ProductResponse>(
    productId ? `products/${productId}` : null,
    async (url: string) => {
      return await api.get(url).json<ProductResponse>();
    }
  );

  // Fetch categories
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useSWR<CategoriesResponse>("categories", async () => {
      return await api.get("categories").json<CategoriesResponse>();
    });

  // Fetch brands
  const { data: brandsData, isLoading: isLoadingBrands } =
    useSWR<BrandsResponse>("brands", async () => {
      return await api.get("brands").json<BrandsResponse>();
    });

  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(productCreateSchema),
    defaultValues: {
      name: "",
      description: "",
      barcode: "",
      isKit: false,
      hasExpiration: false,
      active: true,
      continuousMode: false,
      categoryId: undefined,
      brandId: undefined,
      attributes: {
        weight: "",
        dimensions: "",
      },
      quantity: 0,
      manufacturedDate: "",
      expirationDate: "",
      costPrice: undefined,
      sellingPrice: undefined,
    },
  });

  const batchForm = useForm<BatchEditFormValues>({
    resolver: zodResolver(batchEditFormSchema),
    defaultValues: {
      batches: [],
    },
  });

  const {
    fields: batchFields,
    replace: replaceBatchFields,
  } = useFieldArray({
    control: batchForm.control,
    name: "batches",
    keyName: "fieldId",
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const updateDirection = () => {
      setBatchesDrawerDirection(mediaQuery.matches ? "right" : "bottom");
    };

    updateDirection();
    mediaQuery.addEventListener("change", updateDirection);
    return () => mediaQuery.removeEventListener("change", updateDirection);
  }, []);

  // Populate form when product loads
  useEffect(() => {
    if (!productData?.data) {
      return;
    }

    const product = productData.data;
    if (loadedProductIdRef.current === product.id) {
      return;
    }

    form.reset({
      name: product.name,
      description: product.description || "",
      barcode: product.barcode || "",
      isKit: product.isKit,
      hasExpiration: product.hasExpiration,
      active: product.active,
      continuousMode: false,
      categoryId: product.category?.id || product.categoryId || "",
      brandId: product.brand?.id || product.brandId || "",
      attributes: {
        weight: product.attributes?.weight || "",
        dimensions: product.attributes?.dimensions || "",
      },
      quantity: 0,
      manufacturedDate: "",
      expirationDate: "",
      costPrice: undefined,
      sellingPrice: undefined,
    });

    loadedProductIdRef.current = product.id;
    setIsFormReady(true);

    // Extract custom attributes (excluding weight and dimensions)
    if (product.attributes) {
      const attrs = Object.entries(product.attributes)
        .filter(([key]) => key !== "weight" && key !== "dimensions")
        .map(([key, value]) => ({
          id: crypto.randomUUID(),
          key,
          value,
        }));
      setCustomAttributes(attrs);
    } else {
      setCustomAttributes([]);
    }
  }, [productData, form]);

  const shouldLoadBatches = Boolean(productId && isBatchesDrawerOpen);

  const { data: batchesData, isLoading: isLoadingBatches } =
    useSWR<BatchesResponse>(
      shouldLoadBatches ? `batches/product/${productId}` : null,
      async (url: string) => {
        return await api.get(url).json<BatchesResponse>();
      }
    );

  useEffect(() => {
    if (!batchesData?.data) {
      return;
    }

    const mappedBatches = batchesData.data.map((batch) => ({
      id: batch.id,
      productId: batch.productId,
      warehouseId: batch.warehouseId,
      warehouseName: batch.warehouseName,
      warehouseCode: batch.warehouseCode || undefined,
      batchNumber: batch.batchNumber,
      quantity: batch.quantity ?? 0,
      expirationDate: batch.expirationDate || "",
      costPrice: batch.costPrice ?? undefined,
      notes: batch.notes || "",
    }));

    replaceBatchFields(mappedBatches);
  }, [batchesData, replaceBatchFields]);

  const product = productData?.data || null;

  const selectedCategory = useMemo(() => {
    if (!product) return null;
    if (product.category?.id && product.category.name) {
      return { id: product.category.id, name: product.category.name };
    }
    if (product.categoryId) {
      return {
        id: product.categoryId,
        name: product.categoryName || "Categoria atual",
      };
    }
    return null;
  }, [product]);

  const selectedBrand = useMemo(() => {
    if (!product) return null;
    if (product.brand?.id && product.brand.name) {
      return {
        id: product.brand.id,
        name: product.brand.name,
        logoUrl: product.brand.logoUrl || undefined,
      };
    }
    if (product.brandId) {
      return { id: product.brandId, name: "Marca atual" };
    }
    return null;
  }, [product]);


  const categories = useMemo(() => {
    const list = categoriesData?.data || [];
    if (!selectedCategory) return list;
    if (list.some((category) => category.id === selectedCategory.id)) {
      return list;
    }
    return [selectedCategory, ...list];
  }, [categoriesData, selectedCategory]);

  const brands = useMemo(() => {
    const list = brandsData?.data || [];
    if (!selectedBrand) return list;
    if (list.some((brand) => brand.id === selectedBrand.id)) {
      return list;
    }
    return [selectedBrand, ...list];
  }, [brandsData, selectedBrand]);

  const addCustomAttribute = () => {
    setCustomAttributes([
      ...customAttributes,
      { id: crypto.randomUUID(), key: "", value: "" },
    ]);
  };

  const removeCustomAttribute = (index: number) => {
    setCustomAttributes(customAttributes.filter((_, i) => i !== index));
  };

  const updateCustomAttribute = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const updated = [...customAttributes];
    updated[index][field] = value;
    setCustomAttributes(updated);
  };

  const openScanner = () => {
    setIsScannerOpen(true);
  };

  const closeScanner = () => {
    setIsScannerOpen(false);
  };

  const handleBarcodeScan = (barcode: string) => {
    form.setValue("barcode", barcode);
    toast.success(`Código ${barcode} detectado!`);
  };

  const handleImageSelect = (file: File | null) => {
    setProductImage(file);
    if (file) {
      setRemoveCurrentImage(false);
    }
  };

  const handleImageRemove = () => {
    setProductImage(null);
    setRemoveCurrentImage(true);
  };

  const validateCustomAttributes = (): boolean => {
    for (let i = 0; i < customAttributes.length; i++) {
      const attr = customAttributes[i];
      if (!attr.key.trim() || !attr.value.trim()) {
        toast.error(`Atributo ${i + 1}: Nome e valor são obrigatórios`);
        return false;
      }
    }

    const keys = customAttributes.map((a) => a.key.trim().toLowerCase());
    const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
    if (duplicates.length > 0) {
      toast.error(`Já existe um atributo com o nome "${duplicates[0]}"`);
      return false;
    }

    return true;
  };

  const mergeAttributes = (formData: ProductCreateFormData) => {
    const merged: Record<string, string> = {};

    if (formData.attributes?.weight) {
      merged.weight = formData.attributes.weight;
    }
    if (formData.attributes?.dimensions) {
      merged.dimensions = formData.attributes.dimensions;
    }

    customAttributes.forEach((attr) => {
      if (attr.key.trim() && attr.value.trim()) {
        merged[attr.key.trim()] = attr.value.trim();
      }
    });

    return Object.keys(merged).length > 0 ? merged : undefined;
  };

  const onSubmit = async (data: ProductCreateFormData) => {
    if (!validateCustomAttributes()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const productPayload = {
        name: data.name,
        description: data.description || undefined,
        barcode: data.barcode || undefined,
        categoryId: data.categoryId || undefined,
        brandId: data.brandId || undefined,
        isKit: data.isKit,
        hasExpiration: data.hasExpiration,
        attributes: mergeAttributes(data),
        active: data.active,
      };

      const formData = new FormData();

      const productBlob = new Blob([JSON.stringify(productPayload)], {
        type: "application/json",
      });
      formData.append("product", productBlob);

      // Handle image
      if (!removeCurrentImage && productImage) {
        formData.append("image", productImage);
      }

      await api.put(`products/${productId}`, { body: formData });

      // Invalidate caches
      mutate("products");
      mutate(`products/${productId}`);

      toast.success("Produto atualizado com sucesso!");
      router.push("/products");
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      toast.error("Erro ao atualizar produto. Verifique os dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSaveBatch = async (index: number) => {
    const fieldNames = [
      `batches.${index}.batchNumber`,
      `batches.${index}.quantity`,
      `batches.${index}.expirationDate`,
      `batches.${index}.costPrice`,
      `batches.${index}.notes`,
    ] as const;

    const isValid = await batchForm.trigger(fieldNames);
    if (!isValid) {
      return;
    }

    const batch = batchForm.getValues(`batches.${index}`);
    if (!batch) {
      return;
    }

    setUpdatingBatchId(batch.id);
    try {
      const payload = {
        productId: batch.productId,
        warehouseId: batch.warehouseId,
        quantity: batch.quantity ?? 0,
        batchCode: batch.batchNumber?.trim() || undefined,
        expirationDate: batch.expirationDate || undefined,
        costPrice: batch.costPrice ?? undefined,
        notes: batch.notes?.trim() || undefined,
      };

      await api.put(`batches/${batch.id}`, { json: payload }).json();

      mutate(`batches/product/${productId}`);
      toast.success("Batch atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar batch:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Erro ao atualizar batch");
      } else {
        toast.error("Erro ao atualizar batch");
      }
    } finally {
      setUpdatingBatchId(null);
    }
  };

  return {
    form,
    onSubmit,
    isSubmitting,
    categories,
    isLoadingCategories,
    brands,
    isLoadingBrands,
    customAttributes,
    addCustomAttribute,
    removeCustomAttribute,
    updateCustomAttribute,
    nameInputRef,
    openScanner,
    closeScanner,
    isScannerOpen,
    handleBarcodeScan,
    warehouseId,
    productImage,
    currentImageUrl: productData?.data?.imageUrl || undefined,
    handleImageSelect,
    handleImageRemove,
    product,
    isLoadingProduct,
    isFormReady,
    batchesDrawer: {
      isOpen: isBatchesDrawerOpen,
      onOpenChange: setBatchesDrawerOpen,
      direction: batchesDrawerDirection,
      isLoading: isLoadingBatches,
      fields: batchFields,
      onSave: onSaveBatch,
      updatingBatchId,
      form: batchForm,
    },
  };
};
