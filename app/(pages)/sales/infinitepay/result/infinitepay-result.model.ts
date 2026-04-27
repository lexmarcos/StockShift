"use client";

import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { api } from "@/lib/api";
import type { SaleDetailResponse } from "../../sales.types";
import { infinitePayResultStatusSchema } from "./infinitepay-result.schema";
import type { InfinitePayResultViewProps } from "./infinitepay-result.types";

function parseInfinitePayStatus(value: string | null) {
  const result = infinitePayResultStatusSchema.safeParse(value);
  return result.success ? result.data : "error";
}

export function useInfinitePayResultModel(): InfinitePayResultViewProps {
  const searchParams = useSearchParams();
  const saleId = searchParams.get("sale_id");
  const status = parseInfinitePayStatus(searchParams.get("status"));
  const message = searchParams.get("message");

  const { data, error, isLoading, mutate } = useSWR<SaleDetailResponse>(
    saleId ? `sales/${saleId}` : null,
    async (url: string) => await api.get(url).json<SaleDetailResponse>(),
  );

  return {
    status,
    sale: data?.data || null,
    message,
    isLoading,
    hasSaleId: Boolean(saleId),
    hasError: Boolean(error),
    retrySaleFetch: () => mutate(),
  };
}
