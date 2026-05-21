import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useNewProductInlineModel } from "./new-product-inline.model";
import type { ProductCreateFormData } from "../../../products/create/products-create.types";
import type { StockMovementDraft } from "../create-stock-movement.storage";

const mockSWR = vi.fn();
const mockGet = vi.fn();
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRedirect = vi.fn((url: string): never => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
const mockWriteDraft = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

let movementType: string | null = "PURCHASE_IN";
let editItemQuery: string | null = null;
let currentDraft: StockMovementDraft | null = null;
let loadingCategories = false;
let loadingBrands = false;

const categoriesResponse = {
  success: true,
  message: null,
  data: [{ id: "c1", name: "Bebidas" }],
};

const brandsResponse = {
  success: true,
  message: null,
  data: [{ id: "b1", name: "Marca A" }],
};

const createDraft = (overrides?: Partial<StockMovementDraft>): StockMovementDraft => ({
  schemaVersion: 1,
  updatedAt: "2026-01-20T09:00:00.000Z",
  type: "PURCHASE_IN",
  notes: "",
  items: [],
  selectedProductId: "",
  itemQuantity: "",
  inlineProductBarcode: "7891000000001",
  ...overrides,
});

const buildFormData = (
  overrides: Partial<ProductCreateFormData> = {},
): ProductCreateFormData => ({
  name: "Novo produto",
  description: "",
  barcode: "",
  categoryId: "",
  brandId: "",
  isKit: false,
  hasExpiration: false,
  active: true,
  continuousMode: false,
  attributes: { weight: "", dimensions: "" },
  quantity: 1,
  manufacturedDate: "",
  expirationDate: "",
  costPrice: undefined,
  sellingPrice: undefined,
  ...overrides,
});

vi.mock("swr", () => ({
  default: (...args: unknown[]) =>
    mockSWR(...args) ?? {
      data: null,
      isLoading: false,
      error: null,
      mutate: vi.fn(),
    },
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
  useRouter: () => ({
    push: (...args: unknown[]) => mockPush(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
  }),
  useSearchParams: () => ({
    get: (key: string) =>
      key === "type" ? movementType : key === "editItem" ? editItemQuery : null,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

vi.mock("@/components/breadcrumb", () => ({
  useBreadcrumb: vi.fn(),
}));

vi.mock("../create-stock-movement.storage", () => ({
  fileToInlineProductImage: async (file: File) => ({
    name: file.name,
    type: file.type,
    dataUrl: "data:application/octet-stream;base64,Yg==",
  }),
  inlineProductImageToFile: (image: {
    name: string;
    type: string;
    dataUrl: string;
  }) => new File(["x"], image.name, { type: image.type }),
  readStockMovementDraft: async () => currentDraft,
  writeStockMovementDraft: async (draft: StockMovementDraft) => {
    currentDraft = draft;
    mockWriteDraft(draft);
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  movementType = "PURCHASE_IN";
  editItemQuery = null;
  currentDraft = createDraft();
  loadingCategories = false;
  loadingBrands = false;

  mockSWR.mockImplementation((key: unknown) => {
    if (key === "categories") {
      return {
        data: categoriesResponse,
        isLoading: loadingCategories,
        error: null,
        mutate: vi.fn(),
      };
    }

    if (key === "brands") {
      return {
        data: brandsResponse,
        isLoading: loadingBrands,
        error: null,
        mutate: vi.fn(),
      };
    }

    return {
      data: null,
      isLoading: false,
      error: null,
      mutate: vi.fn(),
    };
  });

  mockGet.mockImplementation(() => ({
    json: vi.fn(async () => ({
      success: true,
      message: "ok",
      data: [],
    })),
  }));

  Object.defineProperty(window, "scrollTo", {
    value: vi.fn(),
    writable: true,
  });
});

describe("useNewProductInlineModel", () => {
  it("inicializa estado para criação com formulário limpo e sem edição", async () => {
    const { result } = renderHook(() => useNewProductInlineModel({ movementType, editItem: editItemQuery }));

    await waitFor(() => {
      expect(result.current.form.getValues("barcode")).toBe("7891000000001");
    });

    expect(result.current.mode).toBe("inline");
    expect(result.current.isInlineEdit).toBe(false);
    expect(result.current.cancelHref).toBe("/stock-movements/create?type=PURCHASE_IN");
    expect(result.current.categories).toEqual(categoriesResponse.data);
    expect(result.current.brands).toEqual(brandsResponse.data);
    expect(result.current.isLoadingCategories).toBe(false);
    expect(result.current.isLoadingBrands).toBe(false);
    expect(result.current.customAttributes).toEqual([]);
    expect(result.current.form.getValues("name")).toBe("");
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("preenche estado de edição a partir do draft com atributo customizado", async () => {
    currentDraft = createDraft({
      items: [
        {
          quantity: 2,
          productName: "Produto Antigo",
          newProductData: {
            name: "Produto Antigo",
            description: "Desc",
            barcode: "123",
            attributes: {
              weight: "1kg",
              dimensions: "20x30",
              cor: "azul",
            },
            active: true,
            isKit: false,
            hasExpiration: false,
          },
        },
      ],
    });
    editItemQuery = "0";

    const { result } = renderHook(() => useNewProductInlineModel({ movementType, editItem: editItemQuery }));

    await waitFor(() => {
      expect(result.current.isInlineEdit).toBe(true);
    });
    expect(result.current.form.getValues("name")).toBe("Produto Antigo");
    expect(result.current.form.getValues("description")).toBe("Desc");
    expect(result.current.form.getValues("barcode")).toBe("123");
    expect(result.current.customAttributes).toEqual([
      { id: "inline-cor", key: "cor", value: "azul" },
    ]);
  });

  it("restaura imagem do produto inline ao editar item do draft", async () => {
    currentDraft = createDraft({
      items: [
        {
          quantity: 2,
          productName: "Produto com imagem",
          newProductData: {
            name: "Produto com imagem",
            image: {
              name: "inline.png",
              type: "image/png",
              dataUrl: "data:image/png;base64,YQ==",
            },
          },
        },
      ],
    });
    editItemQuery = "0";

    const { result } = renderHook(() =>
      useNewProductInlineModel({ movementType, editItem: editItemQuery }),
    );

    await waitFor(() => {
      expect(result.current.productImage?.name).toBe("inline.png");
    });
    expect(result.current.productImage?.type).toBe("image/png");
  });

  it("controla a lista de atributos customizados (adicionar, editar, remover)", () => {
    const { result } = renderHook(() => useNewProductInlineModel({ movementType, editItem: editItemQuery }));

    act(() => {
      result.current.addCustomAttribute();
    });
    expect(result.current.customAttributes).toHaveLength(1);

    act(() => {
      result.current.updateCustomAttribute(0, "key", "cor");
      result.current.updateCustomAttribute(0, "value", "azul");
    });

    expect(result.current.customAttributes[0]).toMatchObject({
      key: "cor",
      value: "azul",
    });

    act(() => {
      result.current.removeCustomAttribute(0);
    });

    expect(result.current.customAttributes).toEqual([]);
  });

  it("bloqueia envio com atributo customizado incompleto", async () => {
    const { result } = renderHook(() => useNewProductInlineModel({ movementType, editItem: editItemQuery }));

    act(() => {
      result.current.addCustomAttribute();
      result.current.updateCustomAttribute(0, "key", "cor");
      result.current.updateCustomAttribute(0, "value", "");
    });

    await act(async () => {
      await result.current.onSubmit(buildFormData());
    });

    expect(toastError).toHaveBeenCalledWith("Atributo 1: Nome e valor são obrigatórios");
    expect(mockWriteDraft).not.toHaveBeenCalled();
    expect(result.current.isSubmitting).toBe(false);
  });

  it("recusa produto com nome duplicado no mesmo rascunho", async () => {
    currentDraft = createDraft({
      items: [
        {
          quantity: 1,
          productName: "Produto A",
          newProductData: { name: "Produto A" },
        },
      ],
    });
    const { result } = renderHook(() => useNewProductInlineModel({ movementType, editItem: editItemQuery }));

    await act(async () => {
      await result.current.onSubmit(
        buildFormData({
          name: "produto a",
          quantity: 1,
        }),
      );
    });

    expect(toastError).toHaveBeenCalledWith(
      'O produto "produto a" já foi adicionado nesta movimentação.',
    );
    expect(mockWriteDraft).not.toHaveBeenCalled();
    expect(result.current.form.getValues("name")).toBe("");
    expect(result.current.isSubmitting).toBe(false);
  });

  it("inclui produto no rascunho e mantém formulário para próximo item no modo contínuo", async () => {
    const initial = createDraft({
      items: [
        {
          quantity: 1,
          productName: "Item Existente",
          newProductData: { name: "Item Existente", description: "Primeiro" },
        },
      ],
    });
    currentDraft = initial;
    const { result } = renderHook(() => useNewProductInlineModel({ movementType, editItem: editItemQuery }));

    await waitFor(() => {
      expect(result.current.form.getValues("barcode")).toBe("7891000000001");
    });

    await act(async () => {
      await result.current.onSubmit(
        buildFormData({
          name: "Novo Item",
          quantity: 3,
          continuousMode: true,
          expirationDate: "2027-01-01",
          attributes: { weight: "2kg", dimensions: "10x10" },
        }),
      );
    });

    expect(toastSuccess).toHaveBeenCalledWith(
      "Novo Item já está na movimentação. Continue adicionando novos produtos.",
    );
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockWriteDraft).toHaveBeenCalledTimes(1);

    const writtenDraft = mockWriteDraft.mock.calls[0][0] as StockMovementDraft;
    expect(writtenDraft.items).toHaveLength(2);
    expect(writtenDraft.items[1]).toMatchObject({
      quantity: 3,
      productName: "Novo Item",
      newProductData: {
        name: "Novo Item",
        hasExpiration: true,
        expirationDate: "2027-01-01",
        attributes: {
          weight: "2kg",
          dimensions: "10x10",
        },
      },
    });
    expect(writtenDraft.selectedProductId).toBe("");
    expect(writtenDraft.itemQuantity).toBe("");
    expect(writtenDraft.inlineProductBarcode).toBeUndefined();

    expect(result.current.form.getValues("name")).toBe("");
    expect(result.current.form.getValues("quantity")).toBe(0);
    expect(result.current.form.getValues("continuousMode")).toBe(true);
    expect(result.current.customAttributes).toEqual([]);
    expect(result.current.productImage).toBeNull();
    expect(result.current.isSubmitting).toBe(false);
  });

  it("inclui produto e volta para a tela de criação", async () => {
    const { result } = renderHook(() =>
      useNewProductInlineModel({ movementType, editItem: editItemQuery }),
    );

    await waitFor(() => {
      expect(result.current.form.getValues("barcode")).toBe("7891000000001");
    });

    await act(async () => {
      await result.current.onSubmit(
        buildFormData({
          name: "Novo Item",
          quantity: 3,
          continuousMode: false,
        }),
      );
    });

    expect(mockWriteDraft).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(
      "/stock-movements/create?type=PURCHASE_IN",
    );
  });

  it("atualiza produto existente e retorna para a tela de criação", async () => {
    currentDraft = createDraft({
      items: [
        {
          quantity: 2,
          productName: "Produto Antigo",
          newProductData: { name: "Produto Antigo", description: "Original" },
        },
      ],
    });
    editItemQuery = "0";
    const { result } = renderHook(() =>
      useNewProductInlineModel({ movementType, editItem: editItemQuery }),
    );

    await waitFor(() => {
      expect(result.current.isInlineEdit).toBe(true);
    });

    await act(async () => {
      await result.current.onSubmit(
        buildFormData({
          name: "Produto Atualizado",
          description: "Atualizado",
          quantity: 4,
          attributes: { weight: "", dimensions: "" },
        }),
      );
    });

    expect(toastSuccess).toHaveBeenCalledWith(
      "Produto Atualizado foi atualizado na movimentação.",
    );
    expect(mockPush).toHaveBeenCalledWith(
      "/stock-movements/create?type=PURCHASE_IN",
    );
    expect(mockWriteDraft).toHaveBeenCalledTimes(1);

    const writtenDraft = mockWriteDraft.mock.calls[0][0] as StockMovementDraft;
    expect(writtenDraft.items).toHaveLength(1);
    expect(writtenDraft.items[0]).toMatchObject({
      quantity: 4,
      productName: "Produto Atualizado",
      newProductData: {
        name: "Produto Atualizado",
        description: "Atualizado",
      },
    });
    expect(result.current.isSubmitting).toBe(false);
  });

  it("restringe acesso à criação inline sem draft da movimentação", async () => {
    movementType = "PURCHASE_IN";
    currentDraft = null;

    renderHook(() =>
      useNewProductInlineModel({ movementType, editItem: editItemQuery }),
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/stock-movements");
    });
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalledWith(
      "Volte para a movimentação antes de criar o produto.",
    );
  });

  it("redireciona quando editItem referencia índice inválido", async () => {
    editItemQuery = "2";
    currentDraft = createDraft({
      items: [{ quantity: 1, productName: "Apenas 1 item", newProductData: { name: "Apenas 1 item" } }],
    });

    renderHook(() =>
      useNewProductInlineModel({ movementType, editItem: editItemQuery }),
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/stock-movements");
    });
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("alterna estado do scanner e registra barcode escaneado", () => {
    const { result } = renderHook(() => useNewProductInlineModel({ movementType, editItem: editItemQuery }));

    expect(result.current.isScannerOpen).toBe(false);
    act(() => {
      result.current.openScanner();
    });
    expect(result.current.isScannerOpen).toBe(true);

    act(() => {
      result.current.handleBarcodeScan("123456789");
    });
    expect(result.current.form.getValues("barcode")).toBe("123456789");

    act(() => {
      result.current.closeScanner();
    });
    expect(result.current.isScannerOpen).toBe(false);
  });

  it("controla quantidade com incremento e decremento sem ficar negativa", () => {
    const { result } = renderHook(() => useNewProductInlineModel({ movementType, editItem: editItemQuery }));

    act(() => {
      result.current.onQuantityIncrement?.();
    });
    expect(result.current.form.getValues("quantity")).toBe(1);

    act(() => {
      result.current.onQuantityDecrement?.();
      result.current.onQuantityDecrement?.();
    });
    expect(result.current.form.getValues("quantity")).toBe(0);
  });

  it("controla modal de IA e preenche dados do produto inline", () => {
    const { result } = renderHook(() => useNewProductInlineModel({ movementType, editItem: editItemQuery }));
    const image = new File(["img"], "produto.png", { type: "image/png" });

    act(() => {
      result.current.openAiModal?.();
    });
    expect(result.current.isAiModalOpen).toBe(true);

    act(() => {
      result.current.handleAiFill?.(
        {
          name: "Café Especial",
          categoryId: "c1",
          brandId: "b1",
          volumeValue: 500,
          volumeUnit: "g",
        },
        image,
        true,
      );
      result.current.closeAiModal?.();
    });

    expect(result.current.isAiModalOpen).toBe(false);
    expect(result.current.form.getValues("name")).toBe("Café Especial");
    expect(result.current.form.getValues("categoryId")).toBe("c1");
    expect(result.current.form.getValues("brandId")).toBe("b1");
    expect(result.current.form.getValues("attributes.weight")).toBe("500g");
    expect(result.current.productImage).toBe(image);
    expect(toastSuccess).toHaveBeenCalledWith("Dados preenchidos via IA!");
  });

  it("marca estado de carregamento para categorias e marcas", () => {
    loadingCategories = true;
    loadingBrands = true;
    currentDraft = createDraft();

    const { result } = renderHook(() => useNewProductInlineModel({ movementType, editItem: editItemQuery }));

    expect(result.current.isLoadingCategories).toBe(true);
    expect(result.current.isLoadingBrands).toBe(true);
  });
});
