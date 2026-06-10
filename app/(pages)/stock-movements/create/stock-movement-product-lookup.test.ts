import { beforeEach, describe, expect, it, vi } from "vitest";
import { lookupStockMovementProductByBarcode } from "./stock-movement-product-lookup";

const mockGet = vi.fn();
const mockIsApiNotFoundError = vi.fn();

vi.mock("@/lib/api", () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
  },
  isApiNotFoundError: (error: unknown) => mockIsApiNotFoundError(error),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("lookupStockMovementProductByBarcode", () => {
  it("retorna produto encontrado", async () => {
    mockGet.mockReturnValue({
      json: vi.fn(async () => ({
        success: true,
        data: { id: "p-1", name: "Café Torrado", barcode: "789" },
      })),
    });

    const lookup = await lookupStockMovementProductByBarcode("789");

    expect(mockGet).toHaveBeenCalledWith("products/barcode/789");
    expect(lookup).toEqual({
      status: "found",
      product: { id: "p-1", name: "Café Torrado", barcode: "789" },
    });
  });

  it("retorna not-found quando a API responde 404", async () => {
    mockGet.mockReturnValue({
      json: vi.fn(async () => {
        throw new Error("não encontrado");
      }),
    });
    mockIsApiNotFoundError.mockReturnValue(true);

    const lookup = await lookupStockMovementProductByBarcode("789");

    expect(lookup).toEqual({ status: "not-found" });
  });

  it("retorna erro com mensagem para falhas que não são 404", async () => {
    mockGet.mockReturnValue({
      json: vi.fn(async () => {
        throw new Error("timeout");
      }),
    });
    mockIsApiNotFoundError.mockReturnValue(false);

    const lookup = await lookupStockMovementProductByBarcode("789");

    expect(lookup).toEqual({
      status: "error",
      message:
        "Não foi possível consultar o código 789 (timeout). Verifique a conexão e tente novamente.",
    });
  });

  it("escapa o barcode na URL", async () => {
    mockGet.mockReturnValue({
      json: vi.fn(async () => ({ success: true, data: { id: "p", name: "x" } })),
    });

    await lookupStockMovementProductByBarcode("a/b c");

    expect(mockGet).toHaveBeenCalledWith("products/barcode/a%2Fb%20c");
  });
});
