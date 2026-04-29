import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTransfersModel } from "./transfers.model";
import { TransferStatus, type Transfer, type TransfersPageResponse } from "./transfers.types";

type SwrState<T> = {
  data?: T;
  error: Error | null;
  isLoading: boolean;
  mutate: () => void;
};

const fakeSWR = vi.hoisted(() => {
  class FakeSWR {
    private readonly responses = new Map<string | null, SwrState<unknown>>();
    private readonly defaultState: SwrState<unknown> = {
      data: undefined,
      error: null,
      isLoading: false,
      mutate: vi.fn(),
    };

    public readonly hook = vi.fn<
      (key: string | null, _fetcher?: unknown) => SwrState<unknown>
    >((key) => this.responses.get(key) ?? this.defaultState);

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

const fakeRouter = vi.hoisted(() => {
  class FakeRouter {
    public readonly push = vi.fn<(url: string) => void>();
  }

  return new FakeRouter();
});

const fakeSelectedWarehouse = vi.hoisted(() => {
  class FakeSelectedWarehouse {
    public warehouseId: string | null = "warehouse-1";
  }

  return new FakeSelectedWarehouse();
});

vi.mock("swr", () => ({
  default: (...args: Parameters<typeof fakeSWR.hook>) => fakeSWR.hook(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: (...args: Parameters<typeof fakeRouter.push>) =>
      fakeRouter.push(...args),
  }),
}));

vi.mock("@/hooks/use-selected-warehouse", () => ({
  useSelectedWarehouse: () => ({
    warehouseId: fakeSelectedWarehouse.warehouseId,
  }),
}));

const responseBase = {
  success: true as const,
  message: "ok",
};

const transfers: Transfer[] = [
  {
    id: "transfer-1",
    code: "TR-001",
    sourceWarehouseId: "warehouse-1",
    sourceWarehouseName: "Almoxarifado Origem",
    destinationWarehouseId: "warehouse-2",
    destinationWarehouseName: "Loja Norte",
    status: TransferStatus.IN_TRANSIT,
    items: [
      {
        id: "item-1",
        sourceBatchId: "batch-1",
        quantity: 8,
        productName: "Açúcar",
      },
    ],
    createdAt: "2026-04-10T10:00:00.000Z",
  },
  {
    id: "transfer-2",
    sourceWarehouseId: "warehouse-3",
    sourceWarehouseName: "Depósito Leste",
    destinationWarehouseId: "warehouse-1",
    destinationWarehouseName: "Almoxarifado Origem",
    code: "TR-002",
    status: TransferStatus.DRAFT,
    items: [
      {
        id: "item-2",
        sourceBatchId: "batch-2",
        quantity: 3,
        productName: "Arroz",
      },
    ],
    createdAt: "2026-04-11T09:00:00.000Z",
  },
  {
    id: "transfer-3",
    sourceWarehouseId: "warehouse-1",
    sourceWarehouseName: "Almoxarifado Origem",
    destinationWarehouseId: "warehouse-4",
    destinationWarehouseName: "Loja Sul",
    code: "TR-003",
    status: TransferStatus.PENDING_VALIDATION,
    items: [
      {
        id: "item-3",
        sourceBatchId: "batch-3",
        quantity: 6,
        productName: "Feijão",
      },
    ],
    createdAt: "2026-04-09T08:00:00.000Z",
  },
  {
    id: "transfer-4",
    sourceWarehouseId: "warehouse-1",
    sourceWarehouseName: "Almoxarifado Origem",
    destinationWarehouseId: "warehouse-5",
    destinationWarehouseName: "Loja Este",
    code: "TR-004",
    status: TransferStatus.COMPLETED,
    items: [
      {
        id: "item-4",
        sourceBatchId: "batch-4",
        quantity: 4,
        productName: "Café",
      },
    ],
    createdAt: "2026-04-11T11:00:00.000Z",
  },
];

const responseWithTransfers: TransfersPageResponse = {
  ...responseBase,
  data: {
    content: transfers,
    totalElements: 4,
    totalPages: 1,
    number: 0,
    size: 20,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  fakeSWR.reset();
  fakeSelectedWarehouse.warehouseId = "warehouse-1";
  fakeRouter.push.mockClear();

  fakeSWR.setState("transfers", {
    data: responseWithTransfers,
    error: null,
    isLoading: false,
    mutate: vi.fn(),
  });
});

describe("useTransfersModel", () => {
  it("retorna filtros e estatísticas de envios quando ativo tab outgoing", () => {
    const { result } = renderHook(() => useTransfersModel());

    expect(fakeSWR.hook).toHaveBeenCalledWith("transfers", expect.any(Function));
    expect(result.current.activeTab).toBe("outgoing");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.transfers.map((item) => item.id)).toEqual([
      "transfer-4",
      "transfer-1",
      "transfer-3",
    ]);
    expect(result.current.stats).toEqual({
      total: 3,
      inTransit: 1,
      pending: 1,
      completed: 1,
    });
  });

  it("alterna para aba incoming e atualiza estatísticas", () => {
    const { result } = renderHook(() => useTransfersModel());

    act(() => {
      result.current.onTabChange("incoming");
    });

    expect(result.current.activeTab).toBe("incoming");
    expect(result.current.transfers.map((item) => item.id)).toEqual(["transfer-2"]);
    expect(result.current.stats).toEqual({
      total: 1,
      inTransit: 0,
      pending: 1,
      completed: 0,
    });
  });

  it("retorna listas vazias e zeradas quando sem warehouse", () => {
    fakeSelectedWarehouse.warehouseId = null;
    const { result } = renderHook(() => useTransfersModel());

    expect(fakeSWR.hook).toHaveBeenCalledWith(null, expect.any(Function));
    expect(result.current.transfers).toEqual([]);
    expect(result.current.stats).toEqual({
      total: 0,
      inTransit: 0,
      pending: 0,
      completed: 0,
    });
    expect(result.current.error).toBeNull();
  });

  it("dispara revalidação da query e navega para o formulário", () => {
    const mutate = vi.fn();
    const withMutate = {
      ...responseWithTransfers,
      message: "updated",
    };
    fakeSWR.setState("transfers", {
      data: withMutate,
      error: null,
      isLoading: false,
      mutate,
    });

    const { result } = renderHook(() => useTransfersModel());
    act(() => {
      result.current.onRetry();
      result.current.onNewTransfer();
    });

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(fakeRouter.push).toHaveBeenCalledWith("/transfers/new");
  });
});
