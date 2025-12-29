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
import {
  CategoriesResponse,
  CreateProductResponse,
  CustomAttribute,
} from "./products-create.types";

const CONTINUOUS_MODE_KEY = "productCreate:continuousMode";

// Load continuous mode preference from localStorage
const loadContinuousMode = (): boolean => {
  if (typeof window === "undefined") return false;
  const saved = localStorage.getItem(CONTINUOUS_MODE_KEY);
  return saved === "true";
};

export const useProductCreateModel = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customAttributes, setCustomAttributes] = useState<CustomAttribute[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Fetch categories for the dropdown
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useSWR<CategoriesResponse>("categories", async () => {
      return await api.get("categories").json<CategoriesResponse>();
    });

  const form = useForm({
    resolver: zodResolver(productCreateSchema),
    defaultValues: {
      name: "",
      description: "",
      isKit: false,
      hasExpiration: false,
      active: true,
      continuousMode: loadContinuousMode(),
      categoryId: "",
      barcode: "",
      attributes: {
        weight: "",
        dimensions: "",
      },
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

  const handleBarcodeScanned = (barcode: string) => {
    form.setValue("barcode", barcode);
    setIsScannerOpen(false);
  };

  const openScanner = () => setIsScannerOpen(true);
  const closeScanner = () => setIsScannerOpen(false);

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
    const currentContinuousMode = form.getValues("continuousMode");

    form.reset({
      name: "",
      description: "",
      isKit: false,
      hasExpiration: false,
      active: true,
      categoryId: preserveCategory ? currentCategory : "",
      barcode: "",
      continuousMode: currentContinuousMode,
      attributes: {
        weight: "",
        dimensions: "",
      },
    });

    setCustomAttributes([]);

    // Focus on name input after reset
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 100);
  };

  const onSubmit = async (data: ProductCreateFormData) => {
    if (!validateCustomAttributes()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        description: data.description || undefined,
        categoryId: data.categoryId || undefined,
        barcode: data.barcode || undefined,
        isKit: data.isKit,
        hasExpiration: data.hasExpiration,
        active: data.active,
        attributes: mergeAttributes(data),
      };

      const response = await api
        .post("products", { json: payload })
        .json<CreateProductResponse>();

      if (response.success) {
        const isContinuousMode = data.continuousMode;

        if (isContinuousMode) {
          toast.success(`${data.name} criado! Pronto para o próximo produto.`);
          resetForm(true); // Preserve category
        } else {
          toast.success("Produto criado com sucesso!");
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
    customAttributes,
    addCustomAttribute,
    removeCustomAttribute,
    updateCustomAttribute,
    nameInputRef,
    isScannerOpen,
    openScanner,
    closeScanner,
    handleBarcodeScanned,
  };
};
