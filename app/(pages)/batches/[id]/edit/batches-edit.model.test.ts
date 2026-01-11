import { describe, it, expect } from "vitest";
import { mapBatchToFormValues } from "./batches-edit.model";

const batch = {
  id: "b1",
  productId: "p1",
  warehouseId: "w1",
  quantity: 12,
  batchNumber: "B-01",
  expirationDate: "2026-12-31",
  costPrice: 10,
  sellingPrice: 18,
  notes: "Ok",
};

describe("mapBatchToFormValues", () => {
  it("maps api batch to form defaults", () => {
    const values = mapBatchToFormValues(batch as any);
    expect(values.productId).toBe("p1");
    expect(values.quantity).toBe(12);
  });
});
