import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  productCreateSchema,
  ProductCreateFormData,
} from "./products-create.schema";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import {
  CategoriesResponse,
  BrandsResponse,
  CreateProductWithBatchResponse,
  CustomAttribute,
} from "./products-create.types";
import { useBreadcrumb } from "@/components/breadcrumb";

const CONTINUOUS_MODE_KEY = "productCreate:continuousMode";

// Load continuous mode preference from localStorage
const loadContinuousMode = (): boolean => {
  if (typeof window === "undefined") return false;
  const saved = localStorage.getItem(CONTINUOUS_MODE_KEY);
  return saved === "true";
};

export const useProductCreateModel = () => {
  const router = useRouter();
  const { warehouseId } = useSelectedWarehouse();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customAttributes, setCustomAttributes] = useState<CustomAttribute[]>([]);
  const [productImage, setProductImage] = useState<File | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useBreadcrumb({
    title: "Novo Produto",
    backUrl: "/products",
    section: "Inventário",
    subsection: "Criar",
  });

  // Fetch categories for the dropdown
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useSWR<CategoriesResponse>("categories", async () => {
      return await api.get("categories").json<CategoriesResponse>();
    });

  // Fetch brands for the dropdown
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
      continuousMode: loadContinuousMode(),
      categoryId: "",
      brandId: "",
      attributes: {
        weight: "",
        dimensions: "",
      },
      batchCode: "",
      quantity: 0,
      manufacturedDate: "",
      expirationDate: "",
      costPrice: undefined,
      sellingPrice: undefined,
    },
  });

  // Save continuous mode to localStorage when it changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "continuousMode" && typeof window !== "undefined") {
        localStorage.setItem(
          CONTINUOUS_MODE_KEY,
          value.continuousMode ? "true" : "false"
        );
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const addCustomAttribute = () => {
    setCustomAttributes([
      ...customAttributes,
      { id: crypto.randomUUID(), key: "", value: "" }
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
  };

  const validateCustomAttributes = (): boolean => {
    for (let i = 0; i < customAttributes.length; i++) {
      const attr = customAttributes[i];
      if (!attr.key.trim() || !attr.value.trim()) {
        toast.error(`Atributo ${i + 1}: Nome e valor são obrigatórios`);
        return false;
      }
    }

    // Check for duplicate keys
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

    // Add fixed attributes if provided
    if (formData.attributes?.weight) {
      merged.weight = formData.attributes.weight;
    }
    if (formData.attributes?.dimensions) {
      merged.dimensions = formData.attributes.dimensions;
    }

    // Add custom attributes
    customAttributes.forEach((attr) => {
      if (attr.key.trim() && attr.value.trim()) {
        merged[attr.key.trim()] = attr.value.trim();
      }
    });

    return Object.keys(merged).length > 0 ? merged : undefined;
  };

  const resetForm = (preserveCategory: boolean = false) => {
    const currentCategory = form.getValues("categoryId");
    const currentBrand = form.getValues("brandId");
    const currentContinuousMode = form.getValues("continuousMode");

    form.reset({
      name: "",
      description: "",
      barcode: "",
      isKit: false,
      hasExpiration: false,
      active: true,
      categoryId: preserveCategory ? currentCategory : "",
      brandId: preserveCategory ? currentBrand : "",
      continuousMode: currentContinuousMode,
      attributes: {
        weight: "",
        dimensions: "",
      },
      quantity: 0,
      manufacturedDate: "",
      expirationDate: "",
      costPrice: undefined,
      sellingPrice: undefined,
    });

    setCustomAttributes([]);
    setProductImage(null);

    // Focus on name input after reset
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 100);
  };

  const onSubmit = async (data: ProductCreateFormData) => {
    if (!validateCustomAttributes()) {
      return;
    }

    if (!warehouseId) {
      toast.error("Selecione um warehouse para criar o produto");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        description: data.description || undefined,
        barcode: data.barcode || undefined,
        categoryId: data.categoryId || undefined,
        brandId: data.brandId || undefined,
        isKit: data.isKit,
        hasExpiration: data.hasExpiration,
        attributes: mergeAttributes(data),
        warehouseId,
        quantity: data.quantity,
        manufacturedDate: data.manufacturedDate || undefined,
        expirationDate: data.expirationDate || undefined,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
      };

      const formData = new FormData();
      const productBlob = new Blob([JSON.stringify(payload)], {
        type: "application/json",
      });
      formData.append("product", productBlob);

      if (productImage) {
        formData.append("image", productImage);
      }

      const response = await api
        .post("batches/with-product", { body: formData })
        .json<CreateProductWithBatchResponse>();

      if (response.success) {
        const isContinuousMode = data.continuousMode;

        if (isContinuousMode) {
          toast.success(`${data.name} criado! Pronto para o próximo produto.`);
          resetForm(true); // Preserve category
        } else {
          toast.success("Produto e lote criados com sucesso!");
          router.push("/products");
        }
      }
    } catch (error) {
      console.error("Erro ao criar produto:", error);
      toast.error("Erro ao criar produto. Verifique os dados.");
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
    handleImageSelect,
    currentImageUrl: undefined, // Create mode has no existing image
    handleImageRemove: undefined, // Create mode doesn't need remove handler
  };
};
