import { describe, expect, it } from "vitest";
import {
  filterStockMovementProductOptions,
  formatStockMovementProductLabel,
} from "./create-stock-movement.model";
import type { StockMovementProductOption } from "./create-stock-movement.types";

const products: StockMovementProductOption[] = [
  {
    id: "p1",
    name: "Café Torrado",
    sku: "CAF-01",
    barcode: "7891000000001",
  },
  {
    id: "p2",
    name: "Filtro de Papel",
    sku: "FIL-02",
    barcode: "7891000000002",
  },
  {
    id: "p3",
    name: "Açúcar Cristal",
    sku: "ACU-03",
    barcode: "7891000000003",
  },
  { id: "p4", name: "Copo Térmico" },
  { id: "p5", name: "Garrafa Térmica" },
  { id: "p6", name: "Cafeteira" },
];

describe("filterStockMovementProductOptions", () => {
  it("requires at least two trimmed characters", () => {
    expect(filterStockMovementProductOptions(products, " c ")).toEqual([]);
  });

  it("searches by name, sku and barcode", () => {
    expect(filterStockMovementProductOptions(products, "fil")[0].id).toBe("p2");
    expect(filterStockMovementProductOptions(products, "ACU")[0].id).toBe("p3");
    expect(filterStockMovementProductOptions(products, "0001")[0].id).toBe("p1");
  });

  it("limits results to five options", () => {
    const manyProducts = Array.from({ length: 6 }, (_, index) => ({
      id: `extra-${index}`,
      name: `Produto ${index}`,
    }));

    expect(filterStockMovementProductOptions(manyProducts, "produto")).toHaveLength(5);
  });
});

describe("formatStockMovementProductLabel", () => {
  it("includes sku when available", () => {
    expect(formatStockMovementProductLabel(products[0])).toBe(
      "Café Torrado (CAF-01)",
    );
  });

  it("uses only the name when sku is missing", () => {
    expect(formatStockMovementProductLabel(products[3])).toBe("Copo Térmico");
  });
});
