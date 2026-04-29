import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStockMovementsModel } from "./stock-movements.model";
import type { StockMovementsResponse } from "./stock-movements.types";

type SwrState<T> = {
  data?: T;
  error: Error | null;
  isLoading: boolean;
  mutate: () => void;
};

const fakeSWR = vi.hoisted(() => {
  class FakeSWR {
    private readonly states = new Map<string | null, SwrState<unknown>>();
    private readonly defaultState: SwrState<unknown> = {
      data: undefined,
      error: null,
      isLoading: false,
      mutate: vi.fn(),
    };

    public readonly hook = vi.fn(
      (key: string | null, _fetcher?: unknown): SwrState<unknown> =>
        this.states.get(key) ?? this.defaultState,
    );

    public setState<T>(key: string | null, state: SwrState<T>): void {
      this.states.set(key, state as SwrState<unknown>);
    }

    public reset(): void {
      this.states.clear();
      this.defaultState.mutate.mockClear();
      this.hook.mockClear();
    }
  }

  return new FakeSWR();
});

const fakeApi = vi.hoisted(() => {
  class FakeApi {
    public readonly get = vi.fn<(url: string) => Promise<{ json: () => Promise<unknown> }>>();
  }

  return new FakeApi();
});

const fakeToast = vi.hoisted(() => {
  class FakeToast {
    public readonly error = vi.fn<(message: string) => void>();
  }

  return new FakeToast();
});

const fakeWarehouse = vi.hoisted(() => {
  class FakeWarehouse {
    public warehouseId: string | null = "wh-1";
  }

  return new FakeWarehouse();
});

vi.mock("swr", () => ({
  default: (...args: unknown[]) => fakeSWR.hook(...args),
}));

vi.mock("@/lib/api", () => ({
  api: fakeApi,
}));

vi.mock("sonner", () => ({
  toast: fakeToast,
}));

vi.mock("@/hooks/use-selected-warehouse", () => ({
  useSelectedWarehouse: () => ({
    warehouseId: fakeWarehouse.warehouseId,
  }),
}));

const baseStockMovementsResponse: StockMovementsResponse = {
  success: true,
  message: "ok",
  data: {
    content: [
      {
        id: "sm-1",
        code: "SM-001",
        warehouseId: "wh-1",
        warehouseName: "Depósito A",
        type: "PURCHASE_IN",
        direction: "IN",
        notes: "Entrada inicial",
        createdByUserId: "user-1",
        referenceType: null,
        referenceId: null,
        createdAt: "2026-04-01T10:00:00.000Z",
        updatedAt: "2026-04-01T10:00:00.000Z",
        items: [],
      },
      {
        id: "sm-2",
        code: "SM-002",
        warehouseId: "wh-1",
        warehouseName: "Depósito A",
        type: "SALE",
        direction: "OUT",
        notes: "Saída",
        createdByUserId: "user-2",
        referenceType: "ORDER",
        referenceId: "ord-100",
        createdAt: "2026-04-01T11:00:00.000Z",
        updatedAt: "2026-04-01T11:00:00.000Z",
        items: [],
      },
    ],
    pageable: {
      pageNumber: 0,
      pageSize: 20,
      sort: ["createdAt,desc"],
      offset: 0,
      unpaged: false,
      paged: true,
    },
    totalElements: 2,
    totalPages: 1,
    number: 0,
    size: 20,
    empty: false,
  },
};

const defaultStockMovementUrl =
  "stock-movements?warehouseId=wh-1&page=0&size=20&sort=createdAt%2Cdesc";

beforeEach(() => {
  vi.clearAllMocks();
  fakeWarehouse.warehouseId = "wh-1";
  fakeSWR.reset();
  fakeApi.get.mockResolvedValue({
    json: vi.fn(async () => baseStockMovementsResponse),
  });
  fakeToast.error.mockClear();

  fakeSWR.setState(defaultStockMovementUrl, {
    data: baseStockMovementsResponse,
    error: null,
    isLoading: false,
    mutate: vi.fn(),
  });
});

describe("useStockMovementsModel", () => {
  it("monta URL padrão e retorna paginação inicial", () => {
    const { result } = renderHook(() => useStockMovementsModel());

    expect(fakeSWR.hook).toHaveBeenCalledWith(
      defaultStockMovementUrl,
      expect.any(Function),
    );
    expect(result.current.filters).toEqual({
      type: "ALL",
      datePreset: "ALL",
      dateFrom: undefined,
      dateTo: undefined,
      sortBy: "createdAt",
      sortOrder: "desc",
      page: 0,
      pageSize: 20,
    });
    expect(result.current.pagination).toEqual({
      page: 0,
      pageSize: 20,
      totalPages: 1,
      totalElements: 2,
    });
    expect(result.current.movements).toHaveLength(2);
    expect(result.current.movements[0].code).toBe("SM-001");
  });

  it("atualiza página sem carregar dados ausentes", () => {
    fakeSWR.setState(
      "stock-movements?warehouseId=wh-1&page=2&size=20&sort=createdAt%2Cdesc",
      {
        data: undefined,
        error: null,
        isLoading: true,
        mutate: vi.fn(),
      },
    );

    const { result } = renderHook(() => useStockMovementsModel());

    act(() => {
      result.current.onPageChange(2);
    });

    expect(result.current.filters.page).toBe(2);
    expect(result.current.pagination).toEqual({
      page: 0,
      pageSize: 20,
      totalPages: 0,
      totalElements: 0,
    });
    expect(result.current.movements).toEqual([]);
    expect(fakeSWR.hook).toHaveBeenCalledWith(
      "stock-movements?warehouseId=wh-1&page=2&size=20&sort=createdAt%2Cdesc",
      expect.any(Function),
    );
  });

  it("muda página, tamanho e reseta página para filtros", () => {
    fakeSWR.setState(
      "stock-movements?warehouseId=wh-1&page=2&size=20&sort=createdAt%2Cdesc",
      {
        data: baseStockMovementsResponse,
        error: null,
        isLoading: false,
        mutate: vi.fn(),
      },
    );
    fakeSWR.setState(
      "stock-movements?warehouseId=wh-1&page=0&size=50&sort=createdAt%2Cdesc",
      {
        data: baseStockMovementsResponse,
        error: null,
        isLoading: false,
        mutate: vi.fn(),
      },
    );
    fakeSWR.setState(
      "stock-movements?warehouseId=wh-1&page=0&size=50&sort=code%2Casc",
      {
        data: baseStockMovementsResponse,
        error: null,
        isLoading: false,
        mutate: vi.fn(),
      },
    );
    fakeSWR.setState(
      "stock-movements?warehouseId=wh-1&page=0&size=50&sort=code%2Casc&type=SALE&dateFrom=2026-04-01&dateTo=2026-04-10",
      {
        data: baseStockMovementsResponse,
        error: null,
        isLoading: false,
        mutate: vi.fn(),
      },
    );

    const { result } = renderHook(() => useStockMovementsModel());

    act(() => {
      result.current.onPageChange(2);
      result.current.onPageSizeChange(50);
      result.current.onSortChange("code", "asc");
      result.current.onFilterChange("type", "SALE");
      result.current.onFilterChange("dateFrom", "2026-04-01");
      result.current.onFilterChange("dateTo", "2026-04-10");
    });

    expect(result.current.filters).toEqual({
      type: "SALE",
      datePreset: "ALL",
      sortBy: "code",
      sortOrder: "asc",
      page: 0,
      pageSize: 50,
      dateFrom: "2026-04-01",
      dateTo: "2026-04-10",
    });
    expect(fakeSWR.hook).toHaveBeenLastCalledWith(
      "stock-movements?warehouseId=wh-1&page=0&size=50&sort=code%2Casc&type=SALE&dateFrom=2026-04-01T00%3A00%3A00&dateTo=2026-04-10T23%3A59%3A59",
      expect.any(Function),
    );
  });

  it("ignora URL principal se warehouse não estiver selecionado", () => {
    fakeWarehouse.warehouseId = null;

    const { result } = renderHook(() => useStockMovementsModel());

    expect(result.current.movements).toEqual([]);
    expect(result.current.pagination).toEqual({
      page: 0,
      pageSize: 20,
      totalPages: 0,
      totalElements: 0,
    });
    expect(fakeSWR.hook).toHaveBeenCalledWith(null, expect.any(Function));
    expect(fakeToast.error).not.toHaveBeenCalled();
  });

  it("propaga erro do SWR para o modelo", () => {
    const loadError = new Error("Falha no backend");

    fakeSWR.setState(defaultStockMovementUrl, {
      data: undefined,
      error: loadError,
      isLoading: false,
      mutate: vi.fn(),
    });

    const { result } = renderHook(() => useStockMovementsModel());

    expect(result.current.error).toBe(loadError);
    expect(result.current.movements).toEqual([]);
  });
});
