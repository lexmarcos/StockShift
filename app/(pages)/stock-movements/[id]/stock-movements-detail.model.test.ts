import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  computeTotalQuantity,
  formatItemQuantity,
  formatMovementDateTime,
  mergeItemsWithImages,
  resolveDetailTitle,
  resolveTypeBadge,
  useStockMovementDetailModel,
} from "./stock-movements-detail.model";
import type {
  ProductImageResponse,
  StockMovement,
  StockMovementDetailResponse,
} from "./stock-movements-detail.types";
import type { StockMovementType } from "../stock-movements.types";

type JsonResponse<T> = {
  json: () => Promise<T>;
};

type SwrState<T> = {
  data?: T;
  error: Error | null;
  isLoading: boolean;
};

const fakeSWR = vi.hoisted(() => {
  class FakeStockMovementDetailSWR {
    private readonly responses = new Map<string | null, SwrState<unknown>>();

    private readonly fallback: SwrState<unknown> = {
      data: undefined,
      error: null,
      isLoading: false,
    };

    public readonly hook = vi.fn<
      (
        key: string | null,
        fetcher?: unknown,
        options?: unknown,
      ) => SwrState<unknown>
    >((key) => this.responses.get(key) ?? this.fallback);

    public setState<T>(key: string | null, state: SwrState<T>): void {
      this.responses.set(key, state as SwrState<unknown>);
    }

    public reset(): void {
      this.responses.clear();
      this.hook.mockClear();
    }
  }

  return new FakeStockMovementDetailSWR();
});

const fakeApi = vi.hoisted(() => {
  class FakeStockMovementDetailApi {
    public readonly get = vi.fn<(url: string) => JsonResponse<unknown>>();
  }

  return new FakeStockMovementDetailApi();
});

const fakeBreadcrumb = vi.hoisted(() => {
  class FakeStockMovementDetailBreadcrumb {
    public readonly useBreadcrumb = vi.fn<
      (payload: { title: string; backUrl: string }) => void
    >();
  }

  return new FakeStockMovementDetailBreadcrumb();
});

vi.mock("swr", () => ({
  default: (...args: Parameters<typeof fakeSWR.hook>) => fakeSWR.hook(...args),
}));

vi.mock("@/lib/api", () => ({
  api: fakeApi,
}));

vi.mock("@/components/breadcrumb", () => ({
  useBreadcrumb: (...args: Parameters<typeof fakeBreadcrumb.useBreadcrumb>) =>
    fakeBreadcrumb.useBreadcrumb(...args),
}));

const createJsonResponse = <T,>(payload: T): JsonResponse<T> => ({
  json: vi.fn(async () => payload),
});

const createMovement = (
  overrides: Partial<StockMovement> = {},
): StockMovement => ({
  id: "movement-1",
  code: "MOV-0001",
  warehouseId: "warehouse-1",
  warehouseName: "Estoque Central",
  type: "PURCHASE_IN",
  direction: "IN",
  notes: "Compra inicial",
  createdByUserId: "user-1",
  referenceType: null,
  referenceId: null,
  createdAt: "2026-01-15T10:30:00",
  updatedAt: "2026-01-15T11:45:00",
  items: [
    {
      id: "item-1",
      productId: "product-1",
      productName: "Café Especial",
      productSku: "CAF-001",
      batchId: "batch-1",
      batchCode: "L001",
      quantity: 2,
      productImageUrl: null,
    },
    {
      id: "item-2",
      productId: "product-2",
      productName: "Filtro de Papel",
      productSku: null,
      batchId: "batch-2",
      batchCode: "L002",
      quantity: 1.5,
      productImageUrl: "/existing-image.png",
    },
  ],
  ...overrides,
});

const movementFixture = createMovement();

const movementResponse: StockMovementDetailResponse = {
  success: true,
  message: null,
  data: movementFixture,
};

beforeEach(() => {
  vi.clearAllMocks();
  fakeSWR.reset();
  fakeApi.get.mockReturnValue(
    createJsonResponse<ProductImageResponse>({
      success: true,
      data: { id: "product-1", imageUrl: "/product-1.png" },
    }),
  );
  fakeSWR.setState("stock-movements/movement-1", {
    data: movementResponse,
    error: null,
    isLoading: false,
  });
});

describe("formatMovementDateTime", () => {
  it("formata uma data válida no padrão de detalhe", () => {
    expect(formatMovementDateTime("2026-01-15T10:30:00")).toMatch(
      /15 de jan\.?, 2026 às 10:30/,
    );
  });

  it("retorna traço para data vazia ou inválida", () => {
    expect(formatMovementDateTime(null)).toBe("-");
    expect(formatMovementDateTime(undefined)).toBe("-");
    expect(formatMovementDateTime("data-invalida")).toBe("-");
  });
});

describe("formatItemQuantity", () => {
  it("mantém inteiros sem casas decimais", () => {
    expect(formatItemQuantity(4)).toBe("4");
  });

  it("formata decimais com duas casas", () => {
    expect(formatItemQuantity(4.5)).toBe("4.50");
  });
});

describe("computeTotalQuantity", () => {
  it("soma as quantidades dos itens", () => {
    expect(computeTotalQuantity(movementFixture)).toBe("3.50");
  });

  it("retorna zero quando a movimentação não existe ou não possui itens", () => {
    expect(computeTotalQuantity(null)).toBe("0");
    expect(computeTotalQuantity(createMovement({ items: [] }))).toBe("0");
  });
});

describe("resolveTypeBadge", () => {
  const badgeCases: Array<{
    type: StockMovementType;
    label: string;
    icon: "in" | "out";
  }> = [
    { type: "PURCHASE_IN", label: "Compra", icon: "in" },
    { type: "ADJUSTMENT_IN", label: "Ajuste de Entrada", icon: "in" },
    { type: "TRANSFER_IN", label: "Transferência (Entrada)", icon: "in" },
    { type: "USAGE", label: "Uso", icon: "out" },
    { type: "GIFT", label: "Presente", icon: "out" },
    { type: "LOSS", label: "Perda", icon: "out" },
    { type: "DAMAGE", label: "Dano", icon: "out" },
    { type: "ADJUSTMENT_OUT", label: "Ajuste de Saída", icon: "out" },
    { type: "SALE", label: "Venda", icon: "out" },
    { type: "TRANSFER_OUT", label: "Transferência (Saída)", icon: "out" },
  ];

  it.each(badgeCases)("resolve badge para $type", ({ type, label, icon }) => {
    expect(resolveTypeBadge(createMovement({ type }))).toEqual(
      expect.objectContaining({ label, icon }),
    );
  });

  it("retorna null quando não há movimentação", () => {
    expect(resolveTypeBadge(null)).toBeNull();
  });
});

describe("resolveDetailTitle", () => {
  it("usa o código da movimentação quando disponível", () => {
    expect(resolveDetailTitle(movementFixture, false, false)).toBe("MOV-0001");
  });

  it("usa título de carregamento apenas sem erro", () => {
    expect(resolveDetailTitle(null, false, true)).toBe("Carregando...");
  });

  it("usa título de não encontrado quando falha ou termina sem dados", () => {
    expect(resolveDetailTitle(null, true, true)).toBe(
      "Movimentação não encontrada",
    );
    expect(resolveDetailTitle(null, false, false)).toBe(
      "Movimentação não encontrada",
    );
  });
});

describe("mergeItemsWithImages", () => {
  it("usa imagens carregadas e mantém fallback quando o mapa retorna null", () => {
    const items = mergeItemsWithImages(
      movementFixture,
      new Map([
        ["product-1", "/product-1.png"],
        ["product-2", null],
      ]),
    );

    expect(items[0].productImageUrl).toBe("/product-1.png");
    expect(items[1].productImageUrl).toBe("/existing-image.png");
  });

  it("usa imagem existente do item quando o mapa não tem o produto", () => {
    const items = mergeItemsWithImages(
      movementFixture,
      new Map([["product-1", "/product-1.png"]]),
    );

    expect(items[1].productImageUrl).toBe("/existing-image.png");
  });

  it("retorna lista vazia sem movimentação", () => {
    expect(mergeItemsWithImages(null, undefined)).toEqual([]);
  });
});

describe("useStockMovementDetailModel", () => {
  it("carrega detalhes, registra breadcrumb e expõe dados derivados", () => {
    fakeSWR.setState("stock-movement-product-images:product-1,product-2", {
      data: new Map([
        ["product-1", "/product-1.png"],
        ["product-2", "/product-2.png"],
      ]),
      error: null,
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useStockMovementDetailModel("movement-1"),
    );

    expect(fakeSWR.hook).toHaveBeenCalledWith(
      "stock-movements/movement-1",
      expect.any(Function),
      expect.objectContaining({
        shouldRetryOnError: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }),
    );
    expect(fakeSWR.hook).toHaveBeenCalledWith(
      "stock-movement-product-images:product-1,product-2",
      expect.any(Function),
      expect.objectContaining({
        shouldRetryOnError: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }),
    );
    expect(result.current.movement).toEqual(movementFixture);
    expect(result.current.items.map((item) => item.productImageUrl)).toEqual([
      "/product-1.png",
      "/product-2.png",
    ]);
    expect(result.current.typeBadge?.label).toBe("Compra");
    expect(result.current.totalQuantity).toBe("3.50");
    expect(result.current.itemCount).toBe(2);
    expect(result.current.hasReference).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(fakeBreadcrumb.useBreadcrumb).toHaveBeenCalledWith({
      title: "MOV-0001",
      backUrl: "/stock-movements",
    });
  });

  it("usa ids únicos para carregar imagens de produtos", () => {
    const movementWithDuplicateProduct = createMovement({
      items: [
        movementFixture.items[0],
        { ...movementFixture.items[0], id: "item-duplicate", batchId: "batch-3" },
        movementFixture.items[1],
      ],
    });
    fakeSWR.setState("stock-movements/movement-duplicate", {
      data: {
        success: true,
        message: null,
        data: movementWithDuplicateProduct,
      },
      error: null,
      isLoading: false,
    });

    renderHook(() => useStockMovementDetailModel("movement-duplicate"));

    expect(fakeSWR.hook).toHaveBeenCalledWith(
      "stock-movement-product-images:product-1,product-2",
      expect.any(Function),
      expect.any(Object),
    );
  });

  it("busca imagens pelo fetcher do segundo SWR e tolera falhas por produto", async () => {
    fakeSWR.setState("stock-movements/image-failure", {
      data: {
        success: true,
        message: null,
        data: createMovement({
          id: "image-failure",
          items: [
            {
              ...movementFixture.items[1],
              productImageUrl: null,
            },
          ],
        }),
      },
      error: null,
      isLoading: false,
    });
    fakeApi.get.mockImplementation((url: string) => {
      if (url === "products/product-2") {
        return {
          json: vi.fn(async () => {
            throw new Error("Imagem indisponível");
          }),
        };
      }

      return createJsonResponse<ProductImageResponse>({
        success: true,
        data: { id: "product-1", imageUrl: "/product-1.png" },
      });
    });

    renderHook(() => useStockMovementDetailModel("image-failure"));
    const imageFetcher = fakeSWR.hook.mock.calls.find(
      ([key]) => key === "stock-movement-product-images:product-2",
    )?.[1];

    expect(typeof imageFetcher).toBe("function");
    const imageMap = await (imageFetcher as () => Promise<
      Map<string, string | null>
    >)();

    expect(fakeApi.get).toHaveBeenCalledWith("products/product-2");
    expect(imageMap).toEqual(new Map([["product-2", null]]));
  });

  it("não faz requisição sem id e registra estado não encontrado", () => {
    const { result } = renderHook(() => useStockMovementDetailModel(""));

    expect(fakeSWR.hook).toHaveBeenCalledWith(
      null,
      expect.any(Function),
      expect.any(Object),
    );
    expect(result.current.movement).toBeNull();
    expect(result.current.items).toEqual([]);
    expect(result.current.totalQuantity).toBe("0");
    expect(result.current.itemCount).toBe(0);
    expect(result.current.hasReference).toBe(false);
    expect(fakeBreadcrumb.useBreadcrumb).toHaveBeenCalledWith({
      title: "Movimentação não encontrada",
      backUrl: "/stock-movements",
    });
  });

  it("mantém carregamento somente enquanto não há erro", () => {
    fakeSWR.setState("stock-movements/loading", {
      data: undefined,
      error: null,
      isLoading: true,
    });

    const { result } = renderHook(() => useStockMovementDetailModel("loading"));

    expect(result.current.isLoading).toBe(true);
    expect(fakeBreadcrumb.useBreadcrumb).toHaveBeenCalledWith({
      title: "Carregando...",
      backUrl: "/stock-movements",
    });
  });

  it("expõe erro e interrompe loading quando a requisição falha", () => {
    const requestError = new Error("Movimentação indisponível");
    fakeSWR.setState("stock-movements/missing", {
      data: undefined,
      error: requestError,
      isLoading: true,
    });

    const { result } = renderHook(() => useStockMovementDetailModel("missing"));

    expect(result.current.movement).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(requestError);
    expect(result.current.typeBadge).toBeNull();
    expect(fakeBreadcrumb.useBreadcrumb).toHaveBeenCalledWith({
      title: "Movimentação não encontrada",
      backUrl: "/stock-movements",
    });
  });

  it("marca referência quando a movimentação possui referenceId", () => {
    fakeSWR.setState("stock-movements/with-reference", {
      data: {
        success: true,
        message: null,
        data: createMovement({
          id: "with-reference",
          referenceType: "TRANSFER",
          referenceId: "transfer-1",
        }),
      },
      error: null,
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useStockMovementDetailModel("with-reference"),
    );

    expect(result.current.hasReference).toBe(true);
  });
});
