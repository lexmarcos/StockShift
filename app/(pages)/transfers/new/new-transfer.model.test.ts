import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useNewTransferModel } from "./new-transfer.model";
import type { NewTransferSchema } from "./new-transfer.schema";

type JsonResponse<T> = { json: () => Promise<T> };

type ProductResponse = Array<{ id: string; name: string }> | { content: Array<{ id: string; name: string }> };
type BatchResponse = Array<{ id: string; code: string; quantity: number; productId: string }> | { content: Array<{ id: string; code: string; quantity: number; productId: string }> };

type SwrState<T> = {
  data?: T;
  error: Error | null;
  isLoading: boolean;
};

type WarehouseListResponse = { success: boolean; data: Array<{ id: string; name: string }> };
type ProductListResponse = { success: boolean; data: ProductResponse };
type BatchListResponse = { success: boolean; data: BatchResponse };

const fakeSWR = vi.hoisted(() => {
  class FakeSWR {
    private readonly responses = new Map<string | null, SwrState<unknown>>();
    private readonly defaultState: SwrState<unknown> = {
      data: undefined,
      error: null,
      isLoading: false,
    };

    public readonly hook = vi.fn<
      (key: string | null, _fetcher?: unknown) => SwrState<unknown>
    >((key) => this.responses.get(key) ?? this.defaultState);

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

const fakeApi = vi.hoisted(() => {
  class FakeApi {
    public readonly post = vi.fn<
      (url: string, body: { json: NewTransferSchema }) => JsonResponse<unknown>
    >();
    public readonly get = vi.fn<(url: string) => Promise<JsonResponse<unknown>>>();
  }

  return new FakeApi();
});

const fakeRouter = vi.hoisted(() => {
  class FakeRouter {
    public readonly push = vi.fn<(url: string) => void>();
  }

  return new FakeRouter();
});

const fakeSelectedWarehouse = vi.hoisted(() => {
  class FakeSelectedWarehouse {
    public warehouseId: string | null = "warehouse-origin";
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

const fakeToast = vi.hoisted(() => {
  class FakeToast {
    public readonly success = vi.fn<(message: string) => void>();
    public readonly error = vi.fn<(message: string) => void>();
  }

  return new FakeToast();
});

vi.mock("swr", () => ({
  default: (...args: Parameters<typeof fakeSWR.hook>) => fakeSWR.hook(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: (...args: Parameters<typeof fakeRouter.push>) => fakeRouter.push(...args),
  }),
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

vi.mock("@/lib/api", () => ({
  api: fakeApi,
}));

vi.mock("sonner", () => ({
  toast: fakeToast,
}));

const createResponse = <T>(payload: T): JsonResponse<T> => ({
  json: vi.fn(async () => payload),
});

const warehousesResponse: WarehouseListResponse = {
  success: true,
  data: [
    { id: "warehouse-origin", name: "Depósito Principal" },
    { id: "warehouse-destination", name: "Loja Matriz" },
    { id: "warehouse-destination-b", name: "Loja B" },
  ],
};

const productsArrayResponse: ProductListResponse = {
  success: true,
  data: [
    { id: "prod-leite", name: "Leite" },
    { id: "prod-cafe", name: "Café" },
  ],
};

const productsContentResponse: ProductListResponse = {
  success: true,
  data: {
    content: [
      { id: "prod-suco", name: "Suco" },
      { id: "prod-cha", name: "Chá" },
    ],
  },
};

const batchContentResponse: BatchListResponse = {
  success: true,
  data: {
    content: [
      {
        id: "batch-leite-1",
        code: "L-01",
        quantity: 5,
        productId: "prod-leite",
      },
      {
        id: "batch-leite-2",
        code: "L-02",
        quantity: 2,
        productId: "prod-leite",
      },
      {
        id: "batch-cafe",
        code: "C-01",
        quantity: 10,
        productId: "prod-cafe",
      },
    ],
  },
};

const batchArrayResponse: BatchListResponse = {
  success: true,
  data: [
    {
      id: "batch-cha",
      code: "CH-01",
      quantity: 7,
      productId: "prod-cha",
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  fakeSWR.reset();
  fakeApi.post.mockReset();
  fakeApi.get.mockReset();
  fakeToast.success.mockClear();
  fakeToast.error.mockClear();
  fakeRouter.push.mockClear();
  fakeBreadcrumb.useBreadcrumb.mockClear();
  fakeSelectedWarehouse.warehouseId = "warehouse-origin";
  fakeApi.post.mockReturnValue(createResponse({ success: true }));

  fakeSWR.setState("warehouses", {
    data: warehousesResponse,
    error: null,
    isLoading: false,
  });
  fakeSWR.setState("products", {
    data: productsArrayResponse,
    error: null,
    isLoading: false,
  });
  fakeSWR.setState("batches/warehouse/warehouse-origin", {
    data: batchContentResponse,
    error: null,
    isLoading: false,
  });
});

describe("useNewTransferModel", () => {
  it("mapeia opções de destino ignorando o warehouse atual", () => {
    const { result } = renderHook(() => useNewTransferModel());

    expect(result.current.warehouses).toEqual([
      { id: "warehouse-destination", name: "Loja Matriz" },
      { id: "warehouse-destination-b", name: "Loja B" },
    ]);
    expect(result.current.products).toEqual([
      { id: "prod-leite", name: "Leite" },
      { id: "prod-cafe", name: "Café" },
    ]);
    expect(result.current.isLoading).toBe(false);
  });

  it("suporta resposta de produtos no formato content", () => {
    fakeSWR.setState("products", {
      data: productsContentResponse,
      error: null,
      isLoading: false,
    });

    const { result } = renderHook(() => useNewTransferModel());

    expect(result.current.products).toEqual([
      { id: "prod-suco", name: "Suco" },
      { id: "prod-cha", name: "Chá" },
    ]);
  });

  it("limpa seleção e erro ao trocar produto", () => {
    const { result } = renderHook(() => useNewTransferModel());

    act(() => {
      result.current.onProductChange("prod-leite");
      result.current.onBatchChange("batch-leite-1");
      result.current.onQuantityChange("1");
      result.current.onAddItem();
    });

    act(() => {
      result.current.onProductChange("prod-cafe");
    });

    expect(result.current.selectedProductId).toBe("prod-cafe");
    expect(result.current.selectedBatchId).toBe("");
    expect(result.current.itemQuantity).toBe("");
    expect(result.current.addItemError).toBeNull();
  });

  it("rejeita inclusão de item sem produto e sem lote", () => {
    const { result } = renderHook(() => useNewTransferModel());

    act(() => {
      result.current.onAddItem();
    });
    expect(result.current.addItemError).toBe("Selecione um produto.");

    act(() => {
      result.current.onProductChange("prod-leite");
    });
    act(() => {
      result.current.onAddItem();
    });
    expect(result.current.addItemError).toBe("Selecione um lote.");

    act(() => {
      result.current.onBatchChange("batch-leite-1");
      result.current.onQuantityChange("0");
    });
    act(() => {
      result.current.onAddItem();
    });
    expect(result.current.addItemError).toBe("Quantidade inválida.");
  });

  it("rejeita lote inválido ou quantidade acima do disponível", () => {
    const { result } = renderHook(() => useNewTransferModel());

    act(() => {
      result.current.onProductChange("prod-cafe");
    });
    act(() => {
      result.current.onBatchChange("batch-invalido");
    });
    act(() => {
      result.current.onQuantityChange("1");
    });
    act(() => {
      result.current.onAddItem();
    });

    expect(result.current.addItemError).toBe("Lote inválido.");

    act(() => {
      result.current.onProductChange("prod-cafe");
    });
    act(() => {
      result.current.onBatchChange("batch-cafe");
    });
    act(() => {
      result.current.onQuantityChange("11");
    });
    act(() => {
      result.current.onAddItem();
    });

    expect(result.current.addItemError).toBe(
      "Quantidade indisponível no lote (Máx: 10).",
    );
  });

  it("adiciona item com sucesso e limpa campos do formulário", () => {
    fakeSWR.setState("batches/warehouse/warehouse-origin", {
      data: {
        success: true,
        data: [
          {
            id: "batch-cha-array",
            code: "CH-99",
            quantity: 8,
            productId: "prod-cha",
          },
        ],
      },
      error: null,
      isLoading: false,
    });
    fakeSWR.setState("products", {
      data: {
        success: true,
        data: {
          content: [{ id: "prod-cha", name: "Chá" }],
        },
      },
      error: null,
      isLoading: false,
    });

    const { result } = renderHook(() => useNewTransferModel());

    act(() => {
      result.current.onProductChange("prod-cha");
    });
    act(() => {
      result.current.onBatchChange("batch-cha-array");
    });
    act(() => {
      result.current.onQuantityChange("4");
    });
    act(() => {
      result.current.onAddItem();
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toMatchObject({
      sourceBatchId: "batch-cha-array",
      quantity: 4,
      productName: "Chá",
      batchCode: "CH-99",
      availableQuantity: 8,
    });
    expect(result.current.selectedProductId).toBe("");
    expect(result.current.selectedBatchId).toBe("");
    expect(result.current.itemQuantity).toBe("");
    expect(result.current.addItemError).toBeNull();
  });

  it("sinaliza erro quando não existe warehouse de origem", async () => {
    fakeSelectedWarehouse.warehouseId = null;
    const { result } = renderHook(() => useNewTransferModel());

    const payload: NewTransferSchema = {
      destinationWarehouseId: "warehouse-destination",
      notes: "",
      items: [
        {
          sourceBatchId: "batch-leite-1",
          quantity: 1,
          productName: "Leite",
          batchCode: "L-01",
          availableQuantity: 5,
        },
      ],
    };

    await act(async () => {
      await result.current.onSubmit(payload);
    });

    expect(fakeToast.error).toHaveBeenCalledWith("Selecione um warehouse de origem.");
    expect(fakeApi.post).not.toHaveBeenCalled();
  });

  it("bloqueia envio para destino igual ao warehouse de origem", async () => {
    const { result } = renderHook(() => useNewTransferModel());

    const payload: NewTransferSchema = {
      destinationWarehouseId: "warehouse-origin",
      notes: "",
      items: [
        {
          sourceBatchId: "batch-leite-1",
          quantity: 1,
          productName: "Leite",
          batchCode: "L-01",
          availableQuantity: 5,
        },
      ],
    };

    await act(async () => {
      await result.current.onSubmit(payload);
    });

    expect(result.current.form.getFieldState("destinationWarehouseId").error).toMatchObject({
      message: "O destino não pode ser igual à origem.",
    });
    expect(fakeApi.post).not.toHaveBeenCalled();
  });

  it("envia nova transferência com sucesso e redireciona", async () => {
    const { result } = renderHook(() => useNewTransferModel());
    fakeApi.post.mockReturnValue(
      createResponse({
        success: true,
        message: "Transferência criada",
      }),
    );

    const payload: NewTransferSchema = {
      destinationWarehouseId: "warehouse-destination-b",
      notes: "Observação do lote",
      items: [
        {
          sourceBatchId: "batch-cafe",
          quantity: 2,
          productName: "Café",
          batchCode: "C-01",
          availableQuantity: 10,
        },
      ],
    };

    await act(async () => {
      await result.current.onSubmit(payload);
    });

    expect(fakeApi.post).toHaveBeenCalledWith("transfers", {
      json: {
        destinationWarehouseId: "warehouse-destination-b",
        notes: "Observação do lote",
        items: [
          {
            sourceBatchId: "batch-cafe",
            quantity: 2,
          },
        ],
      },
    });
    expect(fakeToast.success).toHaveBeenCalledWith("Transferência criada com sucesso!");
    expect(fakeRouter.push).toHaveBeenCalledWith("/transfers");
    expect(result.current.isSubmitting).toBe(false);
  });

  it("emite erro quando o envio falha", async () => {
    const { result } = renderHook(() => useNewTransferModel());
    fakeApi.post.mockImplementation(() => {
      throw new Error("Falha no servidor");
    });

    const payload: NewTransferSchema = {
      destinationWarehouseId: "warehouse-destination-b",
      notes: "",
      items: [
        {
          sourceBatchId: "batch-cafe",
          quantity: 2,
          productName: "Café",
          batchCode: "C-01",
          availableQuantity: 10,
        },
      ],
    };

    await act(async () => {
      await result.current.onSubmit(payload);
    });

    expect(fakeToast.error).toHaveBeenCalledWith("Falha no servidor");
    expect(result.current.isSubmitting).toBe(false);
  });
});
