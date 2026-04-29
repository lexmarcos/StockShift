import { useState, useMemo } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import {
  DateFilterPreset,
  StockMovementFilterDraft,
  StockMovementsResponse,
  StockMovementFilters,
  SortField,
  SortOrder,
} from "./stock-movements.types";

const formatDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDateRangeForPreset = (
  preset: DateFilterPreset,
): Pick<StockMovementFilterDraft, "dateFrom" | "dateTo"> => {
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

const buildDefaultFilterDraft = (): StockMovementFilterDraft => ({
  type: "ALL",
  datePreset: "ALL",
  dateFrom: undefined,
  dateTo: undefined,
  sortBy: "createdAt",
  sortOrder: "desc",
});

const buildDefaultFilters = (): StockMovementFilters => ({
  ...buildDefaultFilterDraft(),
  page: 0,
  pageSize: 20,
});

const extractFilterDraft = (
  filters: StockMovementFilters,
): StockMovementFilterDraft => ({
  type: filters.type ?? "ALL",
  datePreset: filters.datePreset,
  dateFrom: filters.dateFrom,
  dateTo: filters.dateTo,
  sortBy: filters.sortBy,
  sortOrder: filters.sortOrder,
});

const buildDatePresetPatch = (
  preset: DateFilterPreset,
  currentRange: Pick<StockMovementFilterDraft, "dateFrom" | "dateTo">,
): Pick<StockMovementFilterDraft, "datePreset" | "dateFrom" | "dateTo"> => {
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

export const useStockMovementsModel = () => {
  const { warehouseId } = useSelectedWarehouse();

  const [filters, setFilters] = useState<StockMovementFilters>(
    buildDefaultFilters,
  );
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [mobileFiltersDraft, setMobileFiltersDraft] =
    useState<StockMovementFilterDraft>(buildDefaultFilterDraft);

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
      params.append("dateFrom", `${filters.dateFrom}T00:00:00`);
    }
    if (filters.dateTo) {
      params.append("dateTo", `${filters.dateTo}T23:59:59`);
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

  const onSortChange = (sortBy: SortField, sortOrder: SortOrder) => {
    setFilters((prev) => ({ ...prev, sortBy, sortOrder, page: 0 }));
  };

  const onFilterChange = <K extends keyof StockMovementFilters>(
    key: K,
    value: StockMovementFilters[K],
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

  const onMobileFilterDraftChange = <K extends keyof StockMovementFilterDraft>(
    key: K,
    value: StockMovementFilterDraft[K],
  ) => {
    setMobileFiltersDraft((prev) => ({ ...prev, [key]: value }));
  };

  return {
    movements,
    isLoading,
    error: error || null,
    filters,
    mobileFiltersDraft,
    isMobileFiltersOpen,
    pagination,
    onPageChange,
    onPageSizeChange,
    onFilterChange,
    onSortChange,
    onDatePresetChange,
    onDateInputChange,
    onOpenMobileFilters,
    onCloseMobileFilters,
    onApplyMobileFilters,
    onClearMobileFilters,
    onMobileDatePresetChange,
    onMobileDateInputChange,
    onMobileFilterDraftChange,
  };
};
