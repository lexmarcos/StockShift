import { differenceInCalendarDays, isValid, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import useSWR from "swr";
import type { Batch, BatchFilters, BatchStatus, SortConfig, BatchesResponse } from "./batches.types";
import type { Warehouse } from "../warehouses/warehouses.types";

export type { Batch, BatchFilters, BatchStatus, SortConfig };

export const deriveBatchStatus = (
  batch: Batch,
  options: { today?: Date; lowStockThreshold?: number } = {}
): BatchStatus => {
  const today = options.today ?? new Date();
  const threshold = options.lowStockThreshold ?? 10;
  const quantity = batch.quantity ?? 0;
  const expirationDate = batch.expirationDate ? parseISO(batch.expirationDate) : null;
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
  const [filters, setFilters] = useState<BatchFilters>({
    searchQuery: "",
    warehouseId: "",
    status: "all",
    lowStockThreshold: 10,
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "createdAt",
    direction: "desc",
  });

  const { data, error, isLoading, mutate } = useSWR<BatchesResponse>(
    "batches",
    async () => {
      const { api } = await import("@/lib/api");
      return await api.get("batches").json<BatchesResponse>();
    }
  );

  const { data: warehousesData } = useSWR<{ success: boolean; data: Warehouse[] }>(
    "warehouses",
    async () => {
      const { api } = await import("@/lib/api");
      return await api.get("warehouses").json();
    }
  );

  const rawBatches = data?.data || [];

  const filtered = useMemo(
    () => filterBatches(rawBatches, filters),
    [rawBatches, filters]
  );

  const sorted = useMemo(
    () => sortBatches(filtered, sortConfig),
    [filtered, sortConfig]
  );

  const statusCounts = useMemo(() => {
    return rawBatches.reduce(
      (acc, batch) => {
        const status = deriveBatchStatus(batch, {
          lowStockThreshold: filters.lowStockThreshold,
        });
        if (status.kind === "expired") acc.expired += 1;
        if (status.kind === "expiring") acc.expiring += 1;
        if (status.kind === "low") acc.low += 1;
        return acc;
      },
      { expired: 0, expiring: 0, low: 0 }
    );
  }, [rawBatches, filters.lowStockThreshold]);

  return {
    batches: sorted,
    isLoading,
    error,
    filters,
    sortConfig,
    warehouses: warehousesData?.data || [],
    statusCounts,
    setSearchQuery: (searchQuery: string) =>
      setFilters((prev) => ({ ...prev, searchQuery })),
    setWarehouseId: (warehouseId: string) =>
      setFilters((prev) => ({ ...prev, warehouseId })),
    setStatus: (status: BatchFilters["status"]) =>
      setFilters((prev) => ({ ...prev, status })),
    setSortConfig,
    onClearFilters: () =>
      setFilters((prev) => ({
        ...prev,
        searchQuery: "",
        warehouseId: "",
        status: "all",
      })),
    refresh: mutate,
  };
};
