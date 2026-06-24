import { describe, it, expect } from "vitest";
import { sortProductBatches } from "./product-batches.model";
import type { ProductBatch } from "./product-batches.types";

const makeBatch = (overrides: Partial<ProductBatch> = {}): ProductBatch => ({
  id: "1",
  productName: "Test Product",
  batchCode: "B001",
  quantity: 10,
  costPrice: 1000,
  sellingPrice: 2000,
  manufacturedDate: "2026-01-01",
  expirationDate: "2026-12-31",
  createdAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

describe("sortProductBatches", () => {
  const batches: ProductBatch[] = [
    makeBatch({ id: "1", batchCode: "B001", quantity: 10, expirationDate: "2026-06-01" }),
    makeBatch({ id: "2", batchCode: "A002", quantity: 50, expirationDate: "2026-12-31" }),
    makeBatch({ id: "3", batchCode: "C003", quantity: 5,  expirationDate: "2025-01-01" }),
  ];

  it("sorts by quantity ascending", () => {
    const result = sortProductBatches(batches, "quantity", "asc");
    expect(result.map((b) => b.id)).toEqual(["3", "1", "2"]);
  });

  it("sorts by quantity descending", () => {
    const result = sortProductBatches(batches, "quantity", "desc");
    expect(result.map((b) => b.id)).toEqual(["2", "1", "3"]);
  });

  it("sorts by batchCode ascending", () => {
    const result = sortProductBatches(batches, "batchCode", "asc");
    expect(result.map((b) => b.id)).toEqual(["2", "1", "3"]);
  });

  it("sorts by batchCode descending", () => {
    const result = sortProductBatches(batches, "batchCode", "desc");
    expect(result.map((b) => b.id)).toEqual(["3", "1", "2"]);
  });

  it("sorts by expirationDate ascending (nulls last)", () => {
    const withNull = [
      ...batches,
      makeBatch({ id: "4", batchCode: "D004", expirationDate: null }),
    ];
    const result = sortProductBatches(withNull, "expirationDate", "asc");
    expect(result.map((b) => b.id)).toEqual(["3", "1", "2", "4"]);
  });

  it("sorts by expirationDate descending (nulls first)", () => {
    const withNull = [
      ...batches,
      makeBatch({ id: "4", batchCode: "D004", expirationDate: null }),
    ];
    const result = sortProductBatches(withNull, "expirationDate", "desc");
    expect(result.map((b) => b.id)).toEqual(["4", "2", "1", "3"]);
  });

  it("does not mutate the input array", () => {
    const original = [...batches];
    sortProductBatches(batches, "quantity", "asc");
    expect(batches.map((b) => b.id)).toEqual(original.map((b) => b.id));
  });

  it("handles null batchCode (nulls last on asc, first on desc)", () => {
    const withNullCode = [
      makeBatch({ id: "1", batchCode: "B001" }),
      makeBatch({ id: "2", batchCode: null }),
      makeBatch({ id: "3", batchCode: "A001" }),
    ];
    const asc = sortProductBatches(withNullCode, "batchCode", "asc");
    expect(asc.map((b) => b.id)).toEqual(["3", "1", "2"]);
    const desc = sortProductBatches(withNullCode, "batchCode", "desc");
    expect(desc.map((b) => b.id)).toEqual(["2", "1", "3"]);
  });
});
