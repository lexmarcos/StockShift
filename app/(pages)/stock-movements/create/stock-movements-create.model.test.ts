import { describe, it, expect } from "vitest";
import { buildMovementPayload, filterBatchesByProduct } from "./stock-movements-create.model";
import type { StockMovementFormData, Batch } from "./stock-movements-create.types";

const formData: StockMovementFormData = {
  movementType: "ENTRY",
  sourceWarehouseId: "",
  destinationWarehouseId: "w1",
  notes: "Pedido",
  items: [{ productId: "p1", batchId: "", quantity: 2, reason: "" }],
};

describe("buildMovementPayload", () => {
  it("maps null warehouse ids and trims notes", () => {
    const payload = buildMovementPayload({ ...formData }, " ");
    expect(payload.notes).toBeUndefined();
    expect(payload.sourceWarehouseId).toBeNull();
  });
});

describe("filterBatchesByProduct", () => {
  it("returns only batches for the selected product", () => {
    const batches = [
      { id: "b1", batchNumber: "BATCH-001", quantity: 5, productId: "p1" },
      { id: "b2", batchNumber: "BATCH-002", quantity: 3, productId: "p2" },
    ] as Batch[];

    const result = filterBatchesByProduct(batches, "p1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("b1");
  });

  it("returns empty when no product is selected", () => {
    const batches = [
      { id: "b1", batchNumber: "BATCH-001", quantity: 5, productId: "p1" },
    ] as Batch[];

    const result = filterBatchesByProduct(batches, "");
    expect(result).toHaveLength(0);
  });
});
