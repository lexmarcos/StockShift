import { describe, it, expect } from "vitest";
import { batchCreateSchema } from "./batches-create.schema";

const baseData = {
  productId: "prod-1",
  quantity: 1,
  manufacturedDate: "",
  expirationDate: "",
  notes: "",
};

describe("batchCreateSchema price validation", () => {
  it("accepts batch data without warehouse and batch code fields", () => {
    const result = batchCreateSchema.safeParse(baseData);
    expect(result.success).toBe(true);
  });

  it("rejects decimal cost price", () => {
    const result = batchCreateSchema.safeParse({
      ...baseData,
      costPrice: 12.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects decimal selling price", () => {
    const result = batchCreateSchema.safeParse({
      ...baseData,
      sellingPrice: 19.9,
    });
    expect(result.success).toBe(false);
  });
});
