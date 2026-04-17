import { useState, useMemo } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import { SalesResponse, SaleFilters, SalesDashboardResponse } from "./sales.types";

export const useSalesModel = () => {
  const { warehouseId } = useSelectedWarehouse();

  const [filters, setFilters] = useState<SaleFilters>({
    status: "ALL",
    page: 0,
    pageSize: 20,
  });

  const url = useMemo(() => {
    if (!warehouseId) return null;

    const params = new URLSearchParams();
    params.append("warehouseId", warehouseId);
    params.append("page", filters.page.toString());
    params.append("size", filters.pageSize.toString());

    if (filters.status && filters.status !== "ALL") {
      params.append("status", filters.status);
    }
    if (filters.paymentMethod && filters.paymentMethod !== "ALL") {
      params.append("paymentMethod", filters.paymentMethod);
    }
    if (filters.dateFrom) {
      params.append("dateFrom", filters.dateFrom);
    }
    if (filters.dateTo) {
      params.append("dateTo", filters.dateTo);
    }

    return `sales?${params.toString()}`;
  }, [warehouseId, filters]);

  const { data, error, isLoading } = useSWR<SalesResponse>(url, async (url: string) => {
    try {
      return await api.get(url).json<SalesResponse>();
    } catch (err) {
      console.error("Erro ao carregar vendas:", err);
      toast.error("Erro ao carregar vendas");
      throw err;
    }
  });

  const dashboardUrl = warehouseId ? `sales/dashboard?warehouseId=${warehouseId}` : null;

  const { data: dashboardData, isLoading: dashboardLoading } = useSWR<SalesDashboardResponse | undefined>(
    dashboardUrl,
    async (url: string) => {
      try {
        return await api.get(url).json<SalesDashboardResponse>();
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
        return undefined;
      }
    }
  );

  const sales = data?.data.content || [];
  const pagination = data?.data
    ? {
        page: data.data.number,
        pageSize: data.data.size,
        totalPages: data.data.totalPages,
        totalElements: data.data.totalElements,
      }
    : { page: 0, pageSize: 20, totalPages: 0, totalElements: 0 };

  const onPageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const onFilterChange = (key: keyof SaleFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 0 }));
  };

  return {
    sales,
    isLoading,
    error: error || null,
    filters,
    pagination,
    onPageChange,
    onFilterChange,
    dashboardData: dashboardData?.data || null,
    dashboardLoading,
  };
};
