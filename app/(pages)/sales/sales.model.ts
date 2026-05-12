import { useState, useMemo } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import {
  DateFilterPreset,
  DailyChartEntry,
  SaleFilterDraft,
  SaleSummary,
  SalesResponse,
  SaleFilters,
  SalesMetricsData,
  SalesKpiSummary,
} from "./sales.types";

export interface SalesMetricsDateRange {
  dateFrom: string;
  dateTo: string;
  isDefaultCurrentMonth: boolean;
}

const SALES_ANALYTICS_PAGE_SIZE = 200;

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

const parseDateInputValue = (value: string): Date => {
  const pattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!pattern.test(value)) {
    throw new Error(`Invalid date input "${value}". Expected YYYY-MM-DD.`);
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsedDate = new Date(year, month - 1, day);

  if (formatDateInputValue(parsedDate) !== value) {
    throw new Error(`Invalid date input "${value}". Expected valid YYYY-MM-DD.`);
  }

  return parsedDate;
};

const normalizeSalesMetricsDateRange = (
  dateFrom: string,
  dateTo: string,
  isDefaultCurrentMonth: boolean,
): SalesMetricsDateRange => {
  const startDate = parseDateInputValue(dateFrom);
  const endDate = parseDateInputValue(dateTo);

  if (startDate <= endDate) {
    return { dateFrom, dateTo, isDefaultCurrentMonth };
  }

  return {
    dateFrom: dateTo,
    dateTo: dateFrom,
    isDefaultCurrentMonth,
  };
};

export const resolveSalesMetricsDateRange = (
  filters: SaleFilters,
): SalesMetricsDateRange => {
  const monthRange = getDateRangeForPreset("THIS_MONTH");
  const presetRange = getDateRangeForPreset(filters.datePreset);
  const dateFrom = filters.dateFrom ?? presetRange.dateFrom;
  const dateTo = filters.dateTo ?? presetRange.dateTo;

  if (dateFrom && dateTo) {
    return normalizeSalesMetricsDateRange(dateFrom, dateTo, false);
  }

  if (dateFrom || dateTo) {
    const boundary = dateFrom ?? dateTo ?? "";
    return normalizeSalesMetricsDateRange(boundary, boundary, false);
  }

  return normalizeSalesMetricsDateRange(
    monthRange.dateFrom ?? "",
    monthRange.dateTo ?? "",
    true,
  );
};

const appendSalesRequestFilters = (
  params: URLSearchParams,
  filters: SaleFilters,
) => {
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
};

const buildSalesRequestUrl = (
  warehouseId: string,
  filters: SaleFilters,
): string => {
  const params = new URLSearchParams();
  params.append("warehouseId", warehouseId);
  params.append("page", filters.page.toString());
  params.append("size", filters.pageSize.toString());
  appendSalesRequestFilters(params, filters);

  return `sales?${params.toString()}`;
};

export const buildSalesMetricsRequestUrl = (
  warehouseId: string,
  filters: SaleFilters,
  range: SalesMetricsDateRange,
): string => {
  const metricsFilters: SaleFilters = {
    ...filters,
    page: 0,
    pageSize: SALES_ANALYTICS_PAGE_SIZE,
    dateFrom: range.dateFrom,
    dateTo: range.dateTo,
  };
  const params = new URLSearchParams();
  params.append("warehouseId", warehouseId);
  params.append("page", "0");
  params.append("size", SALES_ANALYTICS_PAGE_SIZE.toString());
  appendSalesRequestFilters(params, metricsFilters);

  return `sales?${params.toString()}`;
};

const buildSalesMetricsPageUrl = (url: string, page: number): string => {
  const [pathname, query = ""] = url.split("?");
  const params = new URLSearchParams(query);
  params.set("page", page.toString());

  return `${pathname}?${params.toString()}`;
};

const fetchSalesResponse = async (url: string): Promise<SalesResponse> =>
  api.get(url).json<SalesResponse>();

const fetchRemainingSalesMetricsPages = async (
  firstUrl: string,
  firstResponse: SalesResponse,
): Promise<SaleSummary[]> => {
  const totalPages = firstResponse.data.totalPages;

  if (totalPages <= 1) return [];

  const pageUrls = Array.from({ length: totalPages - 1 }, (_, index) =>
    buildSalesMetricsPageUrl(firstUrl, index + 1),
  );
  const pageResponses = await Promise.all(pageUrls.map(fetchSalesResponse));

  return pageResponses.flatMap((response) => response.data.content);
};

const buildSalesKpiSummary = (sales: SaleSummary[]): SalesKpiSummary => {
  const count = sales.length;
  const revenue = sales.reduce((total, sale) => total + sale.total, 0);
  const avgTicket = count > 0 ? Math.round(revenue / count) : 0;

  return { count, revenue, avgTicket };
};

const buildDateRangeChartEntries = (
  range: SalesMetricsDateRange,
): DailyChartEntry[] => {
  const entries: DailyChartEntry[] = [];
  const currentDate = parseDateInputValue(range.dateFrom);
  const endDate = parseDateInputValue(range.dateTo);

  while (currentDate <= endDate) {
    entries.push({ date: formatDateInputValue(currentDate), count: 0, revenue: 0 });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return entries;
};

const getSaleDateInputValue = (sale: SaleSummary): string =>
  formatDateInputValue(new Date(sale.createdAt));

const buildSalesDailyChart = (
  sales: SaleSummary[],
  range: SalesMetricsDateRange,
): DailyChartEntry[] => {
  const entries = buildDateRangeChartEntries(range);
  const entriesByDate = new Map(entries.map((entry) => [entry.date, entry]));

  sales.forEach((sale) => {
    const entry = entriesByDate.get(getSaleDateInputValue(sale));
    if (!entry) return;
    entry.count += 1;
    entry.revenue += sale.total;
  });

  return entries;
};

export const buildSalesMetricsData = (
  sales: SaleSummary[],
  range: SalesMetricsDateRange,
): SalesMetricsData => ({
  kpiSummary: buildSalesKpiSummary(sales),
  dailyChart: buildSalesDailyChart(sales, range),
});

const formatDateSummaryValue = (value: string): string => {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
};

export const buildSalesMetricsTitle = (
  range: SalesMetricsDateRange,
): string => {
  if (range.isDefaultCurrentMonth) {
    return "Vendas do mês atual";
  }

  if (range.dateFrom === range.dateTo) {
    return `Vendas de ${formatDateSummaryValue(range.dateFrom)}`;
  }

  return `Vendas de ${formatDateSummaryValue(range.dateFrom)} a ${formatDateSummaryValue(range.dateTo)}`;
};

const fetchSalesMetricsData = async (
  url: string,
  range: SalesMetricsDateRange,
): Promise<SalesMetricsData> => {
  const firstResponse = await fetchSalesResponse(url);
  const remainingSales = await fetchRemainingSalesMetricsPages(
    url,
    firstResponse,
  );

  return buildSalesMetricsData(
    [...firstResponse.data.content, ...remainingSales],
    range,
  );
};

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

    return buildSalesRequestUrl(warehouseId, filters);
  }, [warehouseId, filters]);

  const salesMetricsRange = useMemo(
    () => resolveSalesMetricsDateRange(filters),
    [filters],
  );

  const salesMetricsUrl = useMemo(() => {
    if (!warehouseId) return null;

    return buildSalesMetricsRequestUrl(
      warehouseId,
      filters,
      salesMetricsRange,
    );
  }, [warehouseId, filters, salesMetricsRange]);

  const { data, error, isLoading } = useSWR<SalesResponse>(url, async (url: string) => {
    try {
      return await api.get(url).json<SalesResponse>();
    } catch (err) {
      console.error("Erro ao carregar vendas:", err);
      toast.error("Erro ao carregar vendas");
      throw err;
    }
  });

  const { data: salesMetricsData, isLoading: salesMetricsLoading } = useSWR<SalesMetricsData | undefined>(
    salesMetricsUrl,
    async (url: string) => {
      try {
        return await fetchSalesMetricsData(url, salesMetricsRange);
      } catch (err) {
        console.error("Erro ao carregar métricas de vendas:", err);
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
    salesMetricsData: salesMetricsData || null,
    salesMetricsLoading,
    salesMetricsTitle: buildSalesMetricsTitle(salesMetricsRange),
  };
};
