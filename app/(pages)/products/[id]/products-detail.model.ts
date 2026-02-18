import useSWR from "swr";
import { api } from "@/lib/api";
import {
  ProductBatchesResponse,
  ProductResponse,
} from "./products-detail.types";
import { useBreadcrumb } from "@/components/breadcrumb";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";

export const useProductDetailModel = (productId: string) => {
  const { warehouseId } = useSelectedWarehouse();

  const { data, error, isLoading, mutate } = useSWR<ProductResponse>(
    productId ? `products/${productId}` : null,
    async (url: string) => {
      return await api.get(url).json<ProductResponse>();
    }
  );

  const {
    data: batchesData,
    error: batchesError,
    isLoading: isLoadingBatches,
  } = useSWR<ProductBatchesResponse>(
    productId && warehouseId
      ? `batches/warehouses/${warehouseId}/products/${productId}/batches`
      : null,
    async (url: string) => {
      return await api.get(url).json<ProductBatchesResponse>();
    }
  );

  const product = data?.data || null;
  const batches = batchesData?.data || [];

  useBreadcrumb({
    title: product?.name || "Carregando...",
    backUrl: "/products",
  });

  return {
    product,
    batches,
    isLoading,
    isLoadingBatches,
    error,
    batchesError,
    mutate,
  };
};
