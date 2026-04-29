import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSalesModel } from "./sales.model";
import { SalesResponse, SalesDashboardResponse } from "./sales.types";

const mockSWR = vi.fn();

let activeWarehouseId: string | null = "wh-1";
let salesRequest: string | null = null;
let dashboardRequest: string | null = null;
let salesResponse: SalesResponse | undefined = {
  success: true,
  message: "ok",
  data: {
    content: [
      {
        id: "s1",
        code: "V-001",
        warehouseId: "wh-1",
        warehouseName: "CD Central",
        paymentMethod: "PIX",
        total: 15000,
        status: "COMPLETED",
        createdAt: "2026-01-01T10:00:00Z",
        createdByUserName: "Maria",
      },
      {
        id: "s2",
        code: "V-002",
        warehouseId: "wh-1",
        warehouseName: "CD Central",
        paymentMethod: "CASH",
        total: 4200,
        status: "PENDING",
        createdAt: "2026-01-01T09:00:00Z",
        createdByUserName: "João",
      },
    ],
    totalElements: 2,
    totalPages: 1,
    number: 0,
    size: 20,
    empty: false,
  },
};
let salesLoading = false;
let salesError: Error | null = null;

let dashboardResponse: SalesDashboardResponse = {
  success: true,
  message: "",
  data: {
    kpis: {
      today: { count: 5, revenue: 25000, avgTicket: 5000 },
      week: { count: 20, revenue: 120000, avgTicket: 6000 },
      month: { count: 90, revenue: 450000, avgTicket: 5000 },
    },
    dailyChart: [
      { date: "2026-01-01", count: 3, revenue: 15000 },
      { date: "2026-01-02", count: 2, revenue: 10000 },
    ],
  },
};

vi.mock("@/hooks/use-selected-warehouse", () => ({
  useSelectedWarehouse: () => ({
    warehouseId: activeWarehouseId,
    setWarehouseId: vi.fn(),
  }),
}));

vi.mock("swr", () => ({
  default: (...args: unknown[]) => mockSWR(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  activeWarehouseId = "wh-1";
  salesRequest = null;
  dashboardRequest = null;
  salesLoading = false;
  salesError = null;

  salesResponse = {
    success: true,
    message: "ok",
    data: {
      content: [
        {
          id: "s1",
          code: "V-001",
          warehouseId: "wh-1",
          warehouseName: "CD Central",
          paymentMethod: "PIX",
          total: 15000,
          status: "COMPLETED",
          createdAt: "2026-01-01T10:00:00Z",
          createdByUserName: "Maria",
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
      empty: false,
    },
  };
});

mockSWR.mockImplementation((key: unknown) => {
  if (typeof key === "string" && key.startsWith("sales?")) {
    salesRequest = key;
    return {
      data: salesError ? undefined : salesResponse,
      error: salesError,
      isLoading: salesLoading,
      mutate: vi.fn(),
    };
  }

  if (typeof key === "string" && key.startsWith("sales/dashboard?")) {
    dashboardRequest = key;
    return {
      data: dashboardResponse,
      isLoading: false,
      error: null,
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

describe("useSalesModel", () => {
  it("carrega vendas e dashboard iniciais", () => {
    const { result } = renderHook(() => useSalesModel());

    expect(salesRequest).toBe("sales?warehouseId=wh-1&page=0&size=20");
    expect(dashboardRequest).toBe("sales/dashboard?warehouseId=wh-1");
    expect(result.current.sales).toHaveLength(1);
    expect(result.current.sales[0].code).toBe("V-001");
    expect(result.current.pagination).toEqual({
      page: 0,
      pageSize: 20,
      totalPages: 1,
      totalElements: 1,
    });
    expect(result.current.dashboardData).toEqual(dashboardResponse.data);
    expect(result.current.isLoading).toBe(false);
  });

  it("altera página preservando filtros atuais", () => {
    const { result } = renderHook(() => useSalesModel());

    act(() => {
      result.current.onPageChange(2);
    });

    expect(result.current.filters.page).toBe(2);
    expect(salesRequest).toBe("sales?warehouseId=wh-1&page=2&size=20");
  });

  it("aplica filtro e reseta página para zero", () => {
    const { result } = renderHook(() => useSalesModel());

    act(() => {
      result.current.onPageChange(3);
      result.current.onFilterChange("status", "CANCELLED");
    });

    expect(result.current.filters.page).toBe(0);
    expect(result.current.filters.status).toBe("CANCELLED");
    expect(salesRequest).toBe(
      "sales?warehouseId=wh-1&page=0&size=20&status=CANCELLED"
    );
  });

  it("combina vários filtros na URL", () => {
    const { result } = renderHook(() => useSalesModel());

    act(() => {
      result.current.onFilterChange("paymentMethod", "PIX");
      result.current.onFilterChange("dateFrom", "2026-01-01");
      result.current.onFilterChange("dateTo", "2026-01-31");
    });

    expect(salesRequest).toBe(
      "sales?warehouseId=wh-1&page=0&size=20&paymentMethod=PIX&dateFrom=2026-01-01&dateTo=2026-01-31"
    );
  });

  it("retorna estado vazio quando não há warehouse selecionado", () => {
    activeWarehouseId = null;

    const { result } = renderHook(() => useSalesModel());

    expect(result.current.sales).toEqual([]);
    expect(result.current.dashboardData).toBeNull();
    expect(salesRequest).toBeNull();
    expect(dashboardRequest).toBeNull();
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
});
