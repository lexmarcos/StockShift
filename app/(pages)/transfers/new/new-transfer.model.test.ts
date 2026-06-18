import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildTransferProductBatchesUrl,
  clampTransferBatchQuantity,
  filterTransferProductOptions,
  formatTransferProductLabel,
  formatTransferProductQuantityLabel,
  getWarehouseBatchQuantityByProduct,
  useNewTransferModel,
} from "./new-transfer.model";
import type { NewTransferSchema } from "./new-transfer.schema";
import type { TransferProductOption } from "./new-transfer.types";

type JsonResponse<T> = { json: () => Promise<T> };

type SwrState<T> = {
  data?: T;
  error: Error | null;
  isLoading: boolean;
};

type WarehouseListResponse = {
  success: boolean;
  data: Array<{ id: string; name: string }>;
};
type ProductListResponse = {
  success: boolean;
  data: TransferProductOption[] | { content: TransferProductOption[] };
};
type BatchListResponse = {
  success: boolean;
  data:
    | TransferBatchTestSource[]
    | { content: TransferBatchTestSource[] };
};
type TransferBatchTestSource = {
  id: string;
  productId: string;
  productName?: string;
  batchCode?: string | null;
  code?: string | null;
  quantity: number;
  manufacturedDate?: string | null;
  expirationDate?: string | null;
};

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
      (url: string, body: { json: unknown }) => JsonResponse<unknown>
    >();
    public readonly get = vi.fn<(url: string) => JsonResponse<unknown>>();
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
    public readonly warning = vi.fn<(message: string) => void>();
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

const products: TransferProductOption[] = [
  {
    id: "prod-leite",
    name: "Leite Integral",
    sku: "LEI-01",
    barcode: "7891000000001",
    imageUrl: "https://img.test/leite.png",
    totalQuantity: 12,
    stockQuantityLabel: "Quantidade: 12 un.",
  },
  {
    id: "prod-cafe",
    name: "Café Torrado",
    sku: "CAF-02",
    barcode: "7891000000002",
    imageUrl: null,
    totalQuantity: 7,
    stockQuantityLabel: "Quantidade: 7 un.",
  },
  {
    id: "prod-cha",
    name: "Chá Mate",
    sku: null,
    barcode: "7891000000003",
    imageUrl: null,
    totalQuantity: 0,
    stockQuantityLabel: "Quantidade: 0 un.",
  },
];

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
  data: products,
};

const productsContentResponse: ProductListResponse = {
  success: true,
  data: { content: [products[2]] },
};

const leiteBatchResponse: BatchListResponse = {
  success: true,
  data: [
    {
      id: "batch-leite-1",
      productId: "prod-leite",
      productName: "Leite Integral",
      batchCode: "L-01",
      quantity: 5,
      manufacturedDate: "2026-01-01",
      expirationDate: "2026-12-31",
    },
    {
      id: "batch-leite-2",
      productId: "prod-leite",
      productName: "Leite Integral",
      code: "L-02",
      quantity: 0,
      expirationDate: "2027-01-31",
    },
  ],
};

const cafeBatchResponse: BatchListResponse = {
  success: true,
  data: {
    content: [
      {
        id: "batch-cafe",
        productId: "prod-cafe",
        productName: "Café Torrado",
        batchCode: "C-01",
        quantity: 10,
        manufacturedDate: null,
        expirationDate: null,
      },
    ],
  },
};

const warehouseBatchesResponse: BatchListResponse = {
  success: true,
  data: [
    {
      id: "batch-leite-warehouse-1",
      productId: "prod-leite",
      productName: "Leite Integral",
      batchCode: "L-WH-01",
      quantity: 4,
    },
    {
      id: "batch-leite-warehouse-2",
      productId: "prod-leite",
      productName: "Leite Integral",
      batchCode: "L-WH-02",
      quantity: 6,
    },
    {
      id: "batch-cafe-warehouse",
      productId: "prod-cafe",
      productName: "Café Torrado",
      batchCode: "C-WH-01",
      quantity: 7,
    },
  ],
};

const getWarehouseBatchSources = (
  response: BatchListResponse,
): TransferBatchTestSource[] => {
  return Array.isArray(response.data) ? response.data : response.data.content;
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
  fakeSWR.reset();
  fakeApi.post.mockReset();
  fakeApi.get.mockReset();
  fakeRouter.push.mockClear();
  fakeBreadcrumb.useBreadcrumb.mockClear();
  fakeSelectedWarehouse.warehouseId = "warehouse-origin";
  fakeApi.post.mockReturnValue(createResponse({ success: true }));
  fakeApi.get.mockImplementation((url: string) => {
    if (url === "products/barcode/7891000000001") {
      return createResponse({ success: true, data: products[0] });
    }
    if (url === "products/barcode/7891000000002") {
      return createResponse({ success: true, data: products[1] });
    }
    throw new Error(`Sem fake para GET ${url}`);
  });

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
    data: warehouseBatchesResponse,
    error: null,
    isLoading: false,
  });
  fakeSWR.setState("batches/warehouses/warehouse-origin/products/prod-leite/batches", {
    data: leiteBatchResponse,
    error: null,
    isLoading: false,
  });
  fakeSWR.setState("batches/warehouses/warehouse-origin/products/prod-cafe/batches", {
    data: cafeBatchResponse,
    error: null,
    isLoading: false,
  });
});

describe("helpers de nova transferência", () => {
  it("formata produto com SKU quando disponível", () => {
    expect(formatTransferProductLabel(products[0])).toBe(
      "Leite Integral (LEI-01)",
    );
    expect(formatTransferProductLabel(products[2])).toBe("Chá Mate");
  });

  it("formata quantidade disponível do produto", () => {
    expect(formatTransferProductQuantityLabel(products[0])).toBe(
      "Quantidade: 12 un.",
    );
    expect(formatTransferProductQuantityLabel({ id: "p", name: "Produto" })).toBe(
      "Quantidade: 0 un.",
    );
  });

  it("soma quantidades de todos os lotes do produto", () => {
    const quantityByProduct = getWarehouseBatchQuantityByProduct(
      getWarehouseBatchSources(warehouseBatchesResponse),
    );

    expect(quantityByProduct.get("prod-leite")).toBe(10);
    expect(quantityByProduct.get("prod-cafe")).toBe(7);
    expect(quantityByProduct.get("prod-cha")).toBeUndefined();
  });

  it("filtra produtos por nome, SKU e barcode com mínimo de dois caracteres", () => {
    expect(filterTransferProductOptions(products, " l ")).toEqual([]);
    expect(filterTransferProductOptions(products, "caf")[0].id).toBe("prod-cafe");
    expect(filterTransferProductOptions(products, "LEI-01")[0].id).toBe("prod-leite");
    expect(filterTransferProductOptions(products, "0003")[0].id).toBe("prod-cha");
  });

  it("limita resultados de autocomplete a cinco produtos", () => {
    const manyProducts = Array.from({ length: 6 }, (_, index) => ({
      id: `prod-${index}`,
      name: `Produto ${index}`,
    }));

    expect(filterTransferProductOptions(manyProducts, "produto")).toHaveLength(5);
  });

  it("monta URL de lotes apenas com drawer aberto e IDs válidos", () => {
    expect(buildTransferProductBatchesUrl(null, "prod-1", true)).toBeNull();
    expect(buildTransferProductBatchesUrl("wh-1", "", true)).toBeNull();
    expect(buildTransferProductBatchesUrl("wh-1", "prod-1", false)).toBeNull();
    expect(buildTransferProductBatchesUrl("wh-1", "prod-1", true)).toBe(
      "batches/warehouses/wh-1/products/prod-1/batches",
    );
  });

  it("limita quantidade do lote entre um e o estoque disponível", () => {
    expect(clampTransferBatchQuantity("0", 5)).toBe("1");
    expect(clampTransferBatchQuantity("texto", 5)).toBe("1");
    expect(clampTransferBatchQuantity("3", 5)).toBe("3");
    expect(clampTransferBatchQuantity("8", 5)).toBe("5");
    expect(clampTransferBatchQuantity("8")).toBe("8");
  });
});

describe("useNewTransferModel", () => {
  it("mapeia destinos e produtos ignorando warehouse atual", () => {
    const { result } = renderHook(() => useNewTransferModel());

    expect(result.current.warehouses).toEqual([
      { id: "warehouse-destination", name: "Loja Matriz" },
      { id: "warehouse-destination-b", name: "Loja B" },
    ]);
    expect(result.current.products).toMatchObject([
      { id: "prod-leite", totalQuantity: 10, stockQuantityLabel: "Quantidade: 10 un." },
      { id: "prod-cafe", totalQuantity: 7, stockQuantityLabel: "Quantidade: 7 un." },
      { id: "prod-cha", totalQuantity: 0, stockQuantityLabel: "Quantidade: 0 un." },
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

    expect(result.current.products).toMatchObject([
      { id: "prod-cha", totalQuantity: 0, stockQuantityLabel: "Quantidade: 0 un." },
    ]);
  });

  it("abre autocomplete e seleciona produto para abrir drawer de lote", () => {
    const { result } = renderHook(() => useNewTransferModel());

    act(() => {
      result.current.onProductSearchFocus();
      result.current.onProductSearchChange("lei");
    });
    expect(result.current.isProductOptionsOpen).toBe(true);
    expect(result.current.addItemError).toBeNull();

    act(() => {
      result.current.onProductSelect(products[0]);
    });

    expect(result.current.selectedProductId).toBe("prod-leite");
    expect(result.current.productSearchQuery).toBe("Leite Integral (LEI-01)");
    expect(result.current.batchDrawer).toMatchObject({
      isOpen: true,
      productId: "prod-leite",
      productName: "Leite Integral",
      quantity: "1",
    });
    expect(fakeSWR.hook).toHaveBeenCalledWith(
      "batches/warehouses/warehouse-origin/products/prod-leite/batches",
      expect.any(Function),
    );
  });

  it("limpa seleção quando busca muda após produto selecionado", () => {
    const { result } = renderHook(() => useNewTransferModel());

    act(() => {
      result.current.onProductSelect(products[0]);
    });
    act(() => {
      result.current.onProductSearchChange("outro");
    });

    expect(result.current.selectedProductId).toBe("");
    expect(result.current.productSearchQuery).toBe("outro");
    expect(result.current.addItemError).toBeNull();
  });

  it("limpa produto, busca e drawer", () => {
    const { result } = renderHook(() => useNewTransferModel());

    act(() => {
      result.current.onProductSelect(products[0]);
      result.current.onProductClear();
    });

    expect(result.current.selectedProductId).toBe("");
    expect(result.current.productSearchQuery).toBe("");
    expect(result.current.batchDrawer.isOpen).toBe(false);
  });

  it("abre drawer de lote ao ler código de barras", async () => {
    const { result } = renderHook(() => useNewTransferModel());

    await act(async () => {
      await result.current.onBarcodeScan("7891000000001");
    });

    expect(fakeApi.get).toHaveBeenCalledWith("products/barcode/7891000000001");
    expect(result.current.isScannerOpen).toBe(false);
    expect(result.current.batchDrawer).toMatchObject({
      isOpen: true,
      productId: "prod-leite",
      productName: "Leite Integral",
    });
  });

  it("ignora leitura duplicada imediata", async () => {
    const { result } = renderHook(() => useNewTransferModel());

    await act(async () => {
      await result.current.onBarcodeScan("7891000000001");
      await result.current.onBarcodeScan("7891000000001");
    });

    expect(fakeApi.get).toHaveBeenCalledTimes(1);
  });

  it("mostra erro quando barcode não encontra produto", async () => {
    fakeApi.get.mockImplementation(() => {
      throw new Error("não encontrado");
    });
    const { result } = renderHook(() => useNewTransferModel());

    await act(async () => {
      await result.current.onBarcodeScan("7891009999999");
    });

    expect(fakeToast.error).toHaveBeenCalledWith(
      "Produto com código 7891009999999 não existe.",
    );
  });

  it("normaliza lotes e remove lote sem estoque", () => {
    const { result } = renderHook(() => useNewTransferModel());

    act(() => {
      result.current.onProductSelect(products[0]);
    });

    expect(result.current.batches).toEqual([
      {
        id: "batch-leite-1",
        productId: "prod-leite",
        productName: "Leite Integral",
        batchCode: "L-01",
        quantity: 5,
        manufacturedDate: "2026-01-01",
        expirationDate: "2026-12-31",
      },
    ]);
  });

  it("exige seleção de lote antes de confirmar", () => {
    const { result } = renderHook(() => useNewTransferModel());

    act(() => {
      result.current.onProductSelect(products[0]);
    });
    act(() => {
      result.current.onConfirmBatch();
    });
    expect(result.current.batchDrawer.error).toBe("Selecione um lote.");
  });

  it("mantém quantidade do drawer entre um e o estoque do lote", () => {
    const { result } = renderHook(() => useNewTransferModel());

    act(() => {
      result.current.onProductSelect(products[0]);
      result.current.onQuantityChange("8");
    });
    expect(result.current.batchDrawer.quantity).toBe("8");

    act(() => {
      result.current.onBatchChange("batch-leite-1");
    });
    expect(result.current.batchDrawer.quantity).toBe("5");

    act(() => {
      result.current.onQuantityChange("0");
    });
    expect(result.current.batchDrawer.quantity).toBe("1");

    act(() => {
      result.current.onQuantityDecrement();
    });
    expect(result.current.batchDrawer.quantity).toBe("1");

    act(() => {
      result.current.onQuantityChange("5");
    });
    act(() => {
      result.current.onQuantityIncrement();
    });
    expect(result.current.batchDrawer.quantity).toBe("5");
  });

  it("incrementa, decrementa e confirma lote adicionando item", () => {
    const { result } = renderHook(() => useNewTransferModel());

    act(() => {
      result.current.onProductSelect(products[0]);
      result.current.onBatchChange("batch-leite-1");
      result.current.onQuantityIncrement();
    });
    expect(result.current.batchDrawer.quantity).toBe("2");

    act(() => {
      result.current.onQuantityDecrement();
    });
    expect(result.current.batchDrawer.quantity).toBe("1");

    act(() => {
      result.current.onConfirmBatch();
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toMatchObject({
      sourceBatchId: "batch-leite-1",
      quantity: 1,
      productName: "Leite Integral",
      batchCode: "L-01",
      availableQuantity: 5,
    });
    expect(result.current.selectedProductId).toBe("");
    expect(result.current.productSearchQuery).toBe("");
    expect(result.current.batchDrawer.isOpen).toBe(false);
  });

  it("confirma lote com resposta no formato content", () => {
    const { result } = renderHook(() => useNewTransferModel());

    act(() => {
      result.current.onProductSelect(products[1]);
    });
    act(() => {
      result.current.onBatchChange("batch-cafe");
      result.current.onQuantityChange("4");
    });
    act(() => {
      result.current.onConfirmBatch();
    });

    expect(result.current.items[0]).toMatchObject({
      sourceBatchId: "batch-cafe",
      quantity: 4,
      productName: "Café Torrado",
      batchCode: "C-01",
      availableQuantity: 10,
    });
  });

  it("sinaliza erro quando não existe warehouse de origem", async () => {
    fakeSelectedWarehouse.warehouseId = null;
    const { result } = renderHook(() => useNewTransferModel());

    const payload: NewTransferSchema = {
      destinationWarehouseId: "warehouse-destination",
      notes: "",
      items: [
        {
          sourceBatchId: "11111111-1111-4111-8111-111111111111",
          quantity: 1,
          productName: "Leite Integral",
          batchCode: "L-01",
          availableQuantity: 5,
        },
      ],
    };

    await act(async () => {
      await result.current.onSubmit(payload);
    });

    expect(fakeToast.warning).toHaveBeenCalledWith("Selecione um estoque de origem.");
    expect(fakeApi.post).not.toHaveBeenCalled();
  });

  it("bloqueia envio para destino igual ao warehouse de origem", async () => {
    const { result } = renderHook(() => useNewTransferModel());

    const payload: NewTransferSchema = {
      destinationWarehouseId: "warehouse-origin",
      notes: "",
      items: [
        {
          sourceBatchId: "11111111-1111-4111-8111-111111111111",
          quantity: 1,
          productName: "Leite Integral",
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
    const payload: NewTransferSchema = {
      destinationWarehouseId: "warehouse-destination-b",
      notes: "Observação do lote",
      items: [
        {
          sourceBatchId: "11111111-1111-4111-8111-111111111111",
          quantity: 2,
          productName: "Café Torrado",
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
            sourceBatchId: "11111111-1111-4111-8111-111111111111",
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
          sourceBatchId: "11111111-1111-4111-8111-111111111111",
          quantity: 2,
          productName: "Café Torrado",
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
