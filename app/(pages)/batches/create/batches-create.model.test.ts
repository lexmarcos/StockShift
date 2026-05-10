import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildLatestBatchPriceSuggestion,
  buildBatchPayload,
  buildProductBarcodeUrl,
  buildProductBatchesUrl,
  buildProductSearchUrl,
  findMostRecentProductBatch,
  formatPriceFromCents,
  formatProductOptionLabel,
  limitProductSearchOptions,
  useBatchCreateModel,
} from "./batches-create.model";
import type {
  BatchCreatePayload,
  ProductBatchesResponse,
  ProductBatchPriceSource,
  ProductSearchResponse,
  ProductSearchOption,
} from "./batches-create.types";
import type { BatchCreateFormData } from "./batches-create.schema";

type JsonResponse<T> = {
  json: () => Promise<T>;
};

type SwrState<T> = {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isValidating: boolean;
  mutate: ReturnType<typeof vi.fn>;
};

type JsonApiGet = (url: string) => JsonResponse<unknown>;
type JsonApiPost = (url: string, options: { json: BatchCreatePayload }) => JsonResponse<unknown>;

const createJsonResponse = <T,>(payload: T): JsonResponse<T> => ({
  json: vi.fn(async () => payload),
});

const fakeApi = vi.hoisted(() => {
  class FakeBatchCreateApi {
    public readonly get: ReturnType<typeof vi.fn<JsonApiGet>> = vi.fn();
    public readonly post: ReturnType<typeof vi.fn<JsonApiPost>> = vi.fn();
  }

  return new FakeBatchCreateApi();
});

const fakeRouter = vi.hoisted(() => {
  class FakeBatchCreateRouter {
    public readonly push = vi.fn<(path: string) => void>();
  }

  return new FakeBatchCreateRouter();
});

const fakeSWR = vi.hoisted(() => {
  class FakeBatchCreateSWR {
    private readonly fallback: SwrState<unknown> = {
      data: null,
      error: null,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    };

    private readonly responses = new Map<string | null, SwrState<unknown>>();

    public readonly hook = vi.fn<(key: string | null, _fetcher?: unknown) => SwrState<unknown>>(
      (key) => this.responses.get(key) ?? this.fallback,
    );

    public setState<T>(key: string | null, state: SwrState<T>): void {
      this.responses.set(key, state as SwrState<unknown>);
    }

    public reset(): void {
      this.responses.clear();
      this.hook.mockClear();
    }
  }

  return new FakeBatchCreateSWR();
});

const fakeBreadcrumb = vi.hoisted(() => {
  class FakeBatchCreateBreadcrumb {
    public readonly invoke = vi.fn<
      (state: {
        title: string;
        backUrl: string;
        section: string;
        subsection: string;
      }) => void
    >();
  }

  return new FakeBatchCreateBreadcrumb();
});

const fakeToast = vi.hoisted(() => {
  class FakeBatchCreateToast {
    public readonly success = vi.fn<(message: string) => void>();
    public readonly error = vi.fn<(message: string) => void>();
  }

  return new FakeBatchCreateToast();
});

const fakeSelectedWarehouse = vi.hoisted(() => {
  class FakeSelectedWarehouse {
    public warehouseId: string | undefined = "wh-1";
  }

  return new FakeSelectedWarehouse();
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

vi.mock("@/hooks/use-selected-warehouse", () => ({
  useSelectedWarehouse: () => fakeSelectedWarehouse,
}));

vi.mock("sonner", () => ({
  toast: fakeToast,
}));

const productWithSku: ProductSearchOption = {
  id: "prod-1",
  name: "Café Expresso",
  sku: "CAFE-01",
  hasExpiration: false,
};

const expiringProduct: ProductSearchOption = {
  id: "prod-exp",
  name: "Leite Fresco",
  hasExpiration: true,
};

const searchProductResponse: ProductSearchResponse = {
  success: true,
  data: [productWithSku, expiringProduct],
};

const olderProductBatch: ProductBatchPriceSource = {
  id: "batch-old",
  productId: "prod-1",
  productName: "Café Expresso",
  warehouseId: "wh-1",
  warehouseName: "Central",
  originStockMovementItemId: null,
  originStockMovementId: null,
  originStockMovementCode: null,
  batchCode: "B-OLD",
  quantity: 5,
  manufacturedDate: "2026-01-01",
  expirationDate: null,
  costPrice: 800,
  sellingPrice: 1100,
  createdAt: "2026-01-02T10:00:00.000Z",
  updatedAt: "2026-01-02T10:00:00.000Z",
};

const newestProductBatch: ProductBatchPriceSource = {
  ...olderProductBatch,
  id: "batch-new",
  batchCode: "B-NEW",
  costPrice: 1050,
  sellingPrice: 1550,
  createdAt: "2026-02-02T10:00:00.000Z",
  updatedAt: "2026-02-02T10:00:00.000Z",
};

const productBatchesResponse: ProductBatchesResponse = {
  success: true,
  data: [olderProductBatch, newestProductBatch],
};

const validSubmitData: BatchCreateFormData = {
  productId: "prod-1",
  quantity: 2,
  manufacturedDate: "2026-01-01",
  expirationDate: "2026-12-31",
  costPrice: 1000,
  sellingPrice: 1200,
  notes: "   ",
};

beforeEach(() => {
  vi.clearAllMocks();
  fakeSWR.reset();
  fakeApi.get.mockReset();
  fakeApi.post.mockReset();
  fakeRouter.push.mockReset();
  fakeBreadcrumb.invoke.mockReset();
  fakeToast.success.mockReset();
  fakeToast.error.mockReset();

  fakeSelectedWarehouse.warehouseId = "wh-1";
  fakeSWR.setState(null, {
    data: null,
    error: null,
    isLoading: false,
    isValidating: false,
    mutate: vi.fn(),
  });
  fakeApi.post.mockReturnValue(createJsonResponse({ success: true, data: { id: "batch-created" } }));
  fakeApi.get.mockReturnValue(createJsonResponse({ success: true, data: productWithSku }));
});

describe("batchCreate helpers", () => {
  it("buildBatchPayload omite campos opcionais vazios", () => {
    const payload = buildBatchPayload(validSubmitData, "wh-1");
    expect(payload.notes).toBeUndefined();
    expect(payload.manufacturedDate).toBe("2026-01-01");
    expect(payload.expirationDate).toBe("2026-12-31");
    expect(payload.productId).toBe("prod-1");
    expect(payload.warehouseId).toBe("wh-1");
  });

  it("buildProductSearchUrl exige pelo menos dois caracteres úteis", () => {
    expect(buildProductSearchUrl(" a ")).toBeNull();
    expect(buildProductSearchUrl("ca")).toBe("products/search?q=ca");
  });

  it("buildProductBarcodeUrl omite consulta vazia e codifica espaço", () => {
    expect(buildProductBarcodeUrl("  ")).toBeNull();
    expect(buildProductBarcodeUrl("789 1001")).toBe("products/barcode/789%201001");
  });

  it("buildProductBatchesUrl monta endpoint de lotes por produto", () => {
    expect(buildProductBatchesUrl(" prod-1 ")).toBe("batches/product/prod-1");
    expect(buildProductBatchesUrl(" ")).toBeNull();
    expect(buildProductBatchesUrl(null)).toBeNull();
  });

  it("formata label de produto com SKU quando disponível", () => {
    expect(formatProductOptionLabel(productWithSku)).toBe("Café Expresso (CAFE-01)");
  });

  it("formata label sem SKU", () => {
    expect(formatProductOptionLabel(expiringProduct)).toBe("Leite Fresco");
  });

  it("limita opções de busca para cinco itens", () => {
    const options: ProductSearchOption[] = Array.from({ length: 6 }, (_, index) => ({
      id: `p${index}`,
      name: `Produto ${index}`,
      hasExpiration: false,
    }));
    expect(limitProductSearchOptions(options)).toHaveLength(5);
  });

  it("encontra lote mais recente do produto por createdAt", () => {
    expect(
      findMostRecentProductBatch([olderProductBatch, newestProductBatch])?.id,
    ).toBe("batch-new");
    expect(findMostRecentProductBatch([])).toBeNull();
  });

  it("normaliza sugestão de preço do lote mais recente", () => {
    const suggestion = buildLatestBatchPriceSuggestion(newestProductBatch);
    expect(formatPriceFromCents(1050)).toBe("R$\u00a010,50");
    expect(suggestion?.batchCode).toBe("B-NEW");
    expect(suggestion?.costPriceLabel).toBe("R$\u00a010,50");
    expect(suggestion?.sellingPriceLabel).toBe("R$\u00a015,50");
  });
});

describe("useBatchCreateModel", () => {
  it("inicializa estado padrão de criação de lote", () => {
    const { result } = renderHook(() => useBatchCreateModel());

    expect(result.current.productSearchQuery).toBe("");
    expect(result.current.productOptions).toEqual([]);
    expect(result.current.selectedWarehouseId).toBe("wh-1");
    expect(result.current.selectedProduct).toBeNull();
  });

  it("deve selecionar e limpar produto corretamente", () => {
    fakeSWR.setState("batches/product/prod-1", {
      data: productBatchesResponse,
      error: null,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    });
    const { result } = renderHook(() => useBatchCreateModel());

    act(() => {
      result.current.onProductSelect(productWithSku);
    });
    expect(result.current.selectedProduct?.id).toBe("prod-1");
    expect(result.current.form.getValues("productId")).toBe("prod-1");
    expect(result.current.productSearchQuery).toBe("Café Expresso (CAFE-01)");
    expect(result.current.latestBatchPriceSuggestion?.batchCode).toBe("B-NEW");

    act(() => {
      result.current.onProductClear();
    });
    expect(result.current.selectedProduct).toBeNull();
    expect(result.current.form.getValues("productId")).toBe("");
    expect(result.current.productSearchQuery).toBe("");
  });

  it("aplica preços do lote mais recente nos campos de criação", () => {
    fakeSWR.setState("batches/product/prod-1", {
      data: productBatchesResponse,
      error: null,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    });
    const { result } = renderHook(() => useBatchCreateModel());

    act(() => {
      result.current.onProductSelect(productWithSku);
    });

    act(() => {
      result.current.onApplyLatestCostPrice();
      result.current.onApplyLatestSellingPrice();
    });

    expect(result.current.form.getValues("costPrice")).toBe(1050);
    expect(result.current.form.getValues("sellingPrice")).toBe(1550);
  });

  it("mantém produto selecionado quando busca recebe label igual ao produto atual", () => {
    const { result } = renderHook(() => useBatchCreateModel());

    act(() => {
      result.current.onProductSelect(productWithSku);
      result.current.onProductSearchChange("Café Expresso (CAFE-01)");
    });

    expect(result.current.selectedProduct?.id).toBe("prod-1");
    expect(result.current.form.getValues("productId")).toBe("prod-1");
  });

  it("remove seleção de produto quando busca muda do produto atual", () => {
    const { result } = renderHook(() => useBatchCreateModel());

    act(() => {
      result.current.onProductSelect(productWithSku);
    });

    expect(result.current.selectedProduct).toEqual(productWithSku);

    act(() => {
      result.current.onProductSearchChange("Outro produto");
    });

    expect(result.current.selectedProduct).toBeNull();
    expect(result.current.form.getValues("productId")).toBe("");
  });

  it("abre opções no foco e fecha com atraso no blur", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useBatchCreateModel());

    act(() => {
      result.current.onProductSearchFocus();
    });
    expect(result.current.isProductOptionsOpen).toBe(true);

    act(() => {
      result.current.onProductSearchBlur();
    });

    act(() => {
      vi.advanceTimersByTime(119);
    });
    expect(result.current.isProductOptionsOpen).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(result.current.isProductOptionsOpen).toBe(false);
    vi.useRealTimers();
  });

  it("cancela fechamento por blur quando recebe foco novamente", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useBatchCreateModel());

    act(() => {
      result.current.onProductSearchBlur();
      vi.advanceTimersByTime(60);
      result.current.onProductSearchFocus();
      vi.advanceTimersByTime(200);
    });

    expect(result.current.isProductOptionsOpen).toBe(true);
    vi.useRealTimers();
  });

  it("atualiza quantidades com mínimo de 1", () => {
    const { result } = renderHook(() => useBatchCreateModel());

    act(() => {
      result.current.onQuantityIncrement();
    });
    expect(result.current.form.getValues("quantity")).toBe(2);

    act(() => {
      result.current.onQuantityDecrement();
      result.current.onQuantityDecrement();
    });
    expect(result.current.form.getValues("quantity")).toBe(1);
  });

  it("abre e fecha scanner de código de barras", () => {
    const { result } = renderHook(() => useBatchCreateModel());

    act(() => {
      result.current.openScanner();
    });
    expect(result.current.isScannerOpen).toBe(true);

    act(() => {
      result.current.closeScanner();
    });
    expect(result.current.isScannerOpen).toBe(false);
  });

  it("atualiza chave de busca com debounce e usa loading do SWR", async () => {
    fakeSWR.setState("products/search?q=ca", {
      data: searchProductResponse,
      error: null,
      isLoading: true,
      isValidating: false,
      mutate: vi.fn(),
    });
    const { result } = renderHook(() => useBatchCreateModel());

    act(() => {
      result.current.onProductSearchChange("ca");
    });

    await waitFor(() => {
      expect(fakeSWR.hook).toHaveBeenCalledWith(
        "products/search?q=ca",
        expect.any(Function),
      );
    }, { timeout: 2000 });

    expect(result.current.isProductSearchLoading).toBe(true);
    expect(result.current.productOptions).toEqual(searchProductResponse.data.slice(0, 5));
  });

  it("busca produto por código de barras vazio e alerta erro", async () => {
    const { result } = renderHook(() => useBatchCreateModel());
    await act(async () => {
      await result.current.handleBarcodeScan("   ");
    });

    expect(fakeToast.error).toHaveBeenCalledWith("Código de barras vazio");
    expect(fakeApi.get).not.toHaveBeenCalled();
  });

  it("avisa quando não encontra produto por código de barras", async () => {
    fakeApi.get.mockReturnValueOnce(
      createJsonResponse({ success: false, data: null }),
    );
    const { result } = renderHook(() => useBatchCreateModel());

    await act(async () => {
      await result.current.handleBarcodeScan("789 1001");
    });

    expect(fakeApi.get).toHaveBeenCalledWith("products/barcode/789%201001");
    expect(fakeToast.error).toHaveBeenCalledWith(
      "Produto não encontrado para o código 789 1001",
    );
    expect(result.current.selectedProduct).toBeNull();
  });

  it("seleciona produto quando código de barras é localizado", async () => {
    const lookupResponse = {
      success: true,
      data: expiringProduct,
    };
    fakeApi.get.mockReturnValueOnce(createJsonResponse(lookupResponse));
    const { result } = renderHook(() => useBatchCreateModel());

    await act(async () => {
      await result.current.handleBarcodeScan("7891001");
    });

    expect(fakeApi.get).toHaveBeenCalledWith("products/barcode/7891001");
    expect(fakeToast.success).toHaveBeenCalledWith("Produto Leite Fresco encontrado");
    expect(result.current.selectedProduct?.id).toBe("prod-exp");
    expect(result.current.form.getValues("productId")).toBe("prod-exp");
  });

  it("lida com erro de comunicação no scan de código de barras", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    fakeApi.get.mockReturnValueOnce({
      json: vi.fn(async () => {
        throw new Error("Falha de rede");
      }),
    });
    const { result } = renderHook(() => useBatchCreateModel());

    await act(async () => {
      await result.current.handleBarcodeScan("7891001");
    });

    expect(fakeToast.error).toHaveBeenCalledWith(
      "Produto não encontrado para o código 7891001",
    );
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("bloqueia envio sem warehouse ativo", async () => {
    fakeSelectedWarehouse.warehouseId = undefined;
    const { result } = renderHook(() => useBatchCreateModel());

    await act(async () => {
      await result.current.onSubmit(validSubmitData);
    });

    expect(fakeToast.error).toHaveBeenCalledWith(
      "Selecione um warehouse ativo para criar o batch",
    );
    expect(fakeApi.post).not.toHaveBeenCalled();
  });

  it("permite envio sem validade para produto com controle de vencimento", async () => {
    const { result } = renderHook(() => useBatchCreateModel());

    act(() => {
      result.current.onProductSelect(expiringProduct);
    });

    expect(result.current.selectedProduct?.id).toBe("prod-exp");

    await act(async () => {
      await result.current.onSubmit({
        ...validSubmitData,
        expirationDate: "",
      });
    });

    expect(fakeApi.post).toHaveBeenCalledWith("batches", {
      json: buildBatchPayload(
        {
          ...validSubmitData,
          expirationDate: "",
        },
        "wh-1",
      ),
    });
    expect(result.current.form.getFieldState("expirationDate").error?.message).toBe(
      undefined,
    );
  });

  it("envia dados e navega para detalhe ao criar lote com sucesso", async () => {
    const { result } = renderHook(() => useBatchCreateModel());

    act(() => {
      result.current.onProductSelect(productWithSku);
    });
    fakeApi.post.mockReturnValueOnce(
      createJsonResponse({ success: true, data: { id: "batch-2026" } }),
    );

    await act(async () => {
      await result.current.onSubmit(validSubmitData);
    });

    expect(fakeApi.post).toHaveBeenCalledWith("batches", {
      json: buildBatchPayload(validSubmitData, "wh-1"),
    });
    expect(fakeToast.success).toHaveBeenCalledWith("Batch criado com sucesso");
    expect(fakeRouter.push).toHaveBeenCalledWith("/batches/batch-2026");
  });

  it("exibe erro quando API rejeita criação com Error", async () => {
    fakeApi.post.mockReturnValueOnce({
      json: vi.fn(async () => {
        throw new Error("Falha interna");
      }),
    });
    const { result } = renderHook(() => useBatchCreateModel());

    await act(async () => {
      await result.current.onSubmit(validSubmitData);
    });

    expect(fakeToast.error).toHaveBeenCalledWith("Falha interna");
  });

  it("exibe mensagem padrão quando erro não é Error", async () => {
    fakeApi.post.mockReturnValueOnce({
      json: vi.fn(async () => {
        throw "servidor indisponível";
      }),
    });
    const { result } = renderHook(() => useBatchCreateModel());

    await act(async () => {
      await result.current.onSubmit(validSubmitData);
    });

    expect(fakeToast.error).toHaveBeenCalledWith("Erro ao criar batch");
  });
});
