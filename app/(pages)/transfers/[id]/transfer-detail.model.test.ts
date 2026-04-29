import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTransferDetailModel } from "./transfer-detail.model";
import { TransferStatus, type Transfer, type TransferDetailResponse } from "../transfers.types";

type SwrState<T> = {
  data?: T;
  error: Error | null;
  isLoading: boolean;
  mutate: () => Promise<T | undefined> | T | undefined;
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

const fakeApi = vi.hoisted(() => {
  class FakeApi {
    public readonly post = vi.fn<
      (url: string, _options?: { json?: unknown }) => { json: () => Promise<unknown> }
    >();
    public readonly delete = vi.fn<(url: string) => { json: () => Promise<unknown> }>();
  }

  return new FakeApi();
});

const fakeRouter = vi.hoisted(() => {
  class FakeRouter {
    public readonly push = vi.fn<(url: string) => void>();
  }

  return new FakeRouter();
});

const fakeToast = vi.hoisted(() => {
  class FakeToast {
    public readonly success = vi.fn<(message: string) => void>();
    public readonly error = vi.fn<(message: string) => void>();
    public readonly info = vi.fn<(message: string) => void>();
  }

  return new FakeToast();
});

const fakeSelectedWarehouse = vi.hoisted(() => {
  class FakeSelectedWarehouse {
    public warehouseId: string = "warehouse-source";
  }

  return new FakeSelectedWarehouse();
});

const fakeBreadcrumb = vi.hoisted(() => {
  class FakeBreadcrumb {
    public readonly useBreadcrumb = vi.fn<
      (payload: {
        title: string;
        backUrl: string;
        section: string;
        subsection: string;
      }) => void
    >();
  }

  return new FakeBreadcrumb();
});

vi.mock("swr", () => ({
  default: (...args: Parameters<typeof fakeSWR.hook>) => fakeSWR.hook(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: (...args: Parameters<typeof fakeRouter.push>) => fakeRouter.push(...args),
  }),
}));

vi.mock("@/lib/api", () => ({
  api: fakeApi,
}));

vi.mock("sonner", () => ({
  toast: fakeToast,
}));

vi.mock("@/hooks/use-selected-warehouse", () => ({
  useSelectedWarehouse: () => ({
    warehouseId: fakeSelectedWarehouse.warehouseId,
  }),
}));

vi.mock("@/components/breadcrumb", () => ({
  useBreadcrumb: (...args: Parameters<typeof fakeBreadcrumb.useBreadcrumb>) =>
    fakeBreadcrumb.useBreadcrumb(...args),
}));

const createJsonResponse = <T>(payload: T): { json: () => Promise<T> } => ({
  json: vi.fn(async () => payload),
});

const baseTransfer: Transfer = {
  id: "transfer-42",
  code: "TR-042",
  sourceWarehouseId: "warehouse-source",
  sourceWarehouseName: "Depósito Base",
  destinationWarehouseId: "warehouse-destination",
  destinationWarehouseName: "Loja Centro",
  status: TransferStatus.DRAFT,
  notes: null,
  items: [],
  createdAt: "2026-01-01T09:00:00.000Z",
};

const transferDetailResponse: TransferDetailResponse = {
  success: true,
  message: "ok",
  data: baseTransfer,
};

const pendingTransferResponse: TransferDetailResponse = {
  success: true,
  message: "ok",
  data: {
    ...baseTransfer,
    status: TransferStatus.PENDING_VALIDATION,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  fakeSWR.reset();
  fakeSelectedWarehouse.warehouseId = "warehouse-source";
  fakeToast.success.mockClear();
  fakeToast.error.mockClear();
  fakeToast.info.mockClear();
  fakeRouter.push.mockClear();
  fakeApi.post.mockReturnValue(createJsonResponse({ success: true }));
  fakeApi.delete.mockReturnValue(createJsonResponse({ success: true }));

  fakeSWR.setState(`transfers/transfer-42`, {
    data: transferDetailResponse,
    error: null,
    isLoading: false,
    mutate: vi.fn(async () => transferDetailResponse),
  });
});

describe("useTransferDetailModel", () => {
  it("mapeia detalhes da transferência e calcula papéis de origem/destino", () => {
    const { result } = renderHook(() => useTransferDetailModel("transfer-42"));

    expect(fakeSWR.hook).toHaveBeenCalledWith(
      "transfers/transfer-42",
      expect.any(Function),
    );
    expect(result.current.transfer).toEqual(baseTransfer);
    expect(result.current.isSource).toBe(true);
    expect(result.current.isDestination).toBe(false);
    expect(fakeBreadcrumb.useBreadcrumb).toHaveBeenCalledWith({
      title: "TR-042",
      backUrl: "/transfers",
      section: "Transferências",
      subsection: "Detalhes",
    });
  });

  it("marca transferência como recebida quando warehouse atual é destino", () => {
    fakeSelectedWarehouse.warehouseId = "warehouse-destination";
    const { result } = renderHook(() => useTransferDetailModel("transfer-42"));

    expect(result.current.isSource).toBe(false);
    expect(result.current.isDestination).toBe(true);
  });

  it("executa transferência com sucesso", async () => {
    const { result } = renderHook(() => useTransferDetailModel("transfer-42"));

    await act(async () => {
      await result.current.onExecute();
    });

    expect(fakeApi.post).toHaveBeenCalledWith("transfers/transfer-42/execute");
    expect(fakeToast.success).toHaveBeenCalledWith("Transferência iniciada com sucesso!");
    expect(result.current.isExecuting).toBe(false);
  });

  it("mostra erro quando falha ao executar", async () => {
    fakeApi.post.mockReturnValue({
      json: vi.fn(async () => {
        throw new Error("Falha ao executar");
      }),
    });

    const { result } = renderHook(() => useTransferDetailModel("transfer-42"));

    await act(async () => {
      await result.current.onExecute();
    });

    expect(fakeToast.error).toHaveBeenCalledWith("Falha ao executar");
    expect(result.current.isExecuting).toBe(false);
  });

  it("cancela transferência com sucesso", async () => {
    const { result } = renderHook(() => useTransferDetailModel("transfer-42"));

    await act(async () => {
      await result.current.onCancel();
    });

    expect(fakeApi.delete).toHaveBeenCalledWith("transfers/transfer-42");
    expect(fakeToast.success).toHaveBeenCalledWith("Transferência cancelada.");
    expect(result.current.isCancelling).toBe(false);
  });

  it("mostra erro quando falha ao cancelar", async () => {
    fakeApi.delete.mockReturnValue({
      json: vi.fn(async () => {
        throw new Error("Falha ao cancelar");
      }),
    });

    const { result } = renderHook(() => useTransferDetailModel("transfer-42"));

    await act(async () => {
      await result.current.onCancel();
    });

    expect(fakeToast.error).toHaveBeenCalledWith("Falha ao cancelar");
    expect(result.current.isCancelling).toBe(false);
  });

  it("inicia validação com sucesso", async () => {
    const { result } = renderHook(() => useTransferDetailModel("transfer-42"));

    await act(async () => {
      await result.current.onStartValidation();
    });

    expect(fakeApi.post).toHaveBeenCalledWith("transfers/transfer-42/start-validation");
    expect(fakeToast.success).toHaveBeenCalledWith("Validação iniciada!");
    expect(fakeRouter.push).toHaveBeenCalledWith("/transfers/transfer-42/validate");
  });

  it("segue para validação se API sinalizar que já estava iniciada", async () => {
    fakeApi.post.mockReturnValue({
      json: vi.fn(async () => {
        throw new Error("Já iniciada");
      }),
    });
    fakeSWR.setState("transfers/transfer-42", {
      data: transferDetailResponse,
      error: null,
      isLoading: false,
      mutate: vi.fn(async () => pendingTransferResponse),
    });

    const { result } = renderHook(() => useTransferDetailModel("transfer-42"));

    await act(async () => {
      await result.current.onStartValidation();
    });

    expect(fakeToast.info).toHaveBeenCalledWith("Validação já iniciada. Continuando...");
    expect(fakeRouter.push).toHaveBeenCalledWith("/transfers/transfer-42/validate");
    expect(fakeToast.error).not.toHaveBeenCalled();
  });

  it("retorna sem ação quando transferId está vazio", async () => {
    const { result } = renderHook(() => useTransferDetailModel(""));

    await act(async () => {
      await result.current.onExecute();
      await result.current.onCancel();
      await result.current.onStartValidation();
    });

    expect(fakeApi.post).not.toHaveBeenCalled();
    expect(fakeApi.delete).not.toHaveBeenCalled();
  });
});
