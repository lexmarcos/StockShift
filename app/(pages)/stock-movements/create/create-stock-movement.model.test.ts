import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCreateStockMovementModel } from "./create-stock-movement.model";
import { buildMovementPayload } from "./create-stock-movement.payload";
import {
  buildStockMovementProductSearchUrl,
  formatStockMovementProductLabel,
  mapStockMovementProductOptions,
  shouldShowStockMovementFooter,
} from "./stock-movement-product-options";
import type { CreateStockMovementSchema } from "./create-stock-movement.schema";
import type {
  StockMovementDraft,
  WritableStockMovementDraft,
} from "./create-stock-movement.storage";
import type {
  StockMovementProductBatchPriceSource,
  StockMovementProductBatchesResponse,
  StockMovementProductOption,
} from "./create-stock-movement.types";

type JsonResponse<T> = { json: () => Promise<T> };
type ProductListResponse = { success: boolean; data: StockMovementProductOption[] };

const createJsonResponse = <T>(payload: T): JsonResponse<T> => ({
  json: vi.fn(async () => payload),
});

const fakeSWR = vi.hoisted(() => {
  type SwrState<T> = {
    data: T;
    error: Error | null;
    isLoading: boolean;
    mutate: () => void;
  };

  class FakeSWR {
    private readonly responses = new Map<string | null, SwrState<unknown>>();
    private readonly defaultState: SwrState<unknown> = {
      data: null,
      error: null,
      isLoading: false,
      mutate: vi.fn(),
    };

    public readonly hook = vi.fn(
      (key: string | null, fetcher?: unknown): SwrState<unknown> => {
        void fetcher;
        return this.responses.get(key) ?? this.defaultState;
      },
    );

    public setState<T>(key: string | null, state: SwrState<T>): void {
      this.responses.set(key, state as SwrState<unknown>);
    }

    public reset(): void {
      this.responses.clear();
      (this.defaultState.mutate as import("vitest").Mock).mockClear();
      this.hook.mockClear();
    }
  }

  return new FakeSWR();
});

const fakeApi = vi.hoisted(() => {
  class FakeApi {
    public readonly get = vi.fn<(url: string) => JsonResponse<unknown>>();
    public readonly post = vi.fn<
      (url: string, body: { json?: unknown; body?: unknown }) =>
        | Promise<unknown>
        | JsonResponse<unknown>
    >();
  }

  return new FakeApi();
});

const fakeSearchParams = vi.hoisted(() => {
  class FakeSearchParams {
    private movementType: string | null = "PURCHASE_IN";
    private editItem: string | null = null;

    public setType(value: string | null): void {
      this.movementType = value;
    }

    public setEditItem(value: string | null): void {
      this.editItem = value;
    }

    public readonly get = vi.fn((key: string): string | null => {
      if (key === "type") return this.movementType;
      if (key === "editItem") return this.editItem;
      return null;
    });
  }

  return new FakeSearchParams();
});

const fakeRouter = vi.hoisted(() => {
  class FakeRouter {
    public readonly push = vi.fn<(url: string) => void>();
    public readonly replace = vi.fn<(url: string) => void>();
  }

  return new FakeRouter();
});

const fakeToast = vi.hoisted(() => {
  class FakeToast {
    public readonly success = vi.fn<(message: string) => void>();
    public readonly error = vi.fn<(message: string, options?: unknown) => void>();
    public readonly warning = vi.fn<(message: string) => void>();
  }

  return new FakeToast();
});

const fakeSelectedWarehouse = vi.hoisted(() => {
  class FakeSelectedWarehouse {
    public warehouseId: string | null = "wh-1";
    public readonly setWarehouseId = vi.fn<(warehouseId: string | null) => void>();
  }

  return new FakeSelectedWarehouse();
});

const fakeStorage = vi.hoisted(() => {
  class FakeStorage {
    private draftState: StockMovementDraft | null = null;
    private readonly currentRuntimeId = "runtime-atual";

    public readonly readStockMovementDraft = vi.fn<() => Promise<StockMovementDraft | null>>(async () => {
      return this.draftState;
    });
    public readonly writeStockMovementDraft = vi.fn(
      async (draft: WritableStockMovementDraft, expectedRevision?: number) => {
        const storedRevision = this.draftState?.revision ?? 0;
        if (expectedRevision !== undefined && storedRevision !== expectedRevision) {
          return { status: "conflict" as const, revision: storedRevision };
        }
        this.draftState = {
          ...draft,
          schemaVersion: 3,
          updatedAt: "2026-01-20T10:00:00.000Z",
          revision: storedRevision + 1,
          runtimeId: this.currentRuntimeId,
        };
        return { status: "written" as const, revision: storedRevision + 1 };
      },
    );
    public readonly clearStockMovementDraft = vi.fn(async () => {
      this.draftState = null;
    });
    public readonly isStockMovementDraftRecoveredFromPreviousRuntime = vi.fn(
      (draft: StockMovementDraft) => {
        return draft.runtimeId !== this.currentRuntimeId;
      },
    );

    public setDraftState(draft: StockMovementDraft | null): void {
      this.draftState = draft;
    }

    public getCurrentRuntimeId(): string {
      return this.currentRuntimeId;
    }
  }

  return new FakeStorage();
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
  default: (key: string | null, fetcher?: unknown) =>
    fakeSWR.hook(key, fetcher),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: (url: string) => fakeRouter.push(url),
    replace: (url: string) => fakeRouter.replace(url),
  }),
  useSearchParams: () => ({
    get: (key: string) => fakeSearchParams.get(key),
  }),
}));

vi.mock("sonner", () => ({
  toast: fakeToast,
}));

vi.mock("@/components/breadcrumb", () => ({
  useBreadcrumb: (payload: Parameters<typeof fakeBreadcrumb.useBreadcrumb>[0]) =>
    fakeBreadcrumb.useBreadcrumb(payload),
}));

vi.mock("@/hooks/use-selected-warehouse", () => ({
  useSelectedWarehouse: () => fakeSelectedWarehouse,
}));

vi.mock("@/lib/api", () => ({
  api: fakeApi,
  isApiNotFoundError: (error: unknown) =>
    Boolean((error as { notFound?: boolean })?.notFound),
}));

vi.mock("./create-stock-movement.storage", () => ({
  readStockMovementDraft: () => fakeStorage.readStockMovementDraft(),
  isStockMovementDraftRecoveredFromPreviousRuntime: (draft: StockMovementDraft) =>
    fakeStorage.isStockMovementDraftRecoveredFromPreviousRuntime(draft),
  writeStockMovementDraft: (
    draft: WritableStockMovementDraft,
    expectedRevision?: number,
  ) => fakeStorage.writeStockMovementDraft(draft, expectedRevision),
  clearStockMovementDraft: () => fakeStorage.clearStockMovementDraft(),
  inlineProductImageToFile: (image: {
    name: string;
    type: string;
    blob: Blob;
  }): File =>
    new File([image.blob], image.name, {
      type: image.type,
    }),
  fileToInlineProductImage: (file: File) => ({
    name: file.name,
    type: file.type,
    blob: file,
  }),
}));

const movementProducts: StockMovementProductOption[] = [
  {
    id: "p-1",
    name: "Café Torrado",
    sku: "CAF-01",
    barcode: "7891000000001",
    imageUrl: "/img/cafe.png",
  },
  {
    id: "p-2",
    name: "Filtro de Papel",
    sku: "FIL-02",
    barcode: "7891000000002",
  },
  {
    id: "p-3",
    name: "Açúcar Cristal",
    sku: "ACU-03",
    barcode: "7891000000003",
  },
  {
    id: "p-4",
    name: "Copo Térmico",
    barcode: "7891000000004",
  },
];

const validExistingProductUuid = "123e4567-e89b-12d3-a456-426614174000";

const productListResponse: ProductListResponse = {
  success: true,
  data: movementProducts,
};

const olderProductBatch: StockMovementProductBatchPriceSource = {
  id: "batch-old",
  productId: "p-1",
  productName: "Café Torrado",
  warehouseId: "wh-1",
  warehouseName: "Central",
  batchCode: "LOTE-OLD",
  quantity: 4,
  manufacturedDate: "2026-01-01",
  expirationDate: "2026-12-31",
  costPrice: 7250,
  sellingPrice: 12490,
  createdAt: "2026-01-10T10:00:00.000Z",
  updatedAt: "2026-01-10T10:00:00.000Z",
};

const newestProductBatch: StockMovementProductBatchPriceSource = {
  ...olderProductBatch,
  id: "batch-new",
  batchCode: "LOTE-NEW",
  sellingPrice: 12990,
  createdAt: "2026-03-10T10:00:00.000Z",
  updatedAt: "2026-03-10T10:00:00.000Z",
};

const productBatchesResponse: StockMovementProductBatchesResponse = {
  success: true,
  data: [olderProductBatch, newestProductBatch],
};

const barcodeIndex: Record<string, StockMovementProductOption> = {
  "7891000000004": movementProducts[3],
  "7891000000005": movementProducts[0],
  "7891000000006": movementProducts[0],
};

const createDraftState = (
  overrides?: Partial<StockMovementDraft>,
): StockMovementDraft => ({
  schemaVersion: 3,
  updatedAt: "2026-01-20T09:00:00.000Z",
  revision: 1,
  type: "PURCHASE_IN",
  warehouseId: "wh-1",
  notes: "Notas iniciais",
  items: [
    {
      quantity: 2,
      productName: "Item prévio",
      newProductData: {
        name: "Item prévio",
        description: "do rascunho",
        attributes: { lote: "001" },
        active: true,
        isKit: false,
        hasExpiration: false,
      },
    },
  ],
  selectedProductId: "p-4",
  itemQuantity: "5",
  ...overrides,
});

const createSubmitPayload = (
  override: Partial<CreateStockMovementSchema> = {},
): CreateStockMovementSchema => ({
  type: "PURCHASE_IN",
  notes: "Entrada automática",
  items: [
    {
      productId: validExistingProductUuid,
      quantity: 2,
      productName: "Café Torrado",
    },
  ],
  ...override,
});

const createInlineSubmitPayload = (): CreateStockMovementSchema => ({
  type: "PURCHASE_IN",
  notes: "",
  items: [
    {
      quantity: 1,
      newProductData: {
        name: "Novo Produto",
        description: "Item novo",
        barcode: "7894000000001",
        categoryId: "c-1",
        brandId: "b-1",
        isKit: false,
        hasExpiration: false,
        active: true,
        attributes: {
          volume: "1L",
        },
        manufacturedDate: "2026-01-01",
        expirationDate: "2027-01-01",
        costPrice: 150,
        sellingPrice: 280,
        image: {
          name: "inline.png",
          type: "image/png",
          blob: new Blob(["fake"], { type: "image/png" }),
        },
      },
    },
  ],
});

beforeEach(() => {
  vi.clearAllMocks();
  fakeSearchParams.setType("PURCHASE_IN");
  fakeSearchParams.setEditItem(null);
  fakeStorage.setDraftState(null);
  fakeStorage.clearStockMovementDraft.mockClear();
  fakeStorage.isStockMovementDraftRecoveredFromPreviousRuntime.mockClear();
  fakeStorage.readStockMovementDraft.mockClear();
  fakeStorage.writeStockMovementDraft.mockClear();
  fakeRouter.push.mockClear();
  fakeRouter.replace.mockClear();
  fakeToast.success.mockClear();
  fakeToast.error.mockClear();
  fakeSelectedWarehouse.warehouseId = "wh-1";
  fakeSelectedWarehouse.setWarehouseId.mockClear();
  fakeBreadcrumb.useBreadcrumb.mockClear();
  fakeSWR.reset();
  fakeSWR.setState("products", {
    data: productListResponse,
    error: null,
    isLoading: false,
    mutate: vi.fn(),
  });

  fakeApi.get.mockImplementation((url: string) => {
    if (url.startsWith("products/barcode/")) {
      const barcode = decodeURIComponent(url.replace("products/barcode/", ""));
      const product = barcodeIndex[barcode];
      if (!product) {
        throw Object.assign(
          new Error(`Produto com código ${barcode} não existe.`),
          { notFound: true },
        );
      }
      return createJsonResponse({
        success: true,
        data: product,
      });
    }

    return createJsonResponse(productListResponse);
  });

  fakeApi.post.mockImplementation((url: string) => {
    if (url === "uploads/product-images/temp") {
      return createJsonResponse({
        success: true,
        data: {
          uploadId: "11111111-1111-4111-8111-111111111111",
          fileName: "inline.png",
          contentType: "image/png",
          sizeBytes: 3,
        },
      });
    }
    return Promise.resolve({});
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("helpers de produto", () => {
  const products: StockMovementProductOption[] = movementProducts;

  it("não monta URL de busca com menos de dois caracteres", () => {
    expect(buildStockMovementProductSearchUrl(" c ")).toBeNull();
    expect(buildStockMovementProductSearchUrl("")).toBeNull();
  });

  it("monta URL de busca com query escapada", () => {
    expect(buildStockMovementProductSearchUrl(" café cristal ")).toBe(
      "products/search?q=caf%C3%A9%20cristal",
    );
  });

  it("mapeia resposta de produtos em lista ou paginada", () => {
    expect(
      mapStockMovementProductOptions({ success: true, data: products }),
    ).toHaveLength(4);
    expect(
      mapStockMovementProductOptions({
        success: true,
        data: { content: products.slice(0, 2) },
      }),
    ).toHaveLength(2);
    expect(mapStockMovementProductOptions(null)).toEqual([]);
  });

  it("mostra SKU quando disponível", () => {
    expect(formatStockMovementProductLabel(products[0])).toBe(
      "Café Torrado (CAF-01)",
    );
  });

  it("exibe apenas nome quando SKU ausente", () => {
    expect(formatStockMovementProductLabel(movementProducts[3])).toBe("Copo Térmico");
  });

  it("marca produto inline como expirável somente quando validade foi preenchida", () => {
    const payload = buildMovementPayload("PURCHASE_IN", createInlineSubmitPayload());

    expect("newProduct" in payload.items[0] && payload.items[0].newProduct?.hasExpiration).toBe(true);
  });

  it("envia dados de lote em item de produto existente quando preenchidos", () => {
    const payload = buildMovementPayload(
      "PURCHASE_IN",
      createSubmitPayload({
        items: [
          {
            productId: validExistingProductUuid,
            quantity: 2,
            productName: "Café Torrado",
            manufacturedDate: "2026-04-01",
            expirationDate: "2026-12-31",
            costPrice: 1290,
            sellingPrice: 2490,
          },
        ],
      }),
    );

    expect(payload.items[0]).toEqual({
      productId: validExistingProductUuid,
      quantity: 2,
      manufacturedDate: "2026-04-01",
      expirationDate: "2026-12-31",
      costPrice: 1290,
      sellingPrice: 2490,
    });
  });

  it("exibe footer no fim da pagina ou quando usuario rola para cima", () => {
    expect(
      shouldShowStockMovementFooter({
        currentScrollY: 200,
        lastScrollY: 100,
        maxScrollY: 1000,
      }),
    ).toBe(false);
    expect(
      shouldShowStockMovementFooter({
        currentScrollY: 995,
        lastScrollY: 900,
        maxScrollY: 1000,
      }),
    ).toBe(true);
    expect(
      shouldShowStockMovementFooter({
        currentScrollY: 600,
        lastScrollY: 700,
        maxScrollY: 1000,
      }),
    ).toBe(true);
    expect(
      shouldShowStockMovementFooter({
        currentScrollY: 0,
        lastScrollY: 0,
        maxScrollY: 0,
      }),
    ).toBe(true);
  });
});

describe("useCreateStockMovementModel", () => {
  it("inicializa com tipo manual válido e carrega produtos", () => {
    const { result } = renderHook(() => useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }));

    expect(result.current.form.getValues("type")).toBe("PURCHASE_IN");
    expect(result.current.products).toEqual(movementProducts);
    expect(result.current.isFooterVisible).toBe(true);
    expect(result.current.selectedProductId).toBe("");
    expect(result.current.itemQuantity).toBe("");
    expect(fakeBreadcrumb.useBreadcrumb).toHaveBeenCalledWith({
      title: "Nova Movimentação",
      backUrl: "/stock-movements",
      section: "Movimentações",
      subsection: "Criar",
    });
  });

  it("mantém modelo sem tipo quando a rota não fornece tipo válido", () => {
    fakeSearchParams.setType(null);
    const { result } = renderHook(() =>
      useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }),
    );

    expect(result.current.form.getValues("type")).toBeUndefined();
    expect(fakeToast.error).not.toHaveBeenCalledWith(
      "Selecione o tipo de movimentação antes de continuar.",
    );
    expect(fakeRouter.replace).not.toHaveBeenCalledWith("/stock-movements");
  });

  it("restaura rascunho legado sem limpar do storage e mostra toast", async () => {
    fakeStorage.setDraftState(
      createDraftState({
        selectedProductId: "p-2",
        itemQuantity: "7",
      }),
    );

    const { result } = renderHook(() => useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }));

    await waitFor(() => {
      expect(result.current.form.getValues("notes")).toBe("Notas iniciais");
    });

    expect(fakeStorage.readStockMovementDraft).toHaveBeenCalledTimes(1);
    expect(fakeStorage.clearStockMovementDraft).not.toHaveBeenCalled();
    expect(fakeToast.success).toHaveBeenCalledWith(
      "Rascunho da movimentação restaurado.",
    );
    expect(result.current.form.getValues("notes")).toBe("Notas iniciais");
    expect(result.current.form.getValues("items")).toEqual([
      {
        quantity: 2,
        productName: "Item prévio",
        newProductData: {
          name: "Item prévio",
          description: "do rascunho",
          attributes: { lote: "001" },
          active: true,
          isKit: false,
          hasExpiration: false,
        },
      },
    ]);
    expect(result.current.selectedProductId).toBe("p-2");
    expect(result.current.itemQuantity).toBe("7");
  });

  it("restaura rascunho do runtime atual em silêncio", async () => {
    fakeStorage.setDraftState(
      createDraftState({
        selectedProductId: "p-2",
        runtimeId: fakeStorage.getCurrentRuntimeId(),
      }),
    );

    const { result } = renderHook(() =>
      useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }),
    );

    await waitFor(() => {
      expect(result.current.form.getValues("notes")).toBe("Notas iniciais");
    });

    expect(
      fakeStorage.isStockMovementDraftRecoveredFromPreviousRuntime,
    ).toHaveBeenCalledTimes(1);
    expect(fakeToast.success).not.toHaveBeenCalledWith(
      "Rascunho da movimentação restaurado.",
    );
    expect(result.current.selectedProductId).toBe("p-2");
  });

  it("restaura rascunho de runtime anterior com toast", async () => {
    fakeStorage.setDraftState(
      createDraftState({
        selectedProductId: "p-2",
        runtimeId: "runtime-anterior",
      }),
    );

    const { result } = renderHook(() =>
      useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }),
    );

    await waitFor(() => {
      expect(result.current.form.getValues("notes")).toBe("Notas iniciais");
    });

    expect(fakeToast.success).toHaveBeenCalledWith(
      "Rascunho da movimentação restaurado.",
    );
    expect(result.current.selectedProductId).toBe("p-2");
  });

  it("autosalva notas e itens depois da hidratação", async () => {
    const { result } = renderHook(() =>
      useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }),
    );

    await waitFor(() => {
      expect(fakeStorage.writeStockMovementDraft).toHaveBeenCalled();
    });
    fakeStorage.writeStockMovementDraft.mockClear();

    act(() => {
      result.current.form.setValue("notes", "Nova observação");
    });

    await waitFor(() => {
      expect(fakeStorage.writeStockMovementDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: "Nova observação",
        }),
        expect.any(Number),
      );
    });

    fakeStorage.writeStockMovementDraft.mockClear();
    act(() => {
      result.current.form.setValue("items", [
        {
          productId: validExistingProductUuid,
          productName: "Café Torrado",
          quantity: 2,
        },
      ]);
    });

    await waitFor(() => {
      expect(fakeStorage.writeStockMovementDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          warehouseId: "wh-1",
          items: [
            {
              productId: validExistingProductUuid,
              productName: "Café Torrado",
              quantity: 2,
            },
          ],
        }),
        expect.any(Number),
      );
    });
  });

  it("aplica debounce e busca produtos na API de pesquisa", () => {
    vi.useFakeTimers();
    fakeSWR.setState("products/search?q=filtro", {
      data: { success: true, data: [movementProducts[1]] },
      error: null,
      isLoading: false,
      mutate: vi.fn(),
    });
    const { result } = renderHook(() =>
      useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }),
    );

    act(() => {
      result.current.onProductSearchFocus();
      result.current.onProductSearchChange("filtro");
    });
    expect(result.current.productOptions).toEqual([]);
    expect(result.current.isProductSearchLoading).toBe(false);

    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(fakeSWR.hook).toHaveBeenCalledWith(
      "products/search?q=filtro",
      expect.any(Function),
    );
    expect(result.current.productOptions).toHaveLength(1);
    expect(result.current.productOptions[0].id).toBe("p-2");
  });

  it("cancela debounce de busca ao desmontar", () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() =>
      useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }),
    );

    act(() => {
      result.current.onProductSearchChange("filtro");
    });

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });

  it("mantém produto selecionado quando busca bate com rótulo completo", () => {
    const { result } = renderHook(() => useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }));

    act(() => {
      result.current.onProductSelect(movementProducts[0]);
      result.current.onProductSearchChange("Café Torrado (CAF-01)");
    });

    expect(result.current.selectedProductId).toBe("p-1");
  });

  it("limpa produto selecionado quando busca muda", () => {
    const { result } = renderHook(() => useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }));

    act(() => {
      result.current.onProductSelect(movementProducts[0]);
    });
    act(() => {
      result.current.onProductSearchChange("outro");
    });

    expect(result.current.selectedProductId).toBe("");
    expect(result.current.addItemError).toBe(null);
  });

  it("limpa seleção e estado de busca", () => {
    const { result } = renderHook(() => useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }));

    act(() => {
      result.current.onProductSelect(movementProducts[0]);
      result.current.onProductClear();
    });

    expect(result.current.selectedProductId).toBe("");
    expect(result.current.itemQuantity).toBe("");
    expect(result.current.productSearchQuery).toBe("");
    expect(result.current.isProductOptionsOpen).toBe(false);
  });

  it("adiciona item válido em saída e valida quantidade/produto", () => {
    fakeSearchParams.setType("USAGE");
    const { result } = renderHook(() => useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }));

    act(() => {
      result.current.onAddItem();
    });
    expect(result.current.addItemError).toBe("Selecione um produto.");

    act(() => {
      result.current.onProductSelect(movementProducts[0]);
    });
    expect(result.current.selectedProductId).toBe("p-1");

    act(() => {
      result.current.onQuantityChange("0");
    });
    act(() => {
      result.current.onAddItem();
    });
    expect(result.current.addItemError).toBe("Informe uma quantidade válida.");

    act(() => {
      result.current.onQuantityChange("2");
    });
    act(() => {
      result.current.onAddItem();
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.selectedProductId).toBe("");
    expect(result.current.itemQuantity).toBe("");

    act(() => {
      result.current.onProductSelect(movementProducts[0]);
    });
    act(() => {
      result.current.onQuantityChange("1");
    });
    act(() => {
      result.current.onAddItem();
    });
    expect(result.current.addItemError).toBe(
      "Este produto já foi adicionado. Remova-o para alterar a quantidade.",
    );
    expect(result.current.existingProductBatchForm.isOpen).toBe(false);
  });

  it("abre dados de lote antes de adicionar produto existente em compra", () => {
    const { result } = renderHook(() => useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }));

    act(() => {
      result.current.onProductSelect(movementProducts[0]);
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.existingProductBatchForm).toMatchObject({
      isOpen: true,
      productId: "p-1",
      productName: "Café Torrado",
      quantity: "",
      editingIndex: null,
    });
  });

  it("incrementa e decrementa quantidade no formulário de dados do lote", () => {
    const { result } = renderHook(() => useCreateStockMovementModel());

    act(() => {
      result.current.onProductSelect(movementProducts[0]);
    });
    act(() => {
      result.current.onExistingProductBatchQuantityIncrement();
      result.current.onExistingProductBatchQuantityIncrement();
    });
    expect(result.current.existingProductBatchForm.quantity).toBe("2");

    act(() => {
      result.current.onExistingProductBatchQuantityDecrement();
    });
    expect(result.current.existingProductBatchForm.quantity).toBe("1");

    act(() => {
      result.current.onExistingProductBatchQuantityDecrement();
      result.current.onExistingProductBatchQuantityDecrement();
    });
    expect(result.current.existingProductBatchForm.quantity).toBe("");
  });

  it("busca preço do último lote no warehouse atual ao abrir dados do lote", () => {
    fakeSWR.setState("batches/warehouses/wh-1/products/p-1/batches", {
      data: productBatchesResponse,
      error: null,
      isLoading: false,
      mutate: vi.fn(),
    });
    const { result } = renderHook(() =>
      useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }),
    );

    act(() => {
      result.current.onProductSelect(movementProducts[0]);
    });

    expect(fakeSWR.hook).toHaveBeenCalledWith(
      "batches/warehouses/wh-1/products/p-1/batches",
      expect.any(Function),
    );
    expect(result.current.existingProductSalePriceSuggestion).toMatchObject({
      batchCode: "LOTE-NEW",
      priceCents: 12990,
      priceLabel: "R$\u00a0129,90",
    });
  });

  it("aplica sugestão de venda sem bloquear edição manual posterior", () => {
    fakeSWR.setState("batches/warehouses/wh-1/products/p-1/batches", {
      data: productBatchesResponse,
      error: null,
      isLoading: false,
      mutate: vi.fn(),
    });
    const { result } = renderHook(() =>
      useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }),
    );

    act(() => {
      result.current.onProductSelect(movementProducts[0]);
    });
    act(() => {
      result.current.onApplyExistingProductSalePriceSuggestion();
    });
    expect(result.current.existingProductBatchForm.sellingPrice).toBe(12990);

    act(() => {
      result.current.onExistingProductBatchSellingPriceChange(13990);
    });
    expect(result.current.existingProductBatchForm.sellingPrice).toBe(13990);
  });

  it("não busca sugestão quando não há warehouse atual no contexto", () => {
    fakeSelectedWarehouse.warehouseId = null;
    const { result } = renderHook(() =>
      useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }),
    );

    act(() => {
      result.current.onProductSelect(movementProducts[0]);
    });

    expect(fakeSWR.hook).not.toHaveBeenCalledWith(
      "batches/warehouses/wh-1/products/p-1/batches",
      expect.any(Function),
    );
    expect(result.current.existingProductSalePriceSuggestion).toBeNull();
  });

  it("confirma dados de lote e adiciona item com datas e preços", () => {
    const { result } = renderHook(() => useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }));

    act(() => {
      result.current.onProductSelect(movementProducts[0]);
    });
    act(() => {
      result.current.onExistingProductBatchQuantityChange("2");
      result.current.onExistingProductBatchManufacturedDateChange("2026-04-01");
      result.current.onExistingProductBatchExpirationDateChange("2026-12-31");
      result.current.onExistingProductBatchCostPriceChange(1290);
      result.current.onExistingProductBatchSellingPriceChange(2490);
    });
    act(() => {
      result.current.onConfirmExistingProductBatchData();
    });

    expect(result.current.items[0]).toMatchObject({
      productId: "p-1",
      productName: "Café Torrado",
      quantity: 2,
      manufacturedDate: "2026-04-01",
      expirationDate: "2026-12-31",
      costPrice: 1290,
      sellingPrice: 2490,
    });
    expect(result.current.existingProductBatchForm.isOpen).toBe(false);
    expect(result.current.selectedProductId).toBe("");
  });

  it("confirma dados de lote sem exigir fabricação ou validade", () => {
    const { result } = renderHook(() =>
      useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }),
    );

    act(() => {
      result.current.onProductSelect(movementProducts[0]);
    });
    act(() => {
      result.current.onExistingProductBatchQuantityChange("2");
      result.current.onExistingProductBatchCostPriceChange(1290);
      result.current.onExistingProductBatchSellingPriceChange(2490);
    });
    act(() => {
      result.current.onConfirmExistingProductBatchData();
    });

    expect(result.current.items[0]).toMatchObject({
      productId: "p-1",
      productName: "Café Torrado",
      quantity: 2,
      costPrice: 1290,
      sellingPrice: 2490,
    });
    expect(result.current.existingProductBatchForm.error).toBeNull();
  });

  it("edita dados de lote de produto existente de entrada", () => {
    const { result } = renderHook(() => useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }));

    act(() => {
      result.current.form.setValue("items", [
        {
          productId: validExistingProductUuid,
          productName: "Café Torrado",
          quantity: 2,
          expirationDate: "2026-12-31",
        },
      ]);
    });
    act(() => {
      result.current.onEditExistingProductBatchData(0);
    });
    act(() => {
      result.current.onExistingProductBatchQuantityChange("3");
      result.current.onExistingProductBatchManufacturedDateChange("2026-04-01");
      result.current.onExistingProductBatchCostPriceChange(1290);
      result.current.onExistingProductBatchSellingPriceChange(2490);
    });
    act(() => {
      result.current.onConfirmExistingProductBatchData();
    });

    expect(result.current.form.getValues("items")[0]).toMatchObject({
      productId: validExistingProductUuid,
      quantity: 3,
      manufacturedDate: "2026-04-01",
      expirationDate: "2026-12-31",
      costPrice: 1290,
      sellingPrice: 2490,
    });
  });

  it("bloqueia criação de novo produto fora dos tipos de entrada", () => {
    fakeSearchParams.setType("USAGE");
    const { result } = renderHook(() => useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }));

    act(() => {
      result.current.onCreateNewProduct();
    });

    expect(result.current.addItemError).toBe(
      "Novos produtos só podem ser criados em movimentações de entrada.",
    );
    expect(fakeRouter.push).not.toHaveBeenCalled();
  });

  it("redireciona para inclusão de produto novo em movimento de entrada", async () => {
    const { result } = renderHook(() => useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }));

    await waitFor(() => {
      expect(fakeStorage.readStockMovementDraft).toHaveBeenCalled();
    });
    fakeStorage.writeStockMovementDraft.mockClear();

    act(() => {
      result.current.onProductSelect(movementProducts[0]);
    });
    act(() => {
      result.current.onQuantityChange("2");
      result.current.onAddItem();
    });
    await act(async () => {
      await result.current.onCreateNewProduct();
    });

    expect(fakeStorage.writeStockMovementDraft).toHaveBeenCalled();
    expect(fakeRouter.push).toHaveBeenCalledWith(
      "/stock-movements/create/new-product?type=PURCHASE_IN",
    );
  });

  it("adiciona item por código de barras em saída e impede duplicado imediato", async () => {
    fakeSearchParams.setType("USAGE");
    const { result } = renderHook(() => useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }));

    fakeApi.get.mockImplementation((url: string) => {
      if (url === "products/barcode/7891000000004") {
        return createJsonResponse({
          success: true,
          data: movementProducts[3],
        });
      }

      if (url === "products/barcode/7891000000005") {
        return createJsonResponse({
          success: true,
          data: movementProducts[0],
        });
      }

      return createJsonResponse(productListResponse);
    });

    act(() => {
      result.current.onQuantityChange("3");
    });
    await act(async () => {
      await result.current.onBarcodeScan("7891000000004");
    });
    expect(fakeApi.get).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.onBarcodeScan("7891000000004");
    });
    expect(fakeApi.get).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.onBarcodeScan("7891000000005");
    });

    expect(fakeToast.success).toHaveBeenCalledWith("Copo Térmico foi adicionado.");
    expect(fakeToast.success).toHaveBeenCalledWith("Café Torrado foi adicionado.");
    expect(fakeToast.error).toHaveBeenCalledTimes(0);
    expect(fakeApi.get).toHaveBeenCalledTimes(2);
    expect(result.current.form.getValues("items")).toHaveLength(2);
  });

  it("abre dados de lote por código de barras em ajuste de entrada", async () => {
    fakeSearchParams.setType("ADJUSTMENT_IN");
    const { result } = renderHook(() => useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }));

    await act(async () => {
      await result.current.onBarcodeScan("7891000000004");
    });

    expect(result.current.form.getValues("items")).toHaveLength(0);
    expect(result.current.existingProductBatchForm).toMatchObject({
      isOpen: true,
      productId: "p-4",
      productName: "Copo Térmico",
      quantity: "",
    });
  });

  it("abre modal de produto não encontrado quando produto não existe", async () => {
    const { result } = renderHook(() => useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }));

    await act(async () => {
      await result.current.onBarcodeScan("7891009999999");
    });

    expect(result.current.missingProductBarcode).toBe("7891009999999");
    expect(fakeToast.error).not.toHaveBeenCalled();
  });

  it("não abre modal de produto não encontrado quando barcode pertence a produto inline pendente", async () => {
    const { result } = renderHook(() =>
      useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }),
    );

    act(() => {
      result.current.form.setValue("items", [
        {
          quantity: 1,
          productName: "Produto Inline",
          newProductData: {
            name: "Produto Inline",
            barcode: "7891009999999",
          },
        },
      ]);
    });

    await act(async () => {
      await result.current.onBarcodeScan("7891009999999");
    });

    expect(result.current.missingProductBarcode).toBeNull();
    expect(fakeToast.warning).toHaveBeenCalledWith(
      "Produto Inline já está na movimentação como produto novo.",
    );
    expect(fakeToast.error).not.toHaveBeenCalled();
  });

  it("mostra aviso sem ação para tipo de saída", async () => {
    fakeSearchParams.setType("USAGE");
    const { result } = renderHook(() => useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }));

    await act(async () => {
      await result.current.onBarcodeScan("7891009999999");
    });

    expect(fakeToast.error).toHaveBeenCalledWith(
      "Produto com código 7891009999999 não existe.",
    );
    const lastCall = fakeToast.error.mock.calls.at(-1);
    expect(lastCall?.[1]).toBeUndefined();
  });

  it("não trata falha de rede do scanner como produto inexistente", async () => {
    fakeApi.get.mockImplementation(() => {
      throw new Error("timeout");
    });
    const { result } = renderHook(() =>
      useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }),
    );

    await act(async () => {
      await result.current.onBarcodeScan("7891009999999");
    });

    expect(result.current.missingProductBarcode).toBeNull();
    expect(fakeToast.error).toHaveBeenCalledWith(
      "Não foi possível consultar o código 7891009999999 (timeout). Verifique a conexão e tente novamente.",
    );
  });

  it("bloqueia produto existente quando há produto novo pendente com o mesmo barcode", async () => {
    fakeSearchParams.setType("USAGE");
    const { result } = renderHook(() =>
      useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }),
    );

    act(() => {
      result.current.form.setValue("items", [
        {
          quantity: 1,
          productName: "Produto Pendente",
          newProductData: {
            name: "Produto Pendente",
            barcode: "7891000000004",
            active: true,
            isKit: false,
            hasExpiration: false,
          },
        },
      ]);
    });

    await act(async () => {
      await result.current.onBarcodeScan("7891000000004");
    });

    expect(fakeToast.error).toHaveBeenCalledWith(
      'O código 7891000000004 já pertence ao produto novo "Produto Pendente" nesta movimentação. Remova-o antes de adicionar o produto existente.',
    );
    expect(result.current.form.getValues("items")).toHaveLength(1);

    act(() => {
      result.current.onProductSelect(movementProducts[3]);
    });

    expect(result.current.selectedProductId).toBe("");
    expect(result.current.addItemError).toBe(
      'O código 7891000000004 já pertence ao produto novo "Produto Pendente" nesta movimentação. Remova-o antes de adicionar o produto existente.',
    );
  });

  it("avisa ao abrir dados de lote de produto que já está na movimentação", () => {
    const { result } = renderHook(() =>
      useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }),
    );

    act(() => {
      result.current.form.setValue("items", [
        {
          productId: "p-1",
          productName: "Café Torrado",
          quantity: 2,
        },
      ]);
    });
    act(() => {
      result.current.onProductSelect(movementProducts[0]);
    });

    expect(result.current.existingProductBatchForm.isOpen).toBe(true);
    expect(result.current.existingProductBatchForm.repeatedProductWarning).toBe(
      "Café Torrado já está na movimentação. Este lote será adicionado como um novo item.",
    );
  });

  it("não restaura rascunho de outro warehouse", async () => {
    fakeStorage.setDraftState(
      createDraftState({ warehouseId: "wh-2", selectedProductId: "p-2" }),
    );

    const { result } = renderHook(() =>
      useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }),
    );

    await waitFor(() => {
      expect(fakeStorage.readStockMovementDraft).toHaveBeenCalled();
    });

    expect(result.current.form.getValues("notes")).toBe("");
    expect(result.current.selectedProductId).toBe("");
  });

  it("recusa lote com validade anterior à fabricação", () => {
    const { result } = renderHook(() =>
      useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }),
    );

    act(() => {
      result.current.onProductSelect(movementProducts[0]);
    });
    act(() => {
      result.current.onExistingProductBatchQuantityChange("2");
      result.current.onExistingProductBatchCostPriceChange(1290);
      result.current.onExistingProductBatchSellingPriceChange(2490);
      result.current.onExistingProductBatchManufacturedDateChange("2026-06-01");
      result.current.onExistingProductBatchExpirationDateChange("2026-01-01");
    });
    act(() => {
      result.current.onConfirmExistingProductBatchData();
    });

    expect(result.current.existingProductBatchForm.error).toBe(
      "A data de validade não pode ser anterior à data de fabricação.",
    );
    expect(result.current.items).toHaveLength(0);
  });

  it("abre editor de produto novo quando o item do índice é válido", async () => {
    const { result } = renderHook(() => useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }));

    await waitFor(() => {
      expect(fakeStorage.readStockMovementDraft).toHaveBeenCalled();
    });
    fakeStorage.writeStockMovementDraft.mockClear();

    act(() => {
      result.current.form.setValue("items", [
        {
          productName: "Produto novo",
          quantity: 2,
          newProductData: {
            name: "Produto novo",
            active: true,
            isKit: false,
            hasExpiration: false,
          },
        },
      ]);
    });

    await act(async () => {
      await result.current.onEditNewProductItem(0);
    });

    expect(fakeStorage.writeStockMovementDraft).toHaveBeenCalled();
    expect(fakeRouter.push).toHaveBeenCalledWith(
      "/stock-movements/create/new-product?type=PURCHASE_IN&editItem=0",
    );
  });

  it("não abre editor quando item não possui produto novo", () => {
    const { result } = renderHook(() => useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }));

    act(() => {
      result.current.form.setValue("items", [
        {
          productId: validExistingProductUuid,
          quantity: 2,
          productName: "Café Torrado",
        },
      ]);
    });

    act(() => {
      result.current.onEditNewProductItem(0);
    });

    expect(fakeRouter.push).not.toHaveBeenCalled();
  });

  it("envia movimentação sem produto novo com sucesso", async () => {
    const { result } = renderHook(() => useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }));
    const payload = createSubmitPayload();

    await act(async () => {
      await result.current.onSubmit(payload);
    });

    expect(fakeApi.post).toHaveBeenCalledWith("stock-movements", {
      json: {
        type: "PURCHASE_IN",
        notes: "Entrada automática",
        items: [
          {
            productId: validExistingProductUuid,
            quantity: 2,
          },
        ],
      },
    });
    expect(fakeToast.success).toHaveBeenCalledWith(
      "Movimentação criada com sucesso!",
    );
    expect(fakeStorage.clearStockMovementDraft).toHaveBeenCalledTimes(1);
    expect(fakeRouter.push).toHaveBeenCalledWith("/stock-movements");
    expect(result.current.isSubmitting).toBe(false);
  });

  it("envia imagem temporária e payload JSON quando há imagem inline", async () => {
    const { result } = renderHook(() => useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }));
    const payload = createInlineSubmitPayload();

    await act(async () => {
      await result.current.onSubmit(payload);
    });

    const [uploadUrl, uploadOptions] = fakeApi.post.mock.calls[0] as [
      string,
      { body?: FormData; json?: unknown },
    ];
    expect(uploadUrl).toBe("uploads/product-images/temp");
    expect(uploadOptions.body).toBeInstanceOf(FormData);

    const [movementUrl, movementOptions] = fakeApi.post.mock.calls.at(-1) as [
      string,
      { body?: FormData; json?: unknown },
    ];
    expect(movementUrl).toBe("stock-movements");
    expect(movementOptions.json).toMatchObject({
      items: [
        {
          imageUploadId: "11111111-1111-4111-8111-111111111111",
        },
      ],
    });
    expect(movementOptions.body).toBeUndefined();
  });

  it("não envia movimentação quando upload temporário falha", async () => {
    fakeApi.post.mockImplementation((url: string) => {
      if (url === "uploads/product-images/temp") {
        throw new Error("Falha no upload");
      }
      return Promise.resolve({});
    });
    const { result } = renderHook(() => useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }));

    await act(async () => {
      await result.current.onSubmit(createInlineSubmitPayload());
    });

    expect(fakeApi.post).toHaveBeenCalledTimes(1);
    expect(fakeToast.error).toHaveBeenCalledWith("Falha no upload");
    expect(fakeStorage.clearStockMovementDraft).not.toHaveBeenCalled();
    expect(fakeRouter.push).not.toHaveBeenCalledWith("/stock-movements");
  });

  it("mostra erro no envio e mantém estado", async () => {
    fakeApi.post.mockRejectedValue(new Error("Falha ao salvar"));
    const { result } = renderHook(() => useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }));

    await act(async () => {
      await result.current.onSubmit(createSubmitPayload());
    });

    expect(fakeToast.error).toHaveBeenCalledWith("Falha ao salvar");
    expect(fakeStorage.clearStockMovementDraft).not.toHaveBeenCalled();
    expect(result.current.isSubmitting).toBe(false);
    expect(fakeRouter.push).not.toHaveBeenCalledWith("/stock-movements");
  });

  it("não envia quando tipo não foi selecionado", async () => {
    fakeSearchParams.setType(null);
    const { result } = renderHook(() => useCreateStockMovementModel({ typeParam: fakeSearchParams.get("type") }));

    await act(async () => {
      await result.current.onSubmit(createSubmitPayload());
    });

    expect(fakeApi.post).not.toHaveBeenCalled();
    expect(fakeRouter.replace).toHaveBeenCalledWith("/stock-movements");
  });
});
