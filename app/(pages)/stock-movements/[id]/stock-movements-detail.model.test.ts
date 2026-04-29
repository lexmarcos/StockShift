import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStockMovementDetailModel } from "./stock-movements-detail.model";
import type { BatchPriceInfo, StockMovementDetailResponse } from "./stock-movements-detail.types";

type SwrState<T> = {
  data?: T;
  error: Error | null;
  isLoading: boolean;
  mutate: () => void;
};

type SwrCall = { key: string | null; url: string };

const fakeSWR = vi.hoisted(() => {
  class FakeSWR {
    private readonly responses = new Map<string | null, SwrState<unknown>>();
    private readonly defaultState: SwrState<unknown> = {
      data: undefined,
      error: null,
      isLoading: false,
      mutate: vi.fn(),
    };

    public readonly hook = vi.fn(
      (key: string | null, _fetcher?: unknown): SwrState<unknown> =>
        this.responses.get(key) ?? this.defaultState,
    );

    public setState<T>(key: string | null, state: SwrState<T>): void {
      this.responses.set(key, state as SwrState<unknown>);
    }

    public reset(): void {
      this.responses.clear();
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

const fakeBreadcrumb = vi.hoisted(() => {
  class FakeBreadcrumb {
    public readonly useBreadcrumb = vi.fn<
      (payload: { title: string; backUrl: string }) => void
    >();
  }

  return new FakeBreadcrumb();
});

vi.mock("swr", () => ({
  default: (...args: unknown[]) => fakeSWR.hook(...args),
}));

vi.mock("@/lib/api", () => ({
  api: fakeApi,
}));

vi.mock("@/components/breadcrumb", () => ({
  useBreadcrumb: (...args: Parameters<typeof fakeBreadcrumb.useBreadcrumb>) => {
    return fakeBreadcrumb.useBreadcrumb(...args);
  },
}));

const movementDetailResponse: StockMovementDetailResponse = {
  success: true,
  message: "ok",
  data: {
    id: "mv-100",
    code: "MV-100",
    warehouseId: "wh-1",
    warehouseName: "Depósito",
    type: "PURCHASE_IN",
    direction: "IN",
    notes: null,
    createdByUserId: "user-1",
    referenceType: null,
    referenceId: null,
    createdAt: "2026-04-01T10:00:00.000Z",
    updatedAt: "2026-04-01T10:00:00.000Z",
    items: [
      {
        id: "it-1",
        productId: "prod-1",
        productName: "Café",
        productSku: "CAF-01",
        batchId: "batch-1",
        batchCode: "B-01",
        quantity: 2,
        productImageUrl: null,
      },
      {
        id: "it-2",
        productId: "prod-1",
        productName: "Café",
        productSku: "CAF-01",
        batchId: "batch-2",
        batchCode: "B-02",
        quantity: 1,
        productImageUrl: null,
      },
      {
        id: "it-3",
        productId: "prod-2",
        productName: "Açúcar",
        productSku: "ACU-01",
        batchId: "batch-2",
        batchCode: "B-02",
        quantity: 5,
        productImageUrl: null,
      },
    ],
  },
};

const movementBatchPrices: BatchPriceInfo[] = [
  { batchId: "batch-1", costPrice: 3.5, sellingPrice: 5.5 },
  { batchId: "batch-2", costPrice: null, sellingPrice: 9.9 },
];

const movementProductImages = new Map<string, string | null>([
  ["prod-1", "https://cdn.example.com/cafe.png"],
  ["prod-2", "https://cdn.example.com/acucar.png"],
]);

beforeEach(() => {
  vi.clearAllMocks();
  fakeSWR.reset();
  fakeApi.get.mockReset();
  fakeBreadcrumb.useBreadcrumb.mockClear();
  fakeApi.get.mockResolvedValue({
    json: vi.fn(async () => undefined),
  });
});

describe("useStockMovementDetailModel", () => {
  it("quando sem id, não consulta SWR", () => {
    const { result } = renderHook(() => useStockMovementDetailModel(""));

    expect(result.current.movement).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.batchPrices).toEqual([]);
    expect(fakeSWR.hook).toHaveBeenNthCalledWith(
      1,
      null,
      expect.any(Function),
    );
    expect(fakeSWR.hook).toHaveBeenNthCalledWith(
      2,
      null,
      expect.any(Function),
    );
    expect(fakeSWR.hook).toHaveBeenNthCalledWith(
      3,
      null,
      expect.any(Function),
    );
  });

  it("carrega movimento, preços e imagens e aplica imagem ao item", () => {
    fakeSWR.setState(`stock-movements/mv-100`, {
      data: movementDetailResponse,
      error: null,
      isLoading: false,
      mutate: vi.fn(),
    });
    fakeSWR.setState("batches-prices-mv-100", {
      data: movementBatchPrices,
      error: null,
      isLoading: false,
      mutate: vi.fn(),
    });
    fakeSWR.setState("product-images-mv-100", {
      data: movementProductImages,
      error: null,
      isLoading: false,
      mutate: vi.fn(),
    });

    const { result } = renderHook(() => useStockMovementDetailModel("mv-100"));

    expect(result.current.movement?.code).toBe("MV-100");
    expect(result.current.batchPrices).toEqual(movementBatchPrices);
    expect(result.current.movement?.items[0].productImageUrl).toBe(
      "https://cdn.example.com/cafe.png",
    );
    expect(result.current.movement?.items[2].productImageUrl).toBe(
      "https://cdn.example.com/acucar.png",
    );
    expect(fakeBreadcrumb.useBreadcrumb).toHaveBeenCalledWith({
      title: "MV-100",
      backUrl: "/stock-movements",
    });
  });

  it("propaga erro da requisição de detalhe", () => {
    const error = new Error("Falhou ao carregar movimento");

    fakeSWR.setState(`stock-movements/mv-100`, {
      data: undefined,
      error,
      isLoading: false,
      mutate: vi.fn(),
    });

    const { result } = renderHook(() => useStockMovementDetailModel("mv-100"));

    expect(result.current.error).toBe(error);
    expect(result.current.movement).toBeNull();
  });

  it("mantém estado de loading quando movimento ainda não respondeu", () => {
    fakeSWR.setState(`stock-movements/mv-100`, {
      data: undefined,
      error: null,
      isLoading: true,
      mutate: vi.fn(),
    });

    const { result } = renderHook(() => useStockMovementDetailModel("mv-100"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.movement).toBeNull();
  });

  it("não busca preços/imagens quando não há itens no movimento", () => {
    fakeSWR.setState(`stock-movements/mv-empty`, {
      data: {
        success: true,
        message: "ok",
        data: {
          ...movementDetailResponse.data,
          id: "mv-empty",
          code: "MV-EMPTY",
          items: [],
        },
      },
      error: null,
      isLoading: false,
      mutate: vi.fn(),
    });

    const { result } = renderHook(() =>
      useStockMovementDetailModel("mv-empty"),
    );

    expect(result.current.movement?.items).toEqual([]);
    const calledKeys = fakeSWR.hook.mock.calls.map(
      (call) => call[0] as string | null,
    );
    expect(calledKeys).toEqual([
      "stock-movements/mv-empty",
      null,
      null,
    ]);
  });
});
