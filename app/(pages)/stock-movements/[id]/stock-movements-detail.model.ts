import useSWR from "swr";
import { api } from "@/lib/api";
import { useBreadcrumb } from "@/components/breadcrumb";
import type {
  StockMovementDetailResponse,
  BatchDetailResponse,
  BatchPriceInfo,
} from "./stock-movements-detail.types";

interface ProductImageResponse {
  success: boolean;
  data: { id: string; imageUrl: string | null };
}

export const useStockMovementDetailModel = (movementId: string) => {
  const {
    data,
    error,
    isLoading,
  } = useSWR<StockMovementDetailResponse>(
    movementId ? `stock-movements/${movementId}` : null,
    async (url: string) => {
      return await api.get(url).json<StockMovementDetailResponse>();
    },
  );

  const movement = data?.data ?? null;

  useBreadcrumb({
    title: movement?.code || "Carregando...",
    backUrl: "/stock-movements",
  });

  const batchIds = extractUniqueBatchIds(movement?.items);

  const { data: batchPricesData } = useSWR<BatchPriceInfo[]>(
    batchIds.length > 0 ? `batches-prices-${movementId}` : null,
    () => fetchBatchPrices(batchIds),
  );

  const productIds = extractUniqueProductIds(movement?.items);

  const { data: productImagesData } = useSWR<Map<string, string | null>>(
    productIds.length > 0 ? `product-images-${movementId}` : null,
    () => fetchProductImages(productIds),
  );

  if (movement && productImagesData) {
    for (const item of movement.items) {
      item.productImageUrl = productImagesData.get(item.productId) ?? null;
    }
  }

  return {
    movement,
    batchPrices: batchPricesData ?? [],
    isLoading,
    error,
  };
};

const extractUniqueBatchIds = (items?: { batchId: string }[] | null): string[] => {
  if (!items) return [];
  return [...new Set(items.map((item) => item.batchId))];
};

const fetchBatchPrices = async (batchIds: string[]): Promise<BatchPriceInfo[]> => {
  const results = await Promise.all(
    batchIds.map(async (id) => {
      const res = await api.get(`batches/${id}`).json<BatchDetailResponse>();
      return {
        batchId: id,
        costPrice: res.data.costPrice ?? null,
        sellingPrice: res.data.sellingPrice ?? null,
      };
    }),
  );
  return results;
};

const extractUniqueProductIds = (items?: { productId: string }[] | null): string[] => {
  if (!items) return [];
  return [...new Set(items.map((item) => item.productId))];
};

const fetchProductImages = async (productIds: string[]): Promise<Map<string, string | null>> => {
  const results = await Promise.all(
    productIds.map(async (id) => {
      const res = await api.get(`products/${id}`).json<ProductImageResponse>();
      return { id, imageUrl: res.data.imageUrl ?? null };
    }),
  );
  return new Map(results.map((r) => [r.id, r.imageUrl]));
};
