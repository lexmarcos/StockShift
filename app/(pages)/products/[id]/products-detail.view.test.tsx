import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductDetailView } from "./products-detail.view";
import type { Product, ProductBatch } from "./products-detail.types";

vi.mock("next/link", () => ({
  default: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a {...props}>{children}</a>,
}));

const baseProduct: Product = {
  id: "prod-1",
  name: "Perfume Teste",
  description: "Descrição do produto",
  imageUrl: null,
  categoryId: "cat-1",
  categoryName: "Perfumaria",
  brand: {
    id: "brand-1",
    name: "Marca Teste",
    logoUrl: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  barcode: "7890000000000",
  barcodeType: "EAN13",
  sku: "SKU-001",
  isKit: false,
  attributes: null,
  hasExpiration: true,
  active: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

const baseBatch: ProductBatch = {
  id: "batch-1",
  productId: "prod-1",
  warehouseId: "wh-1",
  warehouseName: "Central",
  warehouseCode: "WH-1",
  quantity: 12,
  batchCode: "BATCH-001",
  expirationDate: "2026-12-20",
  manufacturedDate: null,
  costPrice: 1000,
  sellingPrice: 1500,
  notes: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("ProductDetailView", () => {
  it("renders batches linked to the product", () => {
    render(
      <ProductDetailView
        product={baseProduct}
        isLoading={false}
        error={null}
        batches={[baseBatch]}
        isLoadingBatches={false}
        batchesError={null}
      />
    );

    expect(screen.getByText(/lotes do produto/i)).toBeTruthy();
    expect(screen.getByText(/batch-001/i)).toBeTruthy();
    expect(screen.getByText(/central/i)).toBeTruthy();
  });
});
