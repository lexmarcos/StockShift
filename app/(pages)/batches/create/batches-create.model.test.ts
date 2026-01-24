import { describe, it, expect } from "vitest";
import { buildBatchPayload } from "./batches-create.model";

import type { BatchCreateFormData } from "./batches-create.schema";

const formData: BatchCreateFormData = {
  productId: "p1",
  warehouseId: "w1",
  quantity: 10,
  batchCode: "B-01",
  manufacturedDate: "2026-01-01",
  expirationDate: "2026-12-31",
  costPrice: 10,
  sellingPrice: 18,
  notes: "Ok",
};

describe("buildBatchPayload", () => {
  it("maps optional fields and trims empty strings", () => {
    const payload = buildBatchPayload({
      ...formData,
      batchCode: " ",
      notes: " ",
    });
    expect(payload.batchCode).toBeUndefined();
    expect(payload.notes).toBeUndefined();
  });
});
