import { useState, useMemo } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import {
  DateFilterPreset,
  SaleFilterDraft,
  SalesResponse,
  SaleFilters,
  SalesDashboardResponse,
} from "./sales.types";

const formatDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDateRangeForPreset = (
  preset: DateFilterPreset,
): Pick<SaleFilterDraft, "dateFrom" | "dateTo"> => {
  const today = new Date();

  if (preset === "TODAY") {
    const value = formatDateInputValue(today);
    return { dateFrom: value, dateTo: value };
  }

  if (preset === "LAST_7_DAYS") {
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6);
    return {
      dateFrom: formatDateInputValue(startDate),
      dateTo: formatDateInputValue(today),
    };
  }

  if (preset === "THIS_MONTH") {
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      dateFrom: formatDateInputValue(startDate),
      dateTo: formatDateInputValue(endDate),
    };
  }

  return { dateFrom: undefined, dateTo: undefined };
};

const buildDefaultFilterDraft = (): SaleFilterDraft => ({
  status: "ALL",
  paymentMethod: "ALL",
  datePreset: "ALL",
  dateFrom: undefined,
  dateTo: undefined,
});

const buildDefaultFilters = (): SaleFilters => ({
  ...buildDefaultFilterDraft(),
  page: 0,
  pageSize: 20,
});

const extractFilterDraft = (filters: SaleFilters): SaleFilterDraft => ({
  status: filters.status ?? "ALL",
  paymentMethod: filters.paymentMethod ?? "ALL",
  datePreset: filters.datePreset,
  dateFrom: filters.dateFrom,
  dateTo: filters.dateTo,
});

const buildDatePresetPatch = (
  preset: DateFilterPreset,
  currentRange: Pick<SaleFilterDraft, "dateFrom" | "dateTo">,
): Pick<SaleFilterDraft, "datePreset" | "dateFrom" | "dateTo"> => {
  if (preset === "CUSTOM") {
    const fallback = getDateRangeForPreset("THIS_MONTH");
    return {
      datePreset: preset,
      dateFrom: currentRange.dateFrom ?? fallback.dateFrom,
      dateTo: currentRange.dateTo ?? fallback.dateTo,
    };
  }

  return {
    datePreset: preset,
    ...getDateRangeForPreset(preset),
  };
};

export const useSalesModel = () => {
  const { warehouseId } = useSelectedWarehouse();

  const [filters, setFilters] = useState<SaleFilters>(buildDefaultFilters);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [mobileFiltersDraft, setMobileFiltersDraft] =
    useState<SaleFilterDraft>(buildDefaultFilterDraft);

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
      params.append("dateFrom", `${filters.dateFrom}T00:00:00`);
    }
    if (filters.dateTo) {
      params.append("dateTo", `${filters.dateTo}T23:59:59`);
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

  const onFilterChange = <K extends keyof SaleFilters>(
    key: K,
    value: SaleFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 0 }));
  };

  const onDatePresetChange = (preset: DateFilterPreset) => {
    setFilters((prev) => ({
      ...prev,
      ...buildDatePresetPatch(preset, prev),
      page: 0,
    }));
  };

  const onDateInputChange = (key: "dateFrom" | "dateTo", value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      datePreset: "CUSTOM",
      page: 0,
    }));
  };

  const onOpenMobileFilters = () => {
    setMobileFiltersDraft(extractFilterDraft(filters));
    setIsMobileFiltersOpen(true);
  };

  const onCloseMobileFilters = () => {
    setIsMobileFiltersOpen(false);
  };

  const onApplyMobileFilters = () => {
    setFilters((prev) => ({ ...prev, ...mobileFiltersDraft, page: 0 }));
    setIsMobileFiltersOpen(false);
  };

  const onClearMobileFilters = () => {
    setMobileFiltersDraft(buildDefaultFilterDraft());
  };

  const onMobileDatePresetChange = (preset: DateFilterPreset) => {
    setMobileFiltersDraft((prev) => ({
      ...prev,
      ...buildDatePresetPatch(preset, prev),
    }));
  };

  const onMobileDateInputChange = (
    key: "dateFrom" | "dateTo",
    value: string,
  ) => {
    setMobileFiltersDraft((prev) => ({
      ...prev,
      [key]: value || undefined,
      datePreset: "CUSTOM",
    }));
  };

  const onMobileFilterDraftChange = <K extends keyof SaleFilterDraft>(
    key: K,
    value: SaleFilterDraft[K],
  ) => {
    setMobileFiltersDraft((prev) => ({ ...prev, [key]: value }));
  };

  return {
    sales,
    isLoading,
    error: error || null,
    filters,
    mobileFiltersDraft,
    isMobileFiltersOpen,
    pagination,
    onPageChange,
    onFilterChange,
    onDatePresetChange,
    onDateInputChange,
    onOpenMobileFilters,
    onCloseMobileFilters,
    onApplyMobileFilters,
    onClearMobileFilters,
    onMobileDatePresetChange,
    onMobileDateInputChange,
    onMobileFilterDraftChange,
    dashboardData: dashboardData?.data || null,
    dashboardLoading,
  };
};
