import useSWR from "swr";
import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useBreadcrumb } from "@/components/breadcrumb";
import type {
  ProductImageResponse,
  StockMovement,
  StockMovementDetailResponse,
  StockMovementItemWithImage,
  TypeBadgeView,
} from "./stock-movements-detail.types";
import type { StockMovementType } from "../stock-movements.types";

const TYPE_BADGES: Record<StockMovementType, TypeBadgeView> = {
  PURCHASE_IN: {
    label: "Compra",
    icon: "in",
    borderClass: "border-emerald-500/30",
    bgClass: "bg-emerald-950/20",
    textClass: "text-emerald-400",
    accentClass: "bg-emerald-500",
    description: "Entrada por compra",
  },
  ADJUSTMENT_IN: {
    label: "Ajuste de Entrada",
    icon: "in",
    borderClass: "border-emerald-500/30",
    bgClass: "bg-emerald-950/20",
    textClass: "text-emerald-400",
    accentClass: "bg-emerald-500",
    description: "Ajuste manual de entrada",
  },
  TRANSFER_IN: {
    label: "Transferência (Entrada)",
    icon: "in",
    borderClass: "border-emerald-500/30",
    bgClass: "bg-emerald-950/20",
    textClass: "text-emerald-400",
    accentClass: "bg-emerald-500",
    description: "Entrada automática por transferência",
  },
  USAGE: {
    label: "Uso",
    icon: "out",
    borderClass: "border-rose-500/30",
    bgClass: "bg-rose-950/20",
    textClass: "text-rose-400",
    accentClass: "bg-rose-500",
    description: "Produto consumido ou utilizado",
  },
  GIFT: {
    label: "Presente",
    icon: "out",
    borderClass: "border-rose-500/30",
    bgClass: "bg-rose-950/20",
    textClass: "text-rose-400",
    accentClass: "bg-rose-500",
    description: "Produto dado como presente",
  },
  LOSS: {
    label: "Perda",
    icon: "out",
    borderClass: "border-rose-500/30",
    bgClass: "bg-rose-950/20",
    textClass: "text-rose-400",
    accentClass: "bg-rose-500",
    description: "Produto perdido ou extraviado",
  },
  DAMAGE: {
    label: "Dano",
    icon: "out",
    borderClass: "border-rose-500/30",
    bgClass: "bg-rose-950/20",
    textClass: "text-rose-400",
    accentClass: "bg-rose-500",
    description: "Produto danificado",
  },
  ADJUSTMENT_OUT: {
    label: "Ajuste de Saída",
    icon: "out",
    borderClass: "border-rose-500/30",
    bgClass: "bg-rose-950/20",
    textClass: "text-rose-400",
    accentClass: "bg-rose-500",
    description: "Ajuste manual de saída",
  },
  SALE: {
    label: "Venda",
    icon: "out",
    borderClass: "border-rose-500/30",
    bgClass: "bg-rose-950/20",
    textClass: "text-rose-400",
    accentClass: "bg-rose-500",
    description: "Saída por venda",
  },
  TRANSFER_OUT: {
    label: "Transferência (Saída)",
    icon: "out",
    borderClass: "border-rose-500/30",
    bgClass: "bg-rose-950/20",
    textClass: "text-rose-400",
    accentClass: "bg-rose-500",
    description: "Saída automática por transferência",
  },
};

const parseSafeDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
};

export const formatMovementDateTime = (value: string | null | undefined): string => {
  const parsed = parseSafeDate(value);
  if (!parsed) return "-";
  return format(parsed, "dd 'de' MMM, yyyy 'às' HH:mm", { locale: ptBR });
};

export const formatItemQuantity = (quantity: number): string => {
  return Number.isInteger(quantity) ? `${quantity}` : quantity.toFixed(2);
};

export const computeTotalQuantity = (
  movement: StockMovement | null,
): string => {
  if (!movement || movement.items.length === 0) return "0";
  const total = movement.items.reduce((acc, item) => acc + item.quantity, 0);
  return formatItemQuantity(total);
};

export const resolveTypeBadge = (
  movement: StockMovement | null,
): TypeBadgeView | null => {
  if (!movement) return null;
  return TYPE_BADGES[movement.type] ?? null;
};

export const resolveDetailTitle = (
  movement: StockMovement | null,
  hasError: boolean,
  isLoading: boolean,
): string => {
  if (movement) return movement.code;
  if (isLoading && !hasError) return "Carregando...";
  return "Movimentação não encontrada";
};

const extractUniqueProductIds = (movement: StockMovement | null): string[] => {
  if (!movement) return [];
  return Array.from(new Set(movement.items.map((item) => item.productId)));
};

const fetchProductImage = async (
  id: string,
): Promise<{ id: string; imageUrl: string | null }> => {
  try {
    const { api } = await import("@/lib/api");
    const res = await api.get(`products/${id}`).json<ProductImageResponse>();
    return { id, imageUrl: res.data.imageUrl ?? null };
  } catch {
    return { id, imageUrl: null };
  }
};

const fetchProductImages = async (
  ids: string[],
): Promise<Map<string, string | null>> => {
  const results = await Promise.all(ids.map(fetchProductImage));
  return new Map(results.map((r) => [r.id, r.imageUrl]));
};

export const mergeItemsWithImages = (
  movement: StockMovement | null,
  images: Map<string, string | null> | undefined,
): StockMovementItemWithImage[] => {
  if (!movement) return [];
  return movement.items.map((item) => ({
    ...item,
    productImageUrl: images?.get(item.productId) ?? item.productImageUrl ?? null,
  }));
};

export const useStockMovementDetailModel = (movementId: string) => {
  const { data, error, isLoading } = useSWR<StockMovementDetailResponse>(
    movementId ? `stock-movements/${movementId}` : null,
    async (url: string) => {
      const { api } = await import("@/lib/api");
      return await api.get(url).json<StockMovementDetailResponse>();
    },
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  const movement: StockMovement | null = data?.data ?? null;
  const hasError = Boolean(error);
  const productIds = extractUniqueProductIds(movement);
  const imagesKey =
    productIds.length > 0
      ? `stock-movement-product-images:${productIds.join(",")}`
      : null;

  const { data: imagesMap } = useSWR<Map<string, string | null>>(
    imagesKey,
    () => fetchProductImages(productIds),
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  useBreadcrumb({
    title: resolveDetailTitle(movement, hasError, isLoading),
    backUrl: "/stock-movements",
  });

  return {
    movement,
    items: mergeItemsWithImages(movement, imagesMap),
    isLoading: isLoading && !hasError,
    error: error ?? null,
    typeBadge: resolveTypeBadge(movement),
    formattedCreatedAt: formatMovementDateTime(movement?.createdAt),
    formattedUpdatedAt: formatMovementDateTime(movement?.updatedAt),
    totalQuantity: computeTotalQuantity(movement),
    itemCount: movement?.items.length ?? 0,
    hasReference: Boolean(movement?.referenceId),
  };
};
