import { differenceInCalendarDays, isValid, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import type {
  Batch,
  BatchFilterDraft,
  BatchFilters,
  BatchStatus,
  SortConfig,
  BatchesResponse,
  ProductBatchesGroup,
} from "./batches.types";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";

export type {
  Batch,
  BatchFilterDraft,
  BatchFilters,
  BatchStatus,
  SortConfig,
  ProductBatchesGroup,
};

const DEFAULT_LOW_STOCK_THRESHOLD = 10;

const DEFAULT_SORT_CONFIG: SortConfig = {
  key: "createdAt",
  direction: "desc",
};

const buildDefaultFilters = (
  selectedWarehouseId?: string | null,
): BatchFilters => ({
  searchQuery: "",
  warehouseId: selectedWarehouseId ?? "",
  status: "all",
  lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
});

const buildFilterDraft = (
  filters: BatchFilters,
  sortConfig: SortConfig,
  isGroupedByProduct: boolean,
): BatchFilterDraft => ({
  status: filters.status,
  lowStockThreshold: filters.lowStockThreshold,
  sortKey: sortConfig.key,
  sortDirection: sortConfig.direction,
  isGroupedByProduct,
});

export const deriveBatchStatus = (
  batch: Batch,
  options: { today?: Date; lowStockThreshold?: number } = {},
): BatchStatus => {
  const today = options.today ?? new Date();
  const threshold = options.lowStockThreshold ?? 10;
  const quantity = batch.quantity ?? 0;
  const expirationDate = batch.expirationDate
    ? parseISO(batch.expirationDate)
    : null;
  const hasValidExpiration = expirationDate && isValid(expirationDate);

  if (hasValidExpiration) {
    const days = differenceInCalendarDays(expirationDate, today);
    if (days < 0) {
      return { kind: "expired", label: "Expirado", daysToExpire: days };
    }
    if (days <= 30) {
      return { kind: "expiring", label: "Expirando", daysToExpire: days };
    }
  }

  if (quantity <= threshold) {
    return { kind: "low", label: "Baixo" };
  }

  return { kind: "ok", label: "OK" };
};

export const filterBatches = (batches: Batch[], filters: BatchFilters) => {
  const query = filters.searchQuery.trim().toLowerCase();

  return batches.filter((batch) => {
    if (filters.warehouseId && batch.warehouseId !== filters.warehouseId) {
      return false;
    }

    if (query) {
      const haystack = [
        batch.productName,
        batch.productSku,
        batch.batchNumber,
        batch.batchCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(query)) {
        return false;
      }
    }

    if (filters.status !== "all") {
      const status = deriveBatchStatus(batch, {
        lowStockThreshold: filters.lowStockThreshold,
      });
      return status.kind === filters.status;
    }

    return true;
  });
};

export const sortBatches = (batches: Batch[], sort: SortConfig) => {
  const sorted = [...batches];
  sorted.sort((a, b) => {
    const direction = sort.direction === "asc" ? 1 : -1;

    switch (sort.key) {
      case "product":
        return direction * a.productName.localeCompare(b.productName);
      case "quantity":
        return direction * (a.quantity - b.quantity);
      case "expiration": {
        const aDate = a.expirationDate ? parseISO(a.expirationDate) : null;
        const bDate = b.expirationDate ? parseISO(b.expirationDate) : null;
        const aTime = aDate && isValid(aDate) ? aDate.getTime() : 0;
        const bTime = bDate && isValid(bDate) ? bDate.getTime() : 0;
        return direction * (aTime - bTime);
      }
      case "createdAt":
        return (
          direction *
          (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        );
      default:
        return 0;
    }
  });
  return sorted;
};

export const useBatchesModel = () => {
  const { warehouseId: selectedWarehouseId } = useSelectedWarehouse();

  const [filters, setFilters] = useState<BatchFilters>(() =>
    buildDefaultFilters(selectedWarehouseId),
  );

  const [sortConfig, setSortConfig] =
    useState<SortConfig>(DEFAULT_SORT_CONFIG);
  const [isGroupedByProduct, setIsGroupedByProduct] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [mobileFiltersDraft, setMobileFiltersDraft] =
    useState<BatchFilterDraft>(() =>
      buildFilterDraft(
        buildDefaultFilters(selectedWarehouseId),
        DEFAULT_SORT_CONFIG,
        false,
      ),
    );

  useEffect(() => {
    if (selectedWarehouseId) {
      setFilters((prev) => ({ ...prev, warehouseId: selectedWarehouseId }));
    }
  }, [selectedWarehouseId]);

  const { data, error, isLoading, mutate } = useSWR<BatchesResponse>(
    "batches",
    async () => {
      const { api } = await import("@/lib/api");
      return await api.get("batches").json<BatchesResponse>();
    },
  );

  const filtered = useMemo(
    () => filterBatches(data?.data ?? [], filters),
    [data, filters],
  );

  const sorted = useMemo(
    () => sortBatches(filtered, sortConfig),
    [filtered, sortConfig],
  );

  const groupedByProduct = useMemo<ProductBatchesGroup[]>(() => {
    if (!isGroupedByProduct) return [];

    const groups = new Map<string, ProductBatchesGroup>();

    for (const batch of sorted) {
      const groupKey = batch.productId || batch.productName;
      const existing = groups.get(groupKey);

      if (existing) {
        existing.batches.push(batch);
        existing.totalQuantity += batch.quantity ?? 0;
        continue;
      }

      groups.set(groupKey, {
        key: groupKey,
        productId: batch.productId,
        productName: batch.productName,
        productSku: batch.productSku,
        totalQuantity: batch.quantity ?? 0,
        batches: [batch],
      });
    }

    return Array.from(groups.values());
  }, [sorted, isGroupedByProduct]);

  const statusCounts = useMemo(() => {
    return filtered.reduce(
      (acc, batch) => {
        const status = deriveBatchStatus(batch, {
          lowStockThreshold: filters.lowStockThreshold,
        });
        if (status.kind === "expired") acc.expired += 1;
        if (status.kind === "expiring") acc.expiring += 1;
        if (status.kind === "low") acc.low += 1;
        return acc;
      },
      { expired: 0, expiring: 0, low: 0 },
    );
  }, [filtered, filters.lowStockThreshold]);

  const onSortChange = (key: SortConfig["key"]) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }

      return { key, direction: "asc" };
    });
  };

  const onOpenMobileFilters = () => {
    setMobileFiltersDraft(
      buildFilterDraft(filters, sortConfig, isGroupedByProduct),
    );
    setIsMobileFiltersOpen(true);
  };

  const onMobileFiltersOpenChange = (open: boolean) => {
    if (open) {
      onOpenMobileFilters();
      return;
    }

    setIsMobileFiltersOpen(false);
  };

  const onApplyMobileFilters = () => {
    setFilters((prev) => ({
      ...prev,
      status: mobileFiltersDraft.status,
      lowStockThreshold: mobileFiltersDraft.lowStockThreshold,
    }));
    setSortConfig({
      key: mobileFiltersDraft.sortKey,
      direction: mobileFiltersDraft.sortDirection,
    });
    setIsGroupedByProduct(mobileFiltersDraft.isGroupedByProduct);
    setIsMobileFiltersOpen(false);
  };

  const onClearFilters = () => {
    setFilters((prev) => ({
      ...prev,
      searchQuery: "",
      status: "all",
      lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
    }));
    setSortConfig(DEFAULT_SORT_CONFIG);
    setIsGroupedByProduct(false);
  };

  const onClearMobileFilters = () => {
    const nextFilters = {
      ...filters,
      searchQuery: "",
      status: "all" as const,
      lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
    };

    setFilters(nextFilters);
    setSortConfig(DEFAULT_SORT_CONFIG);
    setIsGroupedByProduct(false);
    setMobileFiltersDraft(buildFilterDraft(nextFilters, DEFAULT_SORT_CONFIG, false));
  };

  return {
    batches: sorted,
    groupedByProduct,
    isLoading,
    error,
    filters,
    sortConfig,
    isGroupedByProduct,
    isMobileFiltersOpen,
    mobileFiltersDraft,
    statusCounts,
    setSearchQuery: (searchQuery: string) =>
      setFilters((prev) => ({ ...prev, searchQuery })),
    setStatus: (status: BatchFilters["status"]) =>
      setFilters((prev) => ({ ...prev, status })),
    onGroupedByProductChange: setIsGroupedByProduct,
    onSortChange,
    onMobileFiltersOpenChange,
    onOpenMobileFilters,
    onApplyMobileFilters,
    onClearFilters,
    onClearMobileFilters,
    onMobileFilterDraftChange: (patch: Partial<BatchFilterDraft>) =>
      setMobileFiltersDraft((prev) => ({ ...prev, ...patch })),
    refresh: mutate,
  };
};
