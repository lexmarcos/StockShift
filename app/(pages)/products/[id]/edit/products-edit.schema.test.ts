import { describe, it, expect } from "vitest";
import { batchEditItemSchema } from "./products-edit.schema";

const baseItem = {
  id: "batch-1",
  productId: "prod-1",
  warehouseId: "wh-1",
  warehouseName: "Main",
  warehouseCode: "WH-1",
  batchCode: "BATCH-001",
  quantity: 1,
  expirationDate: "",
  notes: "",
};

describe("batchEditItemSchema price validation", () => {
  it("rejects decimal cost price", () => {
    const result = batchEditItemSchema.safeParse({
      ...baseItem,
      costPrice: 12.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects decimal selling price", () => {
    const result = batchEditItemSchema.safeParse({
      ...baseItem,
      sellingPrice: 19.9,
    });
    expect(result.success).toBe(false);
  });
});
