import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDashboardModel } from "./dashboard.model";
import type { DashboardData, DashboardResponse } from "./dashboard.types";

const mockSWR = vi.fn();
const mockMutate = vi.fn();
const mockApiGet = vi.fn();
const toastError = vi.fn();

const dashboardData: DashboardData = {
  totalProducts: 120,
  activeProducts: 80,
  totalWarehouses: 5,
  activeWarehouses: 4,
  totalBatches: 240,
  totalStockValue: 7800,
  lowStockCount: 7,
  expiringCount: 3,
  recentMovements: [
    {
      id: "m-1",
      movementType: "ENTRY",
      status: "CONCLUDED",
      createdAt: "2026-04-01T10:00:00Z",
      productCount: 10,
      notes: "Entrada inicial",
    },
  ],
  stockByWarehouse: [
    {
      warehouseId: "w-1",
      warehouseName: "Depósito Principal",
      batchCount: 50,
      stockValue: 5000,
      productCount: 40,
    },
  ],
  stockByCategory: [
    {
      categoryId: "c-1",
      categoryName: "Eletrônicos",
      batchCount: 12,
      stockValue: 2800,
      productCount: 15,
    },
  ],
  movementStats: {
    today: {
      entries: 2,
      exits: 1,
      transfers: 0,
      adjustments: 0,
    },
    thisWeek: {
      entries: 15,
      exits: 10,
      transfers: 3,
      adjustments: 1,
    },
    thisMonth: {
      entries: 70,
      exits: 40,
      transfers: 6,
      adjustments: 2,
    },
  },
};

const dashboardResponse: DashboardResponse = {
  success: true,
  message: null,
  data: dashboardData,
};

vi.mock("swr", () => ({
  default: (...args: unknown[]) => mockSWR(...args),
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: (...args: unknown[]) => mockApiGet(...args),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastError(...args),
  },
}));

const toJsonResponse = <T,>(value: T) => ({
  json: vi.fn(async () => value),
});

beforeEach(() => {
  vi.clearAllMocks();

  mockSWR.mockImplementation((_key: string, _fetcher: unknown, options: unknown) => {
    void _fetcher;
    void options;
    return {
      data: dashboardResponse,
      error: null,
      isLoading: false,
      mutate: mockMutate,
    };
  });

  mockApiGet.mockReturnValue(toJsonResponse(dashboardResponse));
});

describe("useDashboardModel", () => {
  it("configura SWR com chave, fetcher e opções esperadas", () => {
    renderHook(() => useDashboardModel());

    expect(mockSWR).toHaveBeenCalledWith(
      "reports/dashboard",
      expect.any(Function),
      expect.objectContaining({
        revalidateOnFocus: false,
        dedupingInterval: 300000,
      }),
    );
  });

  it("retorna dados do dashboard em sucesso", () => {
    const { result } = renderHook(() => useDashboardModel());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual(dashboardData);
    expect(result.current.error).toBeNull();
  });

  it("propaga erro vindo do SWR", () => {
    const dashboardError = new Error("Falha no dashboard");

    mockSWR.mockImplementation(() => ({
      data: undefined,
      error: dashboardError,
      isLoading: false,
      mutate: mockMutate,
    }));

    const { result } = renderHook(() => useDashboardModel());

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBe(dashboardError);
    expect(result.current.isLoading).toBe(false);
  });

  it("mantém erro nulo enquanto carrega inicialmente", () => {
    mockSWR.mockImplementation(() => ({
      data: undefined,
      error: null,
      isLoading: true,
      mutate: mockMutate,
    }));

    const { result } = renderHook(() => useDashboardModel());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it("executa onRetry chamando mutate", () => {
    const { result } = renderHook(() => useDashboardModel());

    act(() => {
      result.current.onRetry();
    });

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledWith();
  });

  it("executa fetcher de dashboard e repassa endpoint correto", async () => {
    const { result } = renderHook(() => useDashboardModel());

    const fetcher = mockSWR.mock.calls[0]?.[1] as (url: string) => Promise<DashboardResponse>;
    const response = await fetcher("reports/dashboard");

    expect(mockApiGet).toHaveBeenCalledWith("reports/dashboard");
    expect(response).toEqual(dashboardResponse);
    expect(result.current.data).toEqual(dashboardData);
  });

  it("captura erro do endpoint, registra toast e relança erro", async () => {
    const endpointError = new Error("Erro de rede");

    mockApiGet.mockReturnValue({
      json: vi.fn(async () => {
        throw endpointError;
      }),
    });

    renderHook(() => useDashboardModel());
    const fetcher = mockSWR.mock.calls[0]?.[1] as (url: string) => Promise<DashboardResponse>;

    await expect(fetcher("reports/dashboard")).rejects.toBe(endpointError);
    expect(toastError).toHaveBeenCalledWith("Erro ao carregar dashboard");
  });
});
