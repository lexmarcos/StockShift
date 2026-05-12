import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildSalesMetricsData,
  buildSalesMetricsTitle,
  resolveSalesMetricsDateRange,
  useSalesModel,
  type SalesMetricsDateRange,
} from "./sales.model";
import type {
  SaleFilters,
  SaleSummary,
  SalesMetricsData,
  SalesResponse,
} from "./sales.types";

const mockSWR = vi.fn();
const mockApiGet = vi.fn();

let activeWarehouseId: string | null = "wh-1";
let salesRequest: string | null = null;
let metricsRequest: string | null = null;
let salesResponse: SalesResponse | undefined;
let salesMetricsData: SalesMetricsData | undefined;
let salesLoading = false;
let salesError: Error | null = null;

vi.mock("@/hooks/use-selected-warehouse", () => ({
  useSelectedWarehouse: () => ({
    warehouseId: activeWarehouseId,
    setWarehouseId: vi.fn(),
  }),
}));

vi.mock("swr", () => ({
  default: (...args: unknown[]) => mockSWR(...args),
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: (...args: unknown[]) => mockApiGet(...args),
  },
}));

const buildSaleSummary = (
  overrides: Partial<SaleSummary> = {},
): SaleSummary => ({
  id: "s1",
  code: "V-001",
  warehouseId: "wh-1",
  warehouseName: "CD Central",
  paymentMethod: "PIX",
  total: 15000,
  status: "COMPLETED",
  createdAt: "2026-05-12T10:00:00",
  createdByUserName: "Maria",
  ...overrides,
});

const buildSalesResponse = (
  content: SaleSummary[],
  totalPages = 1,
  number = 0,
  size = 20,
): SalesResponse => ({
  success: true,
  message: "ok",
  data: {
    content,
    totalElements: content.length,
    totalPages,
    number,
    size,
    empty: content.length === 0,
  },
});

const buildDefaultFilters = (): SaleFilters => ({
  status: "ALL",
  paymentMethod: "ALL",
  datePreset: "ALL",
  dateFrom: undefined,
  dateTo: undefined,
  page: 0,
  pageSize: 20,
});

const buildCurrentMonthRange = (): SalesMetricsDateRange => ({
  dateFrom: "2026-05-01",
  dateTo: "2026-05-31",
  isDefaultCurrentMonth: true,
});

const toJsonResponse = <T,>(value: T) => ({
  json: vi.fn(async () => value),
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 4, 12, 12, 0, 0));
  vi.clearAllMocks();

  activeWarehouseId = "wh-1";
  salesRequest = null;
  metricsRequest = null;
  salesLoading = false;
  salesError = null;

  salesResponse = buildSalesResponse([buildSaleSummary()]);
  salesMetricsData = buildSalesMetricsData(
    [
      buildSaleSummary({ id: "s1", total: 15000 }),
      buildSaleSummary({
        id: "s2",
        code: "V-002",
        total: 4200,
        createdAt: "2026-05-13T11:00:00",
      }),
    ],
    buildCurrentMonthRange(),
  );

  mockSWR.mockImplementation((key: unknown) => {
    if (typeof key === "string" && key.includes("size=200")) {
      metricsRequest = key;
      return {
        data: salesMetricsData,
        error: null,
        isLoading: false,
        mutate: vi.fn(),
      };
    }

    if (typeof key === "string" && key.startsWith("sales?")) {
      salesRequest = key;
      return {
        data: salesError ? undefined : salesResponse,
        error: salesError,
        isLoading: salesLoading,
        mutate: vi.fn(),
      };
    }

    return {
      data: undefined,
      error: null,
      isLoading: false,
      mutate: vi.fn(),
    };
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useSalesModel", () => {
  it("carrega vendas e métricas iniciais do mês atual", () => {
    const { result } = renderHook(() => useSalesModel());

    expect(salesRequest).toBe("sales?warehouseId=wh-1&page=0&size=20");
    expect(metricsRequest).toBe(
      "sales?warehouseId=wh-1&page=0&size=200&dateFrom=2026-05-01T00%3A00%3A00&dateTo=2026-05-31T23%3A59%3A59",
    );
    expect(result.current.sales).toHaveLength(1);
    expect(result.current.sales[0].code).toBe("V-001");
    expect(result.current.pagination).toEqual({
      page: 0,
      pageSize: 20,
      totalPages: 1,
      totalElements: 1,
    });
    expect(result.current.salesMetricsData).toEqual(salesMetricsData);
    expect(result.current.salesMetricsTitle).toBe("Vendas do mês atual");
  });

  it("altera página preservando os filtros das métricas", () => {
    const { result } = renderHook(() => useSalesModel());

    act(() => {
      result.current.onPageChange(2);
    });

    expect(result.current.filters.page).toBe(2);
    expect(salesRequest).toBe("sales?warehouseId=wh-1&page=2&size=20");
    expect(metricsRequest).toBe(
      "sales?warehouseId=wh-1&page=0&size=200&dateFrom=2026-05-01T00%3A00%3A00&dateTo=2026-05-31T23%3A59%3A59",
    );
  });

  it("aplica filtro de status também nas métricas", () => {
    const { result } = renderHook(() => useSalesModel());

    act(() => {
      result.current.onPageChange(3);
      result.current.onFilterChange("status", "CANCELLED");
    });

    expect(result.current.filters.page).toBe(0);
    expect(result.current.filters.status).toBe("CANCELLED");
    expect(salesRequest).toBe(
      "sales?warehouseId=wh-1&page=0&size=20&status=CANCELLED",
    );
    expect(metricsRequest).toBe(
      "sales?warehouseId=wh-1&page=0&size=200&status=CANCELLED&dateFrom=2026-05-01T00%3A00%3A00&dateTo=2026-05-31T23%3A59%3A59",
    );
  });

  it("combina vários filtros na URL de listagem e métricas", () => {
    const { result } = renderHook(() => useSalesModel());

    act(() => {
      result.current.onFilterChange("paymentMethod", "PIX");
      result.current.onDateInputChange("dateFrom", "2026-05-10");
      result.current.onDateInputChange("dateTo", "2026-05-12");
    });

    expect(salesRequest).toBe(
      "sales?warehouseId=wh-1&page=0&size=20&paymentMethod=PIX&dateFrom=2026-05-10T00%3A00%3A00&dateTo=2026-05-12T23%3A59%3A59",
    );
    expect(metricsRequest).toBe(
      "sales?warehouseId=wh-1&page=0&size=200&paymentMethod=PIX&dateFrom=2026-05-10T00%3A00%3A00&dateTo=2026-05-12T23%3A59%3A59",
    );
    expect(result.current.salesMetricsTitle).toBe(
      "Vendas de 10/05/2026 a 12/05/2026",
    );
  });

  it("retorna estado vazio quando não há warehouse selecionado", () => {
    activeWarehouseId = null;

    const { result } = renderHook(() => useSalesModel());

    expect(result.current.sales).toEqual([]);
    expect(result.current.salesMetricsData).toBeNull();
    expect(salesRequest).toBeNull();
    expect(metricsRequest).toBeNull();
    expect(result.current.filters.page).toBe(0);
  });

  it("propaga erro do carregamento de vendas", () => {
    salesError = new Error("Falha no backend");

    const { result } = renderHook(() => useSalesModel());

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Falha no backend");
    expect(result.current.sales).toEqual([]);
    expect(result.current.pagination).toEqual({
      page: 0,
      pageSize: 20,
      totalPages: 0,
      totalElements: 0,
    });
  });

  it("o fetcher de métricas carrega páginas extras e agrega tudo", async () => {
    const firstPage = buildSalesResponse([buildSaleSummary()], 2, 0, 200);
    const secondPage = buildSalesResponse(
      [buildSaleSummary({ id: "s2", total: 5000 })],
      2,
      1,
      200,
    );

    mockApiGet.mockImplementation((url: string) => {
      if (url.includes("page=1")) return toJsonResponse(secondPage);
      return toJsonResponse(firstPage);
    });

    renderHook(() => useSalesModel());

    const metricsCall = mockSWR.mock.calls.find(
      ([key]) => typeof key === "string" && key.includes("size=200"),
    );
    const fetcher = metricsCall?.[1] as (url: string) => Promise<SalesMetricsData>;
    const response = await fetcher(metricsRequest ?? "");

    expect(mockApiGet).toHaveBeenCalledWith(metricsRequest);
    expect(mockApiGet).toHaveBeenCalledWith(
      "sales?warehouseId=wh-1&page=1&size=200&dateFrom=2026-05-01T00%3A00%3A00&dateTo=2026-05-31T23%3A59%3A59",
    );
    expect(response.kpiSummary).toEqual({
      count: 2,
      revenue: 20000,
      avgTicket: 10000,
    });
  });
});

describe("sales metrics helpers", () => {
  it("resolve o mês atual quando não existe filtro de data", () => {
    const range = resolveSalesMetricsDateRange(buildDefaultFilters());

    expect(range).toEqual(buildCurrentMonthRange());
    expect(buildSalesMetricsTitle(range)).toBe("Vendas do mês atual");
  });

  it("resolve período customizado e normaliza datas invertidas", () => {
    const filters: SaleFilters = {
      ...buildDefaultFilters(),
      datePreset: "CUSTOM",
      dateFrom: "2026-05-12",
      dateTo: "2026-05-10",
    };
    const range = resolveSalesMetricsDateRange(filters);

    expect(range).toEqual({
      dateFrom: "2026-05-10",
      dateTo: "2026-05-12",
      isDefaultCurrentMonth: false,
    });
    expect(buildSalesMetricsTitle(range)).toBe(
      "Vendas de 10/05/2026 a 12/05/2026",
    );
  });

  it("agrega KPIs e gráfico diário com a mesma janela", () => {
    const metrics = buildSalesMetricsData(
      [
        buildSaleSummary({ id: "s1", total: 10000 }),
        buildSaleSummary({
          id: "s2",
          total: 5000,
          createdAt: "2026-05-13T10:00:00",
        }),
      ],
      {
        dateFrom: "2026-05-12",
        dateTo: "2026-05-13",
        isDefaultCurrentMonth: false,
      },
    );

    expect(metrics.kpiSummary).toEqual({
      count: 2,
      revenue: 15000,
      avgTicket: 7500,
    });
    expect(metrics.dailyChart).toEqual([
      { date: "2026-05-12", count: 1, revenue: 10000 },
      { date: "2026-05-13", count: 1, revenue: 5000 },
    ]);
  });
});
