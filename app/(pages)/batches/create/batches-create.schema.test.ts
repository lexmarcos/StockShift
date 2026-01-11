import { describe, it, expect } from "vitest";
import { batchCreateSchema } from "./batches-create.schema";

const baseData = {
  productId: "prod-1",
  warehouseId: "wh-1",
  quantity: 1,
  batchCode: "",
  manufacturedDate: "",
  expirationDate: "",
  notes: "",
};

describe("batchCreateSchema price validation", () => {
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
