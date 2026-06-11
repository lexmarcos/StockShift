import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mapBatchToFormValues, useBatchEditModel } from "./batches-edit.model";
import type { Batch } from "../../batches.types";
import type { BatchEditFormData } from "./batches-edit.schema";
import type { BatchEditResponse } from "./batches-edit.types";

type JsonResponse<T> = {
  json: () => Promise<T>;
};

type SwrState<T> = {
  data: T | null;
  isLoading: boolean;
  error?: Error | null;
  mutate: ReturnType<typeof vi.fn>;
};

const createJsonResponse = <T,>(payload: T): JsonResponse<T> => ({
  json: vi.fn(async () => payload),
});

const fakeApi = vi.hoisted(() => {
  class FakeApi {
    public readonly get = vi.fn<(url: string) => JsonResponse<unknown>>();
    public readonly put = vi.fn<
      (url: string, options: { json: BatchEditFormData }) => JsonResponse<unknown>
    >();
  }

  return new FakeApi();
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
      (
        state: {
          title: string;
          backUrl: string;
          section: string;
          subsection: string;
        },
      ) => void
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
    private readonly responses = new Map<string | null, SwrState<unknown>>();
    private readonly fallback: SwrState<unknown> = {
      data: null,
      isLoading: false,
      error: null,
      mutate: vi.fn(),
    };

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

vi.mock("@/components/breadcrumb", () => ({
  useBreadcrumb: fakeBreadcrumb.invoke,
}));

vi.mock("sonner", () => ({
  toast: fakeToast,
}));

const baseBatch = {
  id: "batch-1",
  productId: "prod-1",
  warehouseId: "wh-1",
  productName: "Leite",
  productSku: "L-01",
  warehouseName: "Central",
  warehouseCode: "W1",
  quantity: 12,
  batchNumber: "B-001",
  batchCode: "B-001",
  expirationDate: "2026-12-31",
  manufacturedDate: "2026-01-01",
  costPrice: 1000,
  sellingPrice: 1500,
  notes: "Observação",
  createdAt: "2026-01-01T08:00:00.000Z",
  updatedAt: "2026-01-01T08:00:00.000Z",
} satisfies Batch;

const batchResponse: BatchEditResponse = {
  success: true,
  message: null,
  data: baseBatch,
};

const baseFormValues: BatchEditFormData = {
  productId: "prod-1",
  warehouseId: "wh-1",
  quantity: 12,
  batchCode: "B-001",
  manufacturedDate: "2026-01-01",
  expirationDate: "2026-12-31",
  costPrice: 1000,
  sellingPrice: 1500,
  notes: "Observação",
};

beforeEach(() => {
  vi.clearAllMocks();
  fakeSWR.reset();
  fakeApi.get.mockReset();
  fakeApi.put.mockReset();
  fakeRouter.push.mockReset();
  fakeBreadcrumb.invoke.mockReset();
  fakeToast.success.mockReset();
  fakeToast.error.mockReset();

  fakeSWR.setState("batches/batch-1", {
    data: batchResponse,
    isLoading: false,
    error: null,
    mutate: vi.fn(),
  });
  fakeApi.get.mockReturnValue(createJsonResponse(batchResponse));
  fakeApi.put.mockReturnValue(createJsonResponse({ success: true, data: null, message: "ok" }));
});

describe("mapBatchToFormValues", () => {
  it("mapeia lote da API para valores iniciais do formulário", () => {
    const formValues = mapBatchToFormValues(baseBatch);

    expect(formValues.productId).toBe("prod-1");
    expect(formValues.quantity).toBe(12);
    expect(formValues.batchCode).toBe("B-001");
  });

  it("aplica fallback padrão quando campos opcionais estão ausentes", () => {
    const partialBatch = {
      ...baseBatch,
      batchNumber: null,
      batchCode: null,
      manufacturedDate: "",
      expirationDate: "",
      costPrice: null,
      sellingPrice: null,
      notes: null,
      quantity: undefined as unknown as number,
    } as unknown as Batch;
    const formValues = mapBatchToFormValues(partialBatch);
    expect(formValues.quantity).toBe(1);
    expect(formValues.batchCode).toBe("");
    expect(formValues.manufacturedDate).toBe("");
    expect(formValues.expirationDate).toBe("");
    expect(formValues.costPrice).toBeUndefined();
  });
});

describe("useBatchEditModel", () => {
  it("prefill dos campos ao receber lote", async () => {
    const { result } = renderHook(() => useBatchEditModel("batch-1"));

    await waitFor(() => {
      expect(result.current.batch?.id).toBe("batch-1");
    });

    expect(fakeBreadcrumb.invoke).toHaveBeenCalledWith({
      title: "B-001",
      backUrl: "/batches/batch-1",
      section: "Inventário",
      subsection: "Edição",
    });
    expect(result.current.form.getValues("batchCode")).toBe("B-001");
    expect(result.current.form.getValues("quantity")).toBe(12);
  });

  it("usa key null e valores iniciais quando id está vazio", () => {
    renderHook(() => useBatchEditModel(""));
    expect(fakeSWR.hook).toHaveBeenCalledWith(null, expect.any(Function));
    expect(fakeApi.get).not.toHaveBeenCalled();
    expect(fakeSWR.hook).toHaveBeenCalled();
  });

  it("atualiza lote com sucesso e retorna para detalhe", async () => {
    const { result } = renderHook(() => useBatchEditModel("batch-1"));
    const values: BatchEditFormData = {
      ...baseFormValues,
      notes: "Novo texto",
    };

    await act(async () => {
      await result.current.onSubmit(values);
    });

    expect(fakeApi.put).toHaveBeenCalledWith("batches/batch-1", {
      json: values,
    });
    expect(fakeToast.success).toHaveBeenCalledWith("Lote atualizado");
    expect(fakeRouter.push).toHaveBeenCalledWith("/batches/batch-1");
  });

  it("exibe mensagem de erro padrão quando a atualização falha sem Error", async () => {
    fakeApi.put.mockReturnValueOnce({
      json: vi.fn(async () => {
        throw "timeout";
      }),
    });
    const { result } = renderHook(() => useBatchEditModel("batch-1"));

    await act(async () => {
      await result.current.onSubmit(baseFormValues);
    });

    expect(fakeToast.error).toHaveBeenCalledWith("Erro ao atualizar lote");
  });

  it("exibe mensagem de erro retornada pela API na atualização", async () => {
    const updateError = new Error("Falha ao atualizar lote");
    fakeApi.put.mockReturnValueOnce({
      json: vi.fn(async () => {
        throw updateError;
      }),
    });
    const { result } = renderHook(() => useBatchEditModel("batch-1"));

    await act(async () => {
      await result.current.onSubmit(baseFormValues);
    });

    expect(fakeToast.error).toHaveBeenCalledWith("Falha ao atualizar lote");
  });
});
