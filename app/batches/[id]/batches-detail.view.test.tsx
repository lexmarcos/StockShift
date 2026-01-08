import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BatchesDetailView } from "./batches-detail.view";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

const baseBatch = {
  id: "b1",
  productId: "p1",
  productName: "Produto",
  productSku: "SKU",
  warehouseId: "w1",
  warehouseName: "Central",
  warehouseCode: "WH-1",
  quantity: 5,
  batchNumber: "BATCH-001",
  expirationDate: "2026-02-01",
  costPrice: 10,
  notes: "",
  createdAt: "2026-01-01T10:00:00Z",
  updatedAt: "2026-01-01T10:00:00Z",
};

describe("BatchesDetailView", () => {
  it("shows batch header", () => {
    render(
      <BatchesDetailView
        batch={baseBatch as any}
        isLoading={false}
        error={null}
        isDeleting={false}
        isDeleteOpen={false}
        onDeleteOpenChange={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText(/BATCH-001/i)).toBeTruthy();
  });
});
