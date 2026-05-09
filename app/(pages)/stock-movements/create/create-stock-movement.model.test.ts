import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCreateStockMovementModel } from "./create-stock-movement.model";
import {
  buildMovementPayload,
  filterStockMovementProductOptions,
  formatStockMovementProductLabel,
  shouldShowStockMovementFooter,
} from "./create-stock-movement.model";
import type { CreateStockMovementSchema } from "./create-stock-movement.schema";
import type { StockMovementDraft } from "./create-stock-movement.storage";
import type { StockMovementProductOption } from "./create-stock-movement.types";

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
      this.defaultState.mutate.mockClear();
      this.hook.mockClear();
    }
  }

  return new FakeSWR();
});

const fakeApi = vi.hoisted(() => {
  class FakeApi {
    public readonly get = vi.fn<(url: string) => Promise<JsonResponse<unknown>>>();
    public readonly post = vi.fn<(url: string, body: { json?: unknown; body?: unknown }) => Promise<unknown>>();
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
  }

  return new FakeToast();
});

const fakeStorage = vi.hoisted(() => {
  class FakeStorage {
    private draftState: StockMovementDraft | null = null;

    public readonly readStockMovementDraft = vi.fn<() => StockMovementDraft | null>(() => {
      return this.draftState;
    });
    public readonly writeStockMovementDraft = vi.fn<(draft: StockMovementDraft) => void>(
      (draft) => {
        this.draftState = draft;
      },
    );
    public readonly clearStockMovementDraft = vi.fn(() => {
      this.draftState = null;
    });

    public setDraftState(draft: StockMovementDraft | null): void {
      this.draftState = draft;
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
  default: (...args: unknown[]) => fakeSWR.hook(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: (...args: unknown[]) => fakeRouter.push(...args),
    replace: (...args: unknown[]) => fakeRouter.replace(...args),
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

vi.mock("@/lib/api", () => ({
  api: fakeApi,
}));

vi.mock("./create-stock-movement.storage", () => ({
  readStockMovementDraft: () => fakeStorage.readStockMovementDraft(),
  writeStockMovementDraft: (draft: StockMovementDraft) =>
    fakeStorage.writeStockMovementDraft(draft),
  clearStockMovementDraft: () => fakeStorage.clearStockMovementDraft(),
  inlineProductImageToFile: (image: {
    name: string;
    type: string;
    dataUrl: string;
  }): File =>
    new File(["img"], image.name, {
      type: image.type,
    }),
  fileToInlineProductImage: (file: File) =>
    Promise.resolve({
      name: file.name,
      type: file.type,
      dataUrl: "data:image/png;base64,YQ==",
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

const barcodeIndex: Record<string, StockMovementProductOption> = {
  "7891000000004": movementProducts[3],
  "7891000000005": movementProducts[0],
  "7891000000006": movementProducts[0],
};

const createDraftState = (
  overrides?: Partial<StockMovementDraft>,
): StockMovementDraft => ({
  type: "PURCHASE_IN",
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
          dataUrl: "data:image/png;base64,ZmFrZQ==",
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
  fakeStorage.readStockMovementDraft.mockClear();
  fakeStorage.writeStockMovementDraft.mockClear();
  fakeRouter.push.mockClear();
  fakeRouter.replace.mockClear();
  fakeToast.success.mockClear();
  fakeToast.error.mockClear();
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
      if (!product) throw new Error(`Produto com código ${barcode} não existe.`);
      return createJsonResponse({
        success: true,
        data: product,
      });
    }

    return createJsonResponse(productListResponse);
  });

  fakeApi.post.mockResolvedValue({});
});

describe("helpers de produto", () => {
  const products: StockMovementProductOption[] = movementProducts;

  it("exige pelo menos dois caracteres para filtrar", () => {
    expect(filterStockMovementProductOptions(products, " c ")).toEqual([]);
  });

  it("busca por nome, sku e código de barras", () => {
    expect(filterStockMovementProductOptions(products, "fil")[0].id).toBe("p-2");
    expect(filterStockMovementProductOptions(products, "ACU")[0].id).toBe("p-3");
    expect(filterStockMovementProductOptions(products, "0001")[0].id).toBe("p-1");
  });

  it("limita os resultados da busca para cinco itens", () => {
    const manyProducts = Array.from({ length: 6 }, (_, index) => ({
      id: `extra-${index}`,
      name: `Produto ${index}`,
    }));

    expect(filterStockMovementProductOptions(manyProducts, "produto")).toHaveLength(5);
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

    expect(payload.items[0].newProduct?.hasExpiration).toBe(true);
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
    const { result } = renderHook(() => useCreateStockMovementModel());

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

  it("impede inicialização sem tipo válido e redireciona", () => {
    fakeSearchParams.setType(null);
    renderHook(() => useCreateStockMovementModel());

    expect(fakeToast.error).toHaveBeenCalledWith(
      "Selecione o tipo de movimentação antes de continuar.",
    );
    expect(fakeRouter.replace).toHaveBeenCalledWith("/stock-movements");
  });

  it("carrega rascunho existente e limpa do storage", () => {
    fakeStorage.setDraftState(
      createDraftState({
        selectedProductId: "p-2",
        itemQuantity: "7",
      }),
    );

    const { result } = renderHook(() => useCreateStockMovementModel());

    expect(fakeStorage.readStockMovementDraft).toHaveBeenCalledTimes(1);
    expect(fakeStorage.clearStockMovementDraft).toHaveBeenCalledTimes(1);
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
    expect(result.current.selectedProductId).toBe("");
    expect(result.current.itemQuantity).toBe("");
  });

  it("aplica debounce de busca de produto", () => {
    vi.useFakeTimers();

    try {
      const { result } = renderHook(() => useCreateStockMovementModel());

      act(() => {
        result.current.onProductSearchFocus();
        result.current.onProductSearchChange("filtro");
      });
      expect(result.current.productOptions).toEqual([]);
      expect(result.current.isProductSearchLoading).toBe(false);

      act(() => {
        vi.advanceTimersByTime(350);
      });
      expect(result.current.productOptions).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("mantém produto selecionado quando busca bate com rótulo completo", () => {
    const { result } = renderHook(() => useCreateStockMovementModel());

    act(() => {
      result.current.onProductSelect(movementProducts[0]);
      result.current.onProductSearchChange("Café Torrado (CAF-01)");
    });

    expect(result.current.selectedProductId).toBe("p-1");
  });

  it("limpa produto selecionado quando busca muda", () => {
    const { result } = renderHook(() => useCreateStockMovementModel());

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
    const { result } = renderHook(() => useCreateStockMovementModel());

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
    const { result } = renderHook(() => useCreateStockMovementModel());

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
    const { result } = renderHook(() => useCreateStockMovementModel());

    act(() => {
      result.current.onProductSelect(movementProducts[0]);
    });
    act(() => {
      result.current.onQuantityChange("2");
    });
    act(() => {
      result.current.onAddItem();
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.existingProductBatchForm).toMatchObject({
      isOpen: true,
      productId: "p-1",
      productName: "Café Torrado",
      quantity: "2",
      editingIndex: null,
    });
  });

  it("confirma dados de lote e adiciona item com datas e preços", () => {
    const { result } = renderHook(() => useCreateStockMovementModel());

    act(() => {
      result.current.onProductSelect(movementProducts[0]);
    });
    act(() => {
      result.current.onQuantityChange("2");
    });
    act(() => {
      result.current.onAddItem();
    });
    act(() => {
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

  it("edita dados de lote de produto existente de entrada", () => {
    const { result } = renderHook(() => useCreateStockMovementModel());

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
    });
  });

  it("bloqueia criação de novo produto fora dos tipos de entrada", () => {
    fakeSearchParams.setType("USAGE");
    const { result } = renderHook(() => useCreateStockMovementModel());

    act(() => {
      result.current.onCreateNewProduct();
    });

    expect(result.current.addItemError).toBe(
      "Novos produtos só podem ser criados em movimentações de entrada.",
    );
    expect(fakeRouter.push).not.toHaveBeenCalled();
  });

  it("redireciona para inclusão de produto novo em movimento de entrada", () => {
    const { result } = renderHook(() => useCreateStockMovementModel());

    act(() => {
      result.current.onProductSelect(movementProducts[0]);
    });
    act(() => {
      result.current.onQuantityChange("2");
      result.current.onAddItem();
    });
    act(() => {
      result.current.onCreateNewProduct();
    });

    expect(fakeStorage.writeStockMovementDraft).toHaveBeenCalled();
    expect(fakeRouter.push).toHaveBeenCalledWith(
      "/stock-movements/create/new-product?type=PURCHASE_IN",
    );
  });

  it("adiciona item por código de barras em saída e impede duplicado imediato", async () => {
    fakeSearchParams.setType("USAGE");
    const { result } = renderHook(() => useCreateStockMovementModel());

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
    const { result } = renderHook(() => useCreateStockMovementModel());

    await act(async () => {
      await result.current.onBarcodeScan("7891000000004");
    });

    expect(result.current.form.getValues("items")).toHaveLength(0);
    expect(result.current.existingProductBatchForm).toMatchObject({
      isOpen: true,
      productId: "p-4",
      productName: "Copo Térmico",
      quantity: "1",
    });
  });

  it("mostra erro com ação para criação quando produto não existe", async () => {
    fakeApi.get.mockRejectedValue(new Error("não encontrado"));

    const { result } = renderHook(() => useCreateStockMovementModel());

    await act(async () => {
      await result.current.onBarcodeScan("7891009999999");
    });

    const lastCall = fakeToast.error.mock.calls.at(-1);
    expect(lastCall?.[0]).toBe("Produto com código 7891009999999 não existe.");
    expect(lastCall?.[1]).toMatchObject({
      action: {
        label: "Criar Produto",
      },
    });
  });

  it("mostra aviso sem ação para tipo de saída", async () => {
    fakeSearchParams.setType("USAGE");
    const { result } = renderHook(() => useCreateStockMovementModel());
    fakeApi.get.mockRejectedValue(new Error("não encontrado"));

    await act(async () => {
      await result.current.onBarcodeScan("7891009999999");
    });

    expect(fakeToast.error).toHaveBeenCalledWith(
      "Produto com código 7891009999999 não existe.",
    );
    const lastCall = fakeToast.error.mock.calls.at(-1);
    expect(lastCall?.[1]).toBeUndefined();
  });

  it("abre editor de produto novo quando o item do índice é válido", () => {
    const { result } = renderHook(() => useCreateStockMovementModel());

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

    act(() => {
      result.current.onEditNewProductItem(0);
    });

    expect(fakeStorage.writeStockMovementDraft).toHaveBeenCalled();
    expect(fakeRouter.push).toHaveBeenCalledWith(
      "/stock-movements/create/new-product?type=PURCHASE_IN&editItem=0",
    );
  });

  it("não abre editor quando item não possui produto novo", () => {
    const { result } = renderHook(() => useCreateStockMovementModel());

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
    const { result } = renderHook(() => useCreateStockMovementModel());
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
    expect(fakeRouter.push).toHaveBeenCalledWith("/stock-movements");
    expect(result.current.isSubmitting).toBe(false);
  });

  it("envia payload multipart quando há imagem inline", async () => {
    const { result } = renderHook(() => useCreateStockMovementModel());
    const payload = createInlineSubmitPayload();

    await act(async () => {
      await result.current.onSubmit(payload);
    });

    const [, options] = fakeApi.post.mock.calls.at(-1) as [
      string,
      { body?: FormData; json?: unknown },
    ];
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.body?.getAll("inlineProductImages")).toHaveLength(1);
  });

  it("mostra erro no envio e mantém estado", async () => {
    fakeApi.post.mockRejectedValue(new Error("Falha ao salvar"));
    const { result } = renderHook(() => useCreateStockMovementModel());

    await act(async () => {
      await result.current.onSubmit(createSubmitPayload());
    });

    expect(fakeToast.error).toHaveBeenCalledWith("Falha ao salvar");
    expect(result.current.isSubmitting).toBe(false);
    expect(fakeRouter.push).not.toHaveBeenCalledWith("/stock-movements");
  });

  it("não envia quando tipo não foi selecionado", async () => {
    fakeSearchParams.setType(null);
    const { result } = renderHook(() => useCreateStockMovementModel());

    await act(async () => {
      await result.current.onSubmit(createSubmitPayload());
    });

    expect(fakeApi.post).not.toHaveBeenCalled();
    expect(fakeRouter.replace).toHaveBeenCalledWith("/stock-movements");
  });
});
