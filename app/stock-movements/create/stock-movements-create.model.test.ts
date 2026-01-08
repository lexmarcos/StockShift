import { describe, it, expect } from "vitest";
import { buildMovementPayload } from "./stock-movements-create.model";

const formData = {
  movementType: "ENTRY",
  sourceWarehouseId: "",
  destinationWarehouseId: "w1",
  notes: "Pedido",
  items: [{ productId: "p1", batchId: "", quantity: 2, reason: "" }],
};

describe("buildMovementPayload", () => {
  it("maps null warehouse ids and trims notes", () => {
    const payload = buildMovementPayload({ ...formData, notes: " " } as any);
    expect(payload.notes).toBeUndefined();
    expect(payload.sourceWarehouseId).toBeNull();
  });
});
