import { describe, expect, it } from "vitest";
import { createStockMovementSchema } from "./create-stock-movement.schema";

const validUuid = "123e4567-e89b-12d3-a456-426614174000";

describe("createStockMovementSchema", () => {
  it("aceita payload válido com produto existente", () => {
    const result = createStockMovementSchema.safeParse({
      type: "PURCHASE_IN",
      notes: "Entrada inicial",
      items: [
        {
          productId: validUuid,
          quantity: 12,
          productName: "Café",
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("aceita payload com produto novo sem imagem", () => {
    const result = createStockMovementSchema.safeParse({
      type: "PURCHASE_IN",
      notes: "Entrada manual",
      items: [
        {
          quantity: 3,
          newProductData: {
            name: "Açúcar Especial",
            description: "Novo açúcar",
            barcode: "7891234567890",
          },
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("aceita imagem inline completa dentro de produto novo", () => {
    const result = createStockMovementSchema.safeParse({
      type: "PURCHASE_IN",
      notes: "",
      items: [
        {
          quantity: 1,
          newProductData: {
            name: "Lata Nova",
            image: {
              name: "foto.png",
              type: "image/png",
              dataUrl: "data:image/png;base64,YQ==",
            },
          },
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejeita tipos inválidos de movimentação", () => {
    const result = createStockMovementSchema.safeParse({
      type: "INVALID",
      items: [
        {
          productId: validUuid,
          quantity: 1,
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejeita movimento sem itens", () => {
    const result = createStockMovementSchema.safeParse({
      type: "PURCHASE_IN",
      notes: "",
      items: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejeita item com productId e novo produto simultaneamente", () => {
    const result = createStockMovementSchema.safeParse({
      type: "PURCHASE_IN",
      items: [
        {
          productId: validUuid,
          quantity: 4,
          newProductData: {
            name: "Produto duplicado",
          },
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejeita item sem productId nem novo produto", () => {
    const result = createStockMovementSchema.safeParse({
      type: "PURCHASE_IN",
      items: [
        {
          quantity: 4,
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejeita quantidade inválida", () => {
    const result = createStockMovementSchema.safeParse({
      type: "PURCHASE_IN",
      items: [
        {
          productId: validUuid,
          quantity: 0,
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejeita imagem inline sem metadados obrigatórios", () => {
    const result = createStockMovementSchema.safeParse({
      type: "PURCHASE_IN",
      items: [
        {
          quantity: 2,
          newProductData: {
            name: "Produto falho",
            image: {
              name: "",
              type: "",
              dataUrl: "",
            },
          },
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});
