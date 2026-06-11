import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useSWR from "swr";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { pdvSchema, PdvSchema, METHODS_WITH_INSTALLMENTS, METHODS_WITH_PAYMENT_MODE } from "./pdv.schema";
import { CartItem, BatchOption, ProductWithStock, PdvViewProps, SaleDrawerStep } from "./pdv.types";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  buildInfinitePayCallbackUrl,
  buildInfinitePayDeeplink,
  mapPaymentMethodToInfinitePay,
} from "@/lib/infinitepay";

interface BatchesResponse {
  success: boolean;
  data: Array<{
    id: string;
    batchCode: string;
    quantity: number;
    sellingPrice: number | null;
    expirationDate: string | null;
  }>;
}

interface ProductsResponse {
  success: boolean;
  data: { content: ProductWithStock[] };
}

interface ProductImageResponse {
  success: boolean;
  data: { id: string; imageUrl: string | null };
}

interface InfinitePayConfigResponse {
  success: boolean;
  data: { handle: string | null; docNumber: string | null; configured: boolean };
}

interface SaleCreateResponse {
  success: boolean;
  data: { id: string; code: string; paymentLink: string | null };
}

export function usePdvModel(): PdvViewProps {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batchPopoverOpen, setBatchPopoverOpen] = useState<number | null>(null);
  const [saleDrawerOpen, setSaleDrawerOpen] = useState(false);
  const [saleDrawerStep, setSaleDrawerStep] = useState<SaleDrawerStep>("sale-type");
  const [saleDrawerData, setSaleDrawerData] = useState<{ saleCode: string; total: number; paymentLink: string } | null>(null);
  const [barcodeDrawerOpen, setBarcodeDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  const { warehouseId } = useSelectedWarehouse();

  const form = useForm<PdvSchema>({
    resolver: zodResolver(pdvSchema),
    defaultValues: {
      paymentMethod: "CASH",
      paymentMode: "DIRECT" as const,
      installments: null,
      discountPercentage: null,
    },
  });

  const selectedPayment = form.watch("paymentMethod");
  const cartSubtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);
  const meetsMinimumForPaymentLink = cartSubtotal >= 100;

  useEffect(() => {
    if (selectedPayment && METHODS_WITH_PAYMENT_MODE.includes(selectedPayment)) {
      const currentMode = form.getValues("paymentMode");
      if (currentMode === "DIRECT" && meetsMinimumForPaymentLink) {
        form.setValue("paymentMode", isMobile ? "TAP" : "LINK");
      } else if ((currentMode === "TAP" || currentMode === "LINK") && !meetsMinimumForPaymentLink) {
        form.setValue("paymentMode", "DIRECT");
      }
    } else if (selectedPayment) {
      form.setValue("paymentMode", "DIRECT");
    }
  }, [selectedPayment, meetsMinimumForPaymentLink, isMobile, form]);

  const { data: infinitepayConfig } = useSWR<InfinitePayConfigResponse>(
    isMobile ? "tenants/me/infinitepay" : null,
    async (url: string) => await api.get(url).json<InfinitePayConfigResponse>(),
  );

  const searchUrl = useMemo(() => {
    if (!warehouseId || !searchQuery.trim()) return null;
    return `warehouses/${warehouseId}/products?search=${encodeURIComponent(searchQuery)}&page=0&size=20`;
  }, [warehouseId, searchQuery]);

  const { data: searchData, isLoading: isSearching } = useSWR<ProductsResponse>(
    searchUrl,
    async (url: string) => await api.get(url).json<ProductsResponse>(),
  );
  const rawSearchResults = useMemo(
    () => searchData?.data?.content ?? [],
    [searchData],
  );
  const searchImageIds = useMemo(
    () => getPdvProductsMissingImages(rawSearchResults),
    [rawSearchResults],
  );
  const { data: searchProductImages } = useSWR<Map<string, string | null>>(
    buildPdvImageCacheKey("search", searchImageIds),
    () => fetchPdvProductImages(searchImageIds),
  );
  const searchResults = useMemo(
    () => mergePdvProductImages(rawSearchResults, searchProductImages),
    [rawSearchResults, searchProductImages],
  );

  const favoritesUrl = useMemo(() => {
    if (!warehouseId) return null;
    return `warehouses/${warehouseId}/products?search=&page=0&size=8`;
  }, [warehouseId]);

  const { data: favoritesData } = useSWR<ProductsResponse>(
    favoritesUrl,
    async (url: string) => await api.get(url).json<ProductsResponse>(),
  );
  const rawFavorites = useMemo(
    () => favoritesData?.data?.content ?? [],
    [favoritesData],
  );
  const favoriteImageIds = useMemo(
    () => getPdvProductsMissingImages(rawFavorites),
    [rawFavorites],
  );
  const { data: favoriteProductImages } = useSWR<Map<string, string | null>>(
    buildPdvImageCacheKey("favorites", favoriteImageIds),
    () => fetchPdvProductImages(favoriteImageIds),
  );
  const favorites = useMemo(
    () => mergePdvProductImages(rawFavorites, favoriteProductImages),
    [rawFavorites, favoriteProductImages],
  );

  const fetchBatches = useCallback(
    async (productId: string): Promise<BatchOption[]> => {
      if (!warehouseId) return [];
      try {
        const res = await api
          .get(`batches/warehouses/${warehouseId}/products/${productId}/batches`)
          .json<BatchesResponse>();
        return (res.data || []).flatMap((b) =>
          b.quantity > 0
            ? [
                {
                  batchId: b.id,
                  batchCode: b.batchCode,
                  quantity: b.quantity,
                  sellingPrice: b.sellingPrice,
                  expirationDate: b.expirationDate,
                },
              ]
            : [],
        );
      } catch { return []; }
    },
    [warehouseId],
  );

  const addProductToCart = useCallback(
    async (product: ProductWithStock) => {
      const batches = await fetchBatches(product.id);
      if (batches.length === 0) {
        toast.error("Sem estoque disponível para " + product.name);
        return;
      }
      const batch = batches[0];
      const unitPrice = batch.sellingPrice || 0;
      const quantity = 1;
      const totalPrice = quantity * unitPrice;
      const productImageUrl = await resolvePdvProductImageUrl(product);

      setCart((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.productId === product.id && item.batchId === batch.batchId,
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          const existing = updated[existingIndex];
          const newQty = existing.quantity + quantity;
          updated[existingIndex] = { ...existing, quantity: newQty, totalPrice: newQty * existing.unitPrice };
          return updated;
        }
        return [...prev, {
          id: crypto.randomUUID(),
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          productImageUrl,
          batchId: batch.batchId,
          batchCode: batch.batchCode,
          quantity,
          unitPrice,
          totalPrice,
          availableBatches: batches,
        }];
      });
      setSearchQuery("");
    },
    [fetchBatches],
  );

  const onRemoveItem = useCallback(
    (index: number) => { setCart((prev) => prev.filter((_, i) => i !== index)); },
    [],
  );

  const onUpdateQuantity = useCallback(
    (index: number, quantity: number) => {
      if (quantity <= 0) { onRemoveItem(index); return; }
      setCart((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], quantity, totalPrice: quantity * updated[index].unitPrice };
        return updated;
      });
    },
    [onRemoveItem],
  );

  const onChangeBatch = useCallback(
    (itemIndex: number, batchId: string) => {
      setCart((prev) => {
        const updated = [...prev];
        const item = updated[itemIndex];
        const batch = item.availableBatches.find((b) => b.batchId === batchId);
        if (!batch) return prev;
        const unitPrice = batch.sellingPrice || 0;
        updated[itemIndex] = { ...item, batchId: batch.batchId, batchCode: batch.batchCode, unitPrice, totalPrice: item.quantity * unitPrice };
        return updated;
      });
    },
    [],
  );

  const subtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);
  const discountPercentage = form.watch("discountPercentage") || 0;
  const discountAmount = Math.round((subtotal * discountPercentage) / 100);
  const total = subtotal - discountAmount;

  const resolvePaymentMode = (data: PdvSchema): "DIRECT" | "TAP" | "LINK" => {
    if (!METHODS_WITH_PAYMENT_MODE.includes(data.paymentMethod)) return "DIRECT";
    return data.paymentMode;
  };

  const onSubmit = useCallback(
    async (data: PdvSchema) => {
      if (cart.length === 0 || !warehouseId) {
        toast.warning("Adicione pelo menos um produto ao carrinho");
        return;
      }
      setIsSubmitting(true);

      const paymentMode = resolvePaymentMode(data);

      const salePayload = {
        warehouseId,
        paymentMethod: data.paymentMethod,
        paymentMode,
        installments:
          data.installments && METHODS_WITH_INSTALLMENTS.includes(data.paymentMethod)
            ? data.installments
            : null,
        discountPercentage: data.discountPercentage || null,
        items: cart.map((item) => ({
          productId: item.productId,
          batchId: item.batchId,
          quantity: item.quantity,
        })),
        useInfinitePay: paymentMode === "TAP",
      };

      try {
        const res = await api
          .post("sales", { json: salePayload })
          .json<SaleCreateResponse>();

        if (paymentMode === "TAP") {
          const saleId = res.data.id;
          const config = infinitepayConfig?.data;
          const frontendCallbackUrl = buildInfinitePayCallbackUrl(window.location.origin);

          const deeplink = buildInfinitePayDeeplink({
            amount: total,
            paymentMethod: mapPaymentMethodToInfinitePay(data.paymentMethod),
            installments: data.installments || 1,
            orderId: saleId,
            handle: config?.handle,
            docNumber: config?.docNumber,
            resultUrl: frontendCallbackUrl,
          });

          toast.info("Abrindo InfinitePay para pagamento...");
          window.location.href = deeplink;
          return;
        }

        if (paymentMode === "LINK" && res.data.paymentLink) {
          setSaleDrawerData({
            saleCode: res.data.code,
            total,
            paymentLink: res.data.paymentLink,
          });
          setSaleDrawerStep("link-payment");
          setCart([]);
          form.reset({
            paymentMethod: "CASH",
            paymentMode: "DIRECT" as const,
            installments: null,
            discountPercentage: null,
          });
          return;
        }

        toast.success("Venda realizada com sucesso!");
        setCart([]);
        setSaleDrawerOpen(false);
        form.reset({
          paymentMethod: "CASH",
          paymentMode: "DIRECT" as const,
          installments: null,
          discountPercentage: null,
        });
      } catch (err: unknown) {
        const error = err as { message?: string };
        toast.error(error.message || "Erro ao registrar venda.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [cart, form, infinitepayConfig, total, warehouseId],
  );

  const onBarcodeScanned = useCallback(
    async (barcode: string) => {
      if (!warehouseId) {
        toast.error("Nenhum estoque selecionado");
        return;
      }

      try {
        const res = await api
          .get(`warehouses/${warehouseId}/products?search=${encodeURIComponent(barcode)}&page=0&size=1`)
          .json<ProductsResponse>();

        const products = res.data?.content || [];
        const product = products.find(
          (p) => p.barcode === barcode || p.sku === barcode,
        ) || products[0];

        if (product) {
          await addProductToCart(product);
          toast.success(`${product.name} adicionado`);
        } else {
          toast.error("Produto não encontrado: " + barcode);
        }
      } catch {
        toast.error("Erro ao buscar produto");
      }
    },
    [warehouseId, addProductToCart],
  );

  const onOpenSaleDrawer = useCallback(() => {
    setSaleDrawerStep("sale-type");
    setSaleDrawerOpen(true);
  }, []);

  const onCloseSaleDrawer = useCallback(() => {
    setSaleDrawerOpen(false);
    setSaleDrawerData(null);
  }, []);

  const onCheckPaymentLater = useCallback(() => {
    setCart([]);
    setSaleDrawerOpen(false);
    setSaleDrawerStep("sale-type");
    setSaleDrawerData(null);
    form.reset({
      paymentMethod: "CASH",
      paymentMode: "DIRECT" as const,
      installments: null,
      discountPercentage: null,
    });
    router.push("/sales");
  }, [form, router]);

  const onGoToLinkPayment = useCallback(() => {
    form.setValue("paymentMode", "LINK");
    form.setValue("paymentMethod", "CREDIT_CARD");
    setSaleDrawerStep("link-payment");
    form.handleSubmit(onSubmit)();
  }, [form, onSubmit]);

  const onGoToInPerson = useCallback(() => {
    form.setValue("paymentMode", "DIRECT");
    setSaleDrawerStep("in-person");
  }, [form]);

  return {
    form, cart, searchQuery, onSearchChange: setSearchQuery, searchResults, isSearching,
    onAddProduct: addProductToCart, onRemoveItem, onUpdateQuantity, onChangeBatch,
    subtotal, discountAmount, total, isSubmitting, onSubmit,
    batchPopoverOpen, onBatchPopoverChange: setBatchPopoverOpen,
    isMobile, meetsMinimumForPaymentLink, favorites,
    saleDrawerOpen, saleDrawerStep, saleDrawerData,
    onOpenSaleDrawer, onCloseSaleDrawer, onCheckPaymentLater, onGoToLinkPayment, onGoToInPerson,
    barcodeDrawerOpen, onOpenBarcodeDrawer: () => setBarcodeDrawerOpen(true),
    onCloseBarcodeDrawer: () => setBarcodeDrawerOpen(false),
    onBarcodeScanned,
  };
}

const getPdvProductsMissingImages = (products: ProductWithStock[]): string[] => {
  const productIds = new Set<string>();

  for (const product of products) {
    if (!product.imageUrl) {
      productIds.add(product.id);
    }
  }

  return [...productIds];
};

const buildPdvImageCacheKey = (
  listName: string,
  productIds: string[],
): string | null => {
  if (productIds.length === 0) return null;
  return `pdv-product-images-${listName}-${productIds.join(",")}`;
};

const mergePdvProductImages = (
  products: ProductWithStock[],
  images?: Map<string, string | null>,
): ProductWithStock[] => {
  if (!images) return products;
  return products.map((product) => ({
    ...product,
    imageUrl: product.imageUrl ?? images.get(product.id) ?? null,
  }));
};

const fetchPdvProductImages = async (
  productIds: string[],
): Promise<Map<string, string | null>> => {
  const results = await Promise.all(productIds.map(fetchPdvProductImage));
  return new Map(results.map((result) => [result.id, result.imageUrl]));
};

const resolvePdvProductImageUrl = async (
  product: ProductWithStock,
): Promise<string | null> => {
  if (product.imageUrl) return product.imageUrl;
  const result = await fetchPdvProductImage(product.id);
  return result.imageUrl;
};

const fetchPdvProductImage = async (
  id: string,
): Promise<{ id: string; imageUrl: string | null }> => {
  try {
    const res = await api.get(`products/${id}`).json<ProductImageResponse>();
    return { id, imageUrl: res.data.imageUrl ?? null };
  } catch {
    return { id, imageUrl: null };
  }
};
