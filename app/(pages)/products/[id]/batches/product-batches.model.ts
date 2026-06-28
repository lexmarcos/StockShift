import { useMemo, useState } from "react";
import useSWR from "swr";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import { useBreadcrumb } from "@/components/breadcrumb";
import { deriveBatchStatus } from "@/app/(pages)/batches/batches.model";
import { formatBatchDate } from "@/app/(pages)/batches/[id]/batches-detail.model";
import { formatCentsToBRL } from "@/lib/currency";
import { useUpdateSellingPrice } from "./update-selling-price.model";
import type { Batch } from "@/app/(pages)/batches/batches.types";
import type {
  ProductBatch,
  SortKey,
  SortDirection,
} from "./product-batches.types";

interface BatchesResponse {
  success: boolean;
  data: ProductBatch[];
}

export const getProductBatchStatus = (
  batch: ProductBatch,
): ReturnType<typeof deriveBatchStatus> =>
  deriveBatchStatus({
    quantity: batch.quantity,
    expirationDate: batch.expirationDate,
  } as Batch);

export const sortProductBatches = (
  batches: readonly ProductBatch[],
  key: SortKey,
  direction: SortDirection,
): ProductBatch[] => {
  const sorted = [...batches];
  const multiplier = direction === "asc" ? 1 : -1;

  sorted.sort((a, b) => {
    switch (key) {
      case "batchCode": {
        const aCode = a.batchCode ?? "";
        const bCode = b.batchCode ?? "";
        if (!aCode && !bCode) return 0;
        if (!aCode) return multiplier;
        if (!bCode) return -multiplier;
        return multiplier * aCode.localeCompare(bCode);
      }
      case "quantity":
        return multiplier * (a.quantity - b.quantity);
      case "expirationDate": {
        const aTime = a.expirationDate ? new Date(a.expirationDate).getTime() : 0;
        const bTime = b.expirationDate ? new Date(b.expirationDate).getTime() : 0;
        if (!aTime && !bTime) return 0;
        if (!aTime) return multiplier;
        if (!bTime) return -multiplier;
        return multiplier * (aTime - bTime);
      }
      default:
        return 0;
    }
  });

  return sorted;
};

export const useProductBatchesModel = (productId: string) => {
  const { warehouseId } = useSelectedWarehouse();

  const [sortKey, setSortKey] = useState<SortKey>("expirationDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const url = warehouseId
    ? `batches/warehouses/${warehouseId}/products/${productId}/batches`
    : null;

  const { data, error, isLoading, mutate } = useSWR<BatchesResponse>(
    url,
    async (requestUrl: string) => {
      const { api } = await import("@/lib/api");
      return await api.get(requestUrl).json<BatchesResponse>();
    },
    { revalidateOnFocus: false },
  );

  const rawBatches = useMemo(() => data?.data ?? [], [data]);
  const productName = rawBatches.length > 0 ? rawBatches[0].productName ?? "" : "";

  const batches = useMemo(
    () => sortProductBatches(rawBatches, sortKey, sortDirection),
    [rawBatches, sortKey, sortDirection],
  );

  const sellingPriceUpdate = useUpdateSellingPrice({
    warehouseId,
    productId,
    batches: rawBatches,
    onUpdated: () => {
      void mutate();
    },
  });

  const onSortChange = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  };

  useBreadcrumb({
    title: "Lotes",
    backUrl: "/products",
  });

  return {
    batches,
    productName,
    isLoading,
    error: error ?? null,
    requiresWarehouse: !warehouseId,
    sortKey,
    sortDirection,
    onSortChange,
    sellingPriceUpdate,
  };
};

export { deriveBatchStatus, formatBatchDate, formatCentsToBRL };
