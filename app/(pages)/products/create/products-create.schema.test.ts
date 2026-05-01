import { describe, it, expect } from "vitest";
import { productCreateSchema, productInlineSchema } from "./products-create.schema";

const baseData = {
  name: "Produto",
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
};

describe("productCreateSchema price validation", () => {
  it("rejects decimal cost price", () => {
    const result = productCreateSchema.safeParse({
      ...baseData,
      costPrice: 12.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects decimal selling price", () => {
    const result = productCreateSchema.safeParse({
      ...baseData,
      sellingPrice: 19.9,
    });
    expect(result.success).toBe(false);
  });
});

describe("productInlineSchema validation", () => {
  it("requires positive quantity", () => {
    const result = productInlineSchema.safeParse({
      ...baseData,
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });

  it("allows empty expiration date when expiration control is enabled", () => {
    const result = productInlineSchema.safeParse({
      ...baseData,
      hasExpiration: true,
      expirationDate: "",
    });
    expect(result.success).toBe(true);
  });
});
