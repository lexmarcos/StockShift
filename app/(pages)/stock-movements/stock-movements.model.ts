import { useState, useMemo } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import {
  StockMovementsResponse,
  StockMovementFilters,
  SortField,
  SortOrder,
} from "./stock-movements.types";

export const useStockMovementsModel = () => {
  const { warehouseId } = useSelectedWarehouse();

  const [filters, setFilters] = useState<StockMovementFilters>({
    type: "ALL",
    sortBy: "createdAt",
    sortOrder: "desc",
    page: 0,
    pageSize: 20,
  });

  const url = useMemo(() => {
    if (!warehouseId) return null;

    const params = new URLSearchParams();
    params.append("warehouseId", warehouseId);
    params.append("page", filters.page.toString());
    params.append("size", filters.pageSize.toString());
    params.append("sort", `${filters.sortBy},${filters.sortOrder}`);

    if (filters.type && filters.type !== "ALL") {
      params.append("type", filters.type);
    }
    if (filters.dateFrom) {
      params.append("dateFrom", filters.dateFrom);
    }
    if (filters.dateTo) {
      params.append("dateTo", filters.dateTo);
    }

    return `stock-movements?${params.toString()}`;
  }, [
    warehouseId,
    filters.page,
    filters.pageSize,
    filters.sortBy,
    filters.sortOrder,
    filters.type,
    filters.dateFrom,
    filters.dateTo,
  ]);

  const { data, error, isLoading } = useSWR<StockMovementsResponse>(
    url,
    async (url: string) => {
      try {
        return await api.get(url).json<StockMovementsResponse>();
      } catch (err) {
        console.error("Erro ao carregar movimentações de estoque:", err);
        toast.error("Erro ao carregar movimentações");
        throw err;
      }
    },
  );

  const movements = data?.data.content || [];
  const pagination = data?.data
    ? {
        page: data.data.number,
        pageSize: data.data.size,
        totalPages: data.data.totalPages,
        totalElements: data.data.totalElements,
      }
    : {
        page: 0,
        pageSize: 20,
        totalPages: 0,
        totalElements: 0,
      };

  const onPageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const onPageSizeChange = (pageSize: number) => {
    setFilters((prev) => ({ ...prev, pageSize, page: 0 }));
  };

  const onFilterChange = (key: keyof StockMovementFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 0 }));
  };

  const onSortChange = (sortBy: SortField, sortOrder: SortOrder) => {
    setFilters((prev) => ({ ...prev, sortBy, sortOrder, page: 0 }));
  };

  return {
    movements,
    isLoading,
    error: error || null,
    filters,
    pagination,
    onPageChange,
    onPageSizeChange,
    onFilterChange,
    onSortChange,
  };
};
