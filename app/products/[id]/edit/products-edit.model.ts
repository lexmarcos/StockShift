// app/products/[id]/edit/products-edit.model.ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  productCreateSchema,
  ProductCreateFormData,
} from "../../create/products-create.schema";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import {
  CategoriesResponse,
  BrandsResponse,
  CustomAttribute,
} from "../../create/products-create.types";

interface Product {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  brandId: string | null;
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
  const nameInputRef = useRef<HTMLInputElement>(null);

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
      categoryId: "",
      brandId: "",
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

  // Populate form when product loads
  useEffect(() => {
    if (productData?.data) {
      const product = productData.data;

      form.reset({
        name: product.name,
        description: product.description || "",
        barcode: product.barcode || "",
        isKit: product.isKit,
        hasExpiration: product.hasExpiration,
        active: product.active,
        continuousMode: false,
        categoryId: product.categoryId || "",
        brandId: product.brandId || "",
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
      }
    }
  }, [productData, form]);

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

  return {
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
    product: productData?.data || null,
    isLoadingProduct,
  };
};
