import { describe, it, expect } from "vitest";
import {
  buildBatchPayload,
  buildProductBarcodeUrl,
  buildProductSearchUrl,
  formatProductOptionLabel,
  limitProductSearchOptions,
} from "./batches-create.model";

import type { BatchCreateFormData } from "./batches-create.schema";
import type { ProductSearchOption } from "./batches-create.types";

const formData: BatchCreateFormData = {
  productId: "p1",
  quantity: 10,
  manufacturedDate: "2026-01-01",
  expirationDate: "2026-12-31",
  costPrice: 10,
  sellingPrice: 18,
  notes: "Ok",
};

describe("buildBatchPayload", () => {
  it("uses the active warehouse and omits frontend batch code", () => {
    const payload = buildBatchPayload({
      ...formData,
      notes: " ",
    }, "w1");

    expect(payload.productId).toBe("p1");
    expect(payload.warehouseId).toBe("w1");
    expect("batchCode" in payload).toBe(false);
    expect(payload.notes).toBeUndefined();
  });
});

describe("buildProductSearchUrl", () => {
  it("requires at least two trimmed characters", () => {
    expect(buildProductSearchUrl(" a ")).toBeNull();
  });

  it("builds an encoded product search URL", () => {
    expect(buildProductSearchUrl(" cafe 500 ")).toBe("products/search?q=cafe+500");
  });
});

describe("buildProductBarcodeUrl", () => {
  it("returns null for empty barcodes", () => {
    expect(buildProductBarcodeUrl(" ")).toBeNull();
  });

  it("builds an encoded product barcode URL", () => {
    expect(buildProductBarcodeUrl("789 123")).toBe("products/barcode/789%20123");
  });
});

describe("limitProductSearchOptions", () => {
  it("limits product autocomplete results to five items", () => {
    const products: ProductSearchOption[] = Array.from({ length: 6 }, (_, index) => ({
      id: `p${index}`,
      name: `Produto ${index}`,
      hasExpiration: false,
    }));

    expect(limitProductSearchOptions(products)).toHaveLength(5);
  });
});

describe("formatProductOptionLabel", () => {
  it("includes SKU when available", () => {
    expect(
      formatProductOptionLabel({
        id: "p1",
        name: "Produto A",
        sku: "SKU-01",
        hasExpiration: false,
      }),
    ).toBe("Produto A (SKU-01)");
  });
});
