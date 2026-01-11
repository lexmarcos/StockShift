import useSWR from "swr";
import { api } from "@/lib/api";
import { ProductResponse } from "./products-detail.types";

export const useProductDetailModel = (productId: string) => {
  const { data, error, isLoading, mutate } = useSWR<ProductResponse>(
    productId ? `products/${productId}` : null,
    async (url: string) => {
      return await api.get(url).json<ProductResponse>();
    }
  );

  return {
    product: data?.data || null,
    isLoading,
    error,
    mutate,
  };
};
