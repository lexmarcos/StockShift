import { describe, expect, it } from "vitest";
import {
  buildRepeatedProductBatchWarning,
  findDuplicateInlineProductError,
  getPendingInlineProductBarcodeConflictError,
  hasExistingProductInItems,
} from "./stock-movement-draft-guards";
import type { StockMovementDraftItem } from "./create-stock-movement.types";

const draftItems: StockMovementDraftItem[] = [
  {
    quantity: 2,
    productName: "Produto Novo A",
    newProductData: { name: "Produto Novo A", barcode: "789100000001" },
  },
  {
    productId: "p-1",
    quantity: 1,
    productName: "Produto Existente",
  },
];

describe("findDuplicateInlineProductError", () => {
  it("acusa nome duplicado ignorando caixa", () => {
    expect(
      findDuplicateInlineProductError(
        { name: "produto novo a" },
        draftItems,
        null,
      ),
    ).toBe('O produto "produto novo a" já foi adicionado nesta movimentação.');
  });

  it("acusa barcode duplicado entre produtos novos", () => {
    expect(
      findDuplicateInlineProductError(
        { name: "Outro Produto", barcode: "789100000001" },
        draftItems,
        null,
      ),
    ).toBe(
      'O código 789100000001 já está em uso pelo produto "Produto Novo A" nesta movimentação.',
    );
  });

  it("ignora o item que está sendo editado", () => {
    expect(
      findDuplicateInlineProductError(
        { name: "Produto Novo A", barcode: "789100000001" },
        draftItems,
        0,
      ),
    ).toBeNull();
  });

  it("aceita produto sem conflito", () => {
    expect(
      findDuplicateInlineProductError(
        { name: "Produto Inédito", barcode: "789100000999" },
        draftItems,
        null,
      ),
    ).toBeNull();
  });
});

describe("getPendingInlineProductBarcodeConflictError", () => {
  it("acusa conflito com produto novo pendente de mesmo barcode", () => {
    expect(
      getPendingInlineProductBarcodeConflictError(draftItems, "789100000001"),
    ).toBe(
      'O código 789100000001 já pertence ao produto novo "Produto Novo A" nesta movimentação. Remova-o antes de adicionar o produto existente.',
    );
  });

  it("retorna null sem barcode ou sem conflito", () => {
    expect(getPendingInlineProductBarcodeConflictError(draftItems, null)).toBeNull();
    expect(getPendingInlineProductBarcodeConflictError(draftItems, "")).toBeNull();
    expect(
      getPendingInlineProductBarcodeConflictError(draftItems, "789100000999"),
    ).toBeNull();
  });
});

describe("hasExistingProductInItems", () => {
  it("encontra item pelo productId", () => {
    expect(hasExistingProductInItems(draftItems, "p-1")).toBe(true);
    expect(hasExistingProductInItems(draftItems, "p-2")).toBe(false);
  });
});

describe("buildRepeatedProductBatchWarning", () => {
  it("monta aviso com o nome do produto", () => {
    expect(buildRepeatedProductBatchWarning("Café Torrado")).toBe(
      "Café Torrado já está na movimentação. Este lote será adicionado como um novo item.",
    );
  });
});
