import useSWR from "swr";
import { api } from "@/lib/api";
import { ProductResponse } from "./products-detail.types";
import { useBreadcrumb } from "@/components/breadcrumb";

export const useProductDetailModel = (productId: string) => {
  const { data, error, isLoading, mutate } = useSWR<ProductResponse>(
    productId ? `products/${productId}` : null,
    async (url: string) => {
      return await api.get(url).json<ProductResponse>();
    }
  );

  const product = data?.data || null;

  useBreadcrumb({
    title: product?.name || "Carregando...",
    backUrl: "/products",
  });

  return {
    product,
    isLoading,
    error,
    mutate,
  };
};
