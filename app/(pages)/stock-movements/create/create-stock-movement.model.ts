import { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useSWR from "swr";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { api } from "@/lib/api";
import {
  createStockMovementSchema,
  CreateStockMovementSchema,
} from "./create-stock-movement.schema";
import {
  CreateStockMovementViewProps,
  StockMovementProductOption,
} from "./create-stock-movement.types";
import { useBreadcrumb } from "@/components/breadcrumb";
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

const buildMovementItemPayload = (
  item: CreateStockMovementSchema["items"][number],
) => {
  if (!item.newProductData) {
    return { productId: item.productId, quantity: item.quantity };
  }

  const newProduct = {
    name: item.newProductData.name,
    description: item.newProductData.description,
    barcode: item.newProductData.barcode,
    categoryId: item.newProductData.categoryId,
    brandId: item.newProductData.brandId,
    isKit: item.newProductData.isKit,
    hasExpiration: item.newProductData.hasExpiration,
    active: item.newProductData.active,
    attributes: item.newProductData.attributes,
  };
  return {
    quantity: item.quantity,
    newProduct,
    manufacturedDate: item.newProductData.manufacturedDate,
    expirationDate: item.newProductData.expirationDate,
    costPrice: item.newProductData.costPrice,
    sellingPrice: item.newProductData.sellingPrice,
  };
};

const hasInlineProductImages = (
  items: CreateStockMovementSchema["items"],
): boolean => {
  return items.some((item) => Boolean(item.newProductData?.image));
};

const buildMovementPayload = (
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

const PRODUCT_SEARCH_LIMIT = 5;

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

export function useCreateStockMovementModel(): CreateStockMovementViewProps {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const lastScannedBarcodeRef = useRef<string | null>(null);
  const productSearchBlurTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);
  const typeParam = searchParams.get("type");
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

  const { fields, append, remove } = useFieldArray({
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
    setSelectedProductId(draft.selectedProductId);
    setItemQuantity(draft.itemQuantity);

    setSelectedProductId("");
    setItemQuantity("");

    clearStockMovementDraft();
  }, [append, form]);

  const { data: productsData, isLoading: isLoadingProducts } =
    useSWR<ProductListResponse>("products", (url: string) =>
      api.get(url).json<ProductListResponse>(),
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

  const handleAddItem = () => {
    setAddItemError(null);

    if (!selectedProductId) {
      setAddItemError("Selecione um produto.");
      return;
    }

    const qty = Number(itemQuantity);
    if (!qty || qty <= 0) {
      setAddItemError("Informe uma quantidade válida.");
      return;
    }

    const alreadyAdded = fields.find((f) => f.productId === selectedProductId);
    if (alreadyAdded) {
      setAddItemError(
        "Este produto já foi adicionado. Remova-o para alterar a quantidade.",
      );
      return;
    }

    const product =
      selectedProduct || products.find((p) => p.id === selectedProductId);

    append({
      productId: selectedProductId,
      quantity: qty,
      productName: product?.name || "Produto",
    });

    setSelectedProductId("");
    setSelectedProduct(null);
    setProductSearchQuery("");
    setItemQuantity("");
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

  const resolveScannerQuantity = () => {
    const qty = Number(itemQuantity);
    return qty > 0 ? qty : 1;
  };

  const appendScannedProduct = (product: StockMovementProductOption) => {
    const alreadyAdded = form.getValues("items").some((item) => {
      return item.productId === product.id;
    });
    if (alreadyAdded) {
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
    onScannerOpenChange: setIsScannerOpen,
    onBarcodeScan: handleBarcodeScan,
    onRemoveItem: remove,
    items: fields,
  };
}
