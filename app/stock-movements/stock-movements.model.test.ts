import { describe, it, expect } from "vitest";
import {
  filterMovements,
  sortMovements,
  StockMovement,
} from "./stock-movements.model";

const baseMovement: StockMovement = {
  id: "m1",
  movementType: "ENTRY",
  status: "PENDING",
  sourceWarehouseId: null,
  sourceWarehouseName: null,
  destinationWarehouseId: "w1",
  destinationWarehouseName: "Central",
  notes: "Pedido 123",
  createdBy: "u1",
  createdByName: "User",
  executedBy: null,
  executedByName: null,
  items: [
    {
      id: "i1",
      productId: "p1",
      productName: "Produto A",
      productSku: "SKU-A",
      batchId: null,
      batchNumber: null,
      quantity: 10,
      reason: "Reposição",
    },
  ],
  createdAt: "2026-01-01T10:00:00Z",
  updatedAt: "2026-01-01T10:00:00Z",
  executedAt: null,
};

describe("stock movements list helpers", () => {
  it("filters by status and type", () => {
    const movements = [
      baseMovement,
      { ...baseMovement, id: "m2", status: "COMPLETED" as const },
    ];
    const filtered = filterMovements(movements, {
      searchQuery: "",
      status: "COMPLETED",
      movementType: "ENTRY",
      warehouseId: "",
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("m2");
  });

  it("sorts by createdAt desc", () => {
    const movements = [
      { ...baseMovement, id: "m1", createdAt: "2026-01-01T10:00:00Z" },
      { ...baseMovement, id: "m2", createdAt: "2026-02-01T10:00:00Z" },
    ];
    const sorted = sortMovements(movements, {
      key: "createdAt",
      direction: "desc",
    });
    expect(sorted[0].id).toBe("m2");
  });
});
