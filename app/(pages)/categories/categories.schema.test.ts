import { describe, expect, it } from "vitest";
import { categorySchema } from "./categories.schema";

const baseCategory: {
  name: string;
  description?: string | undefined;
  parentCategoryId?: string | null | undefined;
  attributesSchema?: Record<string, unknown>;
} = {
  name: "Categoria",
};

describe("categorySchema", () => {
  it("aceita dados válidos com campos opcionais", () => {
    const result = categorySchema.safeParse({
      ...baseCategory,
      description: "  Bebidas naturais  ",
      parentCategoryId: null,
      attributesSchema: {
        color: "azul",
        weight: 10,
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error("Parsing inesperado com payload válido");
    }
    expect(result.data.description).toBe("Bebidas naturais");
  });

  it("rejeita nome menor que 2 caracteres", () => {
    const result = categorySchema.safeParse({
      ...baseCategory,
      name: "A",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita nome maior que 100 caracteres", () => {
    const result = categorySchema.safeParse({
      ...baseCategory,
      name: "a".repeat(101),
    });

    expect(result.success).toBe(false);
  });

  it("rejeita UUID inválido para categoria pai", () => {
    const result = categorySchema.safeParse({
      ...baseCategory,
      parentCategoryId: "not-an-uuid",
    });

    expect(result.success).toBe(false);
  });

  it("aceita description ausente", () => {
    const result = categorySchema.safeParse({
      ...baseCategory,
    });

    expect(result.success).toBe(true);
  });

  it("rejeita attributesSchema com tipo inválido", () => {
    const result = categorySchema.safeParse({
      ...baseCategory,
      attributesSchema: [],
    });

    expect(result.success).toBe(false);
  });
});
