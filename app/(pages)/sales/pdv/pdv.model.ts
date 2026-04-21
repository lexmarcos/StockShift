import { useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useSWR from "swr";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { pdvSchema, PdvSchema, METHODS_WITH_INSTALLMENTS } from "./pdv.schema";
import { CartItem, BatchOption, ProductWithStock, PdvViewProps } from "./pdv.types";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  buildInfinitePayDeeplink,
  INFINITEPAY_PAYMENT_METHODS,
  mapPaymentMethodToInfinitePay,
} from "@/lib/infinitepay";

interface WarehouseResponse {
  success: boolean;
  data: Array<{ id: string; name: string }>;
}

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

interface InfinitePayConfigResponse {
  success: boolean;
  data: { handle: string | null; docNumber: string | null; configured: boolean };
}

export function usePdvModel(): PdvViewProps {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batchPopoverOpen, setBatchPopoverOpen] = useState<number | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareDialogData, setShareDialogData] = useState<{ saleCode: string; total: number; paymentLink: string } | null>(null);
  const isMobile = useIsMobile();
  const { warehouseId: globalWarehouseId } = useSelectedWarehouse();

  const form = useForm<PdvSchema>({
    resolver: zodResolver(pdvSchema),
    defaultValues: {
      warehouseId: globalWarehouseId || "",
      paymentMethod: "CASH",
      paymentMode: "DIRECT" as const,
      installments: null,
      discountPercentage: null,
    },
  });

  const selectedWarehouseId = form.watch("warehouseId");

  const { data: warehousesData, isLoading: isLoadingWarehouses } = useSWR<WarehouseResponse>(
    "warehouses",
    async (url: string) => await api.get(url).json<WarehouseResponse>(),
  );
  const warehouses = warehousesData?.data || [];

  const { data: infinitepayConfig } = useSWR<InfinitePayConfigResponse>(
    isMobile ? "tenants/me/infinitepay" : null,
    async (url: string) => await api.get(url).json<InfinitePayConfigResponse>(),
  );

  const searchUrl = useMemo(() => {
    if (!selectedWarehouseId || !searchQuery.trim()) return null;
    return `warehouses/${selectedWarehouseId}/products?search=${encodeURIComponent(searchQuery)}&page=0&size=20`;
  }, [selectedWarehouseId, searchQuery]);

  const { data: searchData, isLoading: isSearching } = useSWR<ProductsResponse>(
    searchUrl,
    async (url: string) => await api.get(url).json<ProductsResponse>(),
  );
  const searchResults = searchData?.data?.content || [];

  const fetchBatches = useCallback(
    async (productId: string): Promise<BatchOption[]> => {
      if (!selectedWarehouseId) return [];
      try {
        const res = await api
          .get(`batches?productId=${productId}&warehouseId=${selectedWarehouseId}`)
          .json<BatchesResponse>();
        return (res.data || [])
          .filter((b) => b.quantity > 0)
          .map((b) => ({
            batchId: b.id,
            batchCode: b.batchCode,
            quantity: b.quantity,
            sellingPrice: b.sellingPrice,
            expirationDate: b.expirationDate,
          }));
      } catch { return []; }
    },
    [selectedWarehouseId],
  );

  const onAddProduct = useCallback(
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

      const existingIndex = cart.findIndex(
        (item) => item.productId === product.id && item.batchId === batch.batchId,
      );

      if (existingIndex >= 0) {
        const updated = [...cart];
        const existing = updated[existingIndex];
        const newQty = existing.quantity + quantity;
        updated[existingIndex] = { ...existing, quantity: newQty, totalPrice: newQty * existing.unitPrice };
        setCart(updated);
      } else {
        setCart([
          ...cart,
          {
            id: crypto.randomUUID(),
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            batchId: batch.batchId,
            batchCode: batch.batchCode,
            quantity,
            unitPrice,
            totalPrice,
            availableBatches: batches,
          },
        ]);
      }
      setSearchQuery("");
    },
    [cart, fetchBatches],
  );

  const onRemoveItem = useCallback(
    (index: number) => { setCart(cart.filter((_, i) => i !== index)); },
    [cart],
  );

  const onUpdateQuantity = useCallback(
    (index: number, quantity: number) => {
      if (quantity <= 0) { onRemoveItem(index); return; }
      const updated = [...cart];
      updated[index] = { ...updated[index], quantity, totalPrice: quantity * updated[index].unitPrice };
      setCart(updated);
    },
    [cart, onRemoveItem],
  );

  const onChangeBatch = useCallback(
    (itemIndex: number, batchId: string) => {
      const updated = [...cart];
      const item = updated[itemIndex];
      const batch = item.availableBatches.find((b) => b.batchId === batchId);
      if (!batch) return;
      const unitPrice = batch.sellingPrice || 0;
      updated[itemIndex] = { ...item, batchId: batch.batchId, batchCode: batch.batchCode, unitPrice, totalPrice: item.quantity * unitPrice };
      setCart(updated);
    },
    [cart],
  );

  const subtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);
  const discountPercentage = form.watch("discountPercentage") || 0;
  const discountAmount = Math.round((subtotal * discountPercentage) / 100);
  const total = subtotal - discountAmount;

  const onSubmit = useCallback(
    async (data: PdvSchema) => {
      if (cart.length === 0) {
        toast.error("Adicione pelo menos um produto ao carrinho");
        return;
      }
      setIsSubmitting(true);

      const shouldUseInfinitePay =
        isMobile &&
        INFINITEPAY_PAYMENT_METHODS.has(data.paymentMethod) &&
        infinitepayConfig?.data?.configured === true;

      const salePayload = {
        warehouseId: data.warehouseId,
        paymentMethod: data.paymentMethod,
        paymentMode: data.paymentMode,
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
        useInfinitePay: shouldUseInfinitePay,
      };

      try {
        const res = await api
          .post("sales", { json: salePayload })
          .json<{ success: boolean; data: { id: string } }>();

        if (shouldUseInfinitePay) {
          const saleId = res.data.id;
          const config = infinitepayConfig!.data;
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "";
          const backendCallbackUrl = `${apiBaseUrl}/api/sales/infinitepay/callback`;

          const deeplink = buildInfinitePayDeeplink({
            amount: total,
            paymentMethod: mapPaymentMethodToInfinitePay(data.paymentMethod),
            installments: data.installments || 1,
            orderId: saleId,
            handle: config.handle!,
            docNumber: config.docNumber!,
            resultUrl: backendCallbackUrl,
          });

          toast.info("Abrindo InfinitePay para pagamento...");
          window.location.href = deeplink;
          return;
        }

        toast.success("Venda realizada com sucesso!");
        setCart([]);
        form.reset({
          warehouseId: data.warehouseId,
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
    [cart, form, isMobile, infinitepayConfig, total],
  );

  return {
    form, cart, searchQuery, onSearchChange: setSearchQuery, searchResults, isSearching,
    onAddProduct, onRemoveItem, onUpdateQuantity, onChangeBatch,
    subtotal, discountAmount, total, isSubmitting, onSubmit,
    warehouses, isLoadingWarehouses,
    batchPopoverOpen, onBatchPopoverChange: setBatchPopoverOpen,
    isMobile,
    shareDialogOpen, shareDialogData,
    onShareDialogClose: () => { setShareDialogOpen(false); setShareDialogData(null); },
  };
}
