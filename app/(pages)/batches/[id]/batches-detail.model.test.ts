import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBatchDetailModel } from "./batches-detail.model";
import type { Batch } from "../batches.types";

type JsonResponse<T> = {
  json: () => Promise<T>;
};

type SwrState<T> = {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  mutate: ReturnType<typeof vi.fn>;
};

const createJsonResponse = <T,>(payload: T): JsonResponse<T> => ({
  json: vi.fn(async () => payload),
});

const fakeApi = vi.hoisted(() => {
  class FakeBatchApi {
    public readonly get = vi.fn<(url: string) => JsonResponse<unknown>>();
    public readonly delete = vi.fn<(url: string) => JsonResponse<unknown>>();
  }

  return new FakeBatchApi();
});

const fakeRouter = vi.hoisted(() => {
  class FakeRouter {
    public readonly push = vi.fn<(path: string) => void>();
  }

  return new FakeRouter();
});

const fakeBreadcrumb = vi.hoisted(() => {
  class FakeBreadcrumb {
    public readonly invoke = vi.fn<
      (state: { title: string; backUrl: string }) => void
    >();
  }

  return new FakeBreadcrumb();
});

const fakeToast = vi.hoisted(() => {
  class FakeToast {
    public readonly success = vi.fn<(message: string) => void>();
    public readonly error = vi.fn<(message: string) => void>();
  }

  return new FakeToast();
});

const fakeSWR = vi.hoisted(() => {
  class FakeSWR {
    private readonly fallback: SwrState<unknown> = {
      data: null,
      error: null,
      isLoading: false,
      mutate: vi.fn(),
    };

    private readonly responses = new Map<string | null, SwrState<unknown>>();

    public readonly hook = vi.fn<
      (key: string | null, _fetcher?: unknown) => SwrState<unknown>
    >((key) => this.responses.get(key) ?? this.fallback);

    public setState<T>(key: string | null, state: SwrState<T>): void {
      this.responses.set(key, state as SwrState<unknown>);
    }

    public reset(): void {
      this.responses.clear();
      this.hook.mockClear();
    }
  }

  return new FakeSWR();
});

vi.mock("swr", () => ({
  default: (...args: Parameters<(key: string | null, fetcher?: unknown) => SwrState<unknown>>) =>
    fakeSWR.hook(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: fakeRouter.push,
  }),
}));

vi.mock("@/lib/api", () => ({
  api: fakeApi,
}));

vi.mock("sonner", () => ({
  toast: fakeToast,
}));

vi.mock("@/components/breadcrumb", () => ({
  useBreadcrumb: fakeBreadcrumb.invoke,
}));

const batchPayload = {
  id: "batch-1",
  productId: "prod-1",
  productName: "Leite",
  productSku: "L-01",
  warehouseId: "wh-1",
  warehouseName: "Central",
  warehouseCode: "W1",
  quantity: 12,
  batchNumber: "B-001",
  batchCode: null,
  expirationDate: "2026-12-31",
  manufacturedDate: null,
  costPrice: 100,
  sellingPrice: 250,
  notes: null,
  createdAt: "2026-01-01T08:00:00.000Z",
  updatedAt: "2026-01-01T08:00:00.000Z",
} satisfies Batch;

const batchResponse = {
  success: true,
  message: null,
  data: batchPayload,
};

beforeEach(() => {
  vi.clearAllMocks();
  fakeSWR.reset();
  fakeSWR.setState("batches/batch-1", {
    data: batchResponse,
    error: null,
    isLoading: false,
    mutate: vi.fn(),
  } as SwrState<unknown>);
});

describe("useBatchDetailModel", () => {
  it("carrega lote, registra breadcrumb e expõe estado derivado", () => {
    renderHook(() => useBatchDetailModel("batch-1"));

    expect(fakeSWR.hook).toHaveBeenCalledWith(
      "batches/batch-1",
      expect.any(Function),
    );
    expect(fakeBreadcrumb.invoke).toHaveBeenCalledWith({
      title: "B-001",
      backUrl: "/batches",
    });
  });

  it("usa estado vazio quando não há id", () => {
    renderHook(() => useBatchDetailModel(""));

    expect(fakeSWR.hook).toHaveBeenCalledWith(null, expect.any(Function));
    expect(fakeBreadcrumb.invoke).toHaveBeenCalledWith({
      title: "Carregando...",
      backUrl: "/batches",
    });
  });

  it("remove lote com sucesso e retorna para listagem", async () => {
    fakeApi.delete.mockReturnValueOnce(createJsonResponse({ success: true }));
    const mutate = vi.fn();
    fakeSWR.setState("batches/batch-1", {
      data: batchResponse,
      error: null,
      isLoading: false,
      mutate,
    });

    const { result } = renderHook(() => useBatchDetailModel("batch-1"));

    act(() => {
      result.current.onDeleteOpenChange(true);
    });
    expect(result.current.isDeleteOpen).toBe(true);

    await act(async () => {
      await result.current.onDelete();
    });

    expect(fakeApi.delete).toHaveBeenCalledWith("batches/batch-1");
    expect(fakeToast.success).toHaveBeenCalledWith("Batch removido com sucesso");
    expect(fakeRouter.push).toHaveBeenCalledWith("/batches");
    expect(mutate).toHaveBeenCalled();
    expect(result.current.isDeleteOpen).toBe(false);
    expect(result.current.isDeleting).toBe(false);
  });

  it("trata erro da API na exclusão e mantém fluxo de cleanup", async () => {
    fakeApi.delete.mockReturnValueOnce({
      json: vi.fn(async () => {
        throw new Error("Falha ao remover");
      }),
    });
    const mutate = vi.fn();
    fakeSWR.setState("batches/batch-1", {
      data: batchResponse,
      error: null,
      isLoading: false,
      mutate,
    });

    const { result } = renderHook(() => useBatchDetailModel("batch-1"));

    await act(async () => {
      await result.current.onDelete();
    });

    expect(fakeToast.error).toHaveBeenCalledWith("Falha ao remover");
    expect(mutate).toHaveBeenCalled();
    expect(result.current.isDeleting).toBe(false);
  });

  it("aceita erro não-Error e usa mensagem padrão de fallback", async () => {
    fakeApi.delete.mockReturnValueOnce({
      json: vi.fn(async () => {
        throw "kaboom";
      }),
    });
    const mutate = vi.fn();
    fakeSWR.setState("batches/batch-1", {
      data: batchResponse,
      error: null,
      isLoading: false,
      mutate,
    });

    const { result } = renderHook(() => useBatchDetailModel("batch-1"));

    await act(async () => {
      await result.current.onDelete();
    });

    expect(fakeToast.error).toHaveBeenCalledWith("Erro ao remover batch");
    expect(mutate).toHaveBeenCalled();
  });

  it("não dispara exclusão quando id está ausente", async () => {
    const { result } = renderHook(() => useBatchDetailModel(""));

    await act(async () => {
      await result.current.onDelete();
    });

    expect(fakeApi.delete).not.toHaveBeenCalled();
  });
});
