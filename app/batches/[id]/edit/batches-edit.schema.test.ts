import { describe, it, expect } from "vitest";
import { batchEditSchema } from "./batches-edit.schema";

const baseData = {
  productId: "prod-1",
  warehouseId: "wh-1",
  quantity: 1,
  batchCode: "",
  manufacturedDate: "",
  expirationDate: "",
  notes: "",
};

describe("batchEditSchema price validation", () => {
  it("rejects decimal cost price", () => {
    const result = batchEditSchema.safeParse({
      ...baseData,
      costPrice: 12.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects decimal selling price", () => {
    const result = batchEditSchema.safeParse({
      ...baseData,
      sellingPrice: 19.9,
    });
    expect(result.success).toBe(false);
  });
});
