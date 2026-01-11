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
  productName: "Produto Teste",
  productSku: "SKU-123",
  warehouseId: "w1",
  warehouseName: "Central",
  warehouseCode: "WH-1",
  quantity: 5,
  batchNumber: "BATCH-001",
  expirationDate: "2026-02-01",
  costPrice: 1000,
  sellingPrice: 1500,
  notes: "",
  createdAt: "2026-01-01T10:00:00Z",
  updatedAt: "2026-01-01T10:00:00Z",
};

describe("BatchesDetailView", () => {
  it("shows batch header and key info", () => {
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
    
    // Check if product name is present (it's now the link)
    expect(screen.getByText("Produto Teste")).toBeTruthy();
    
    // Check for "financeiro" section
    expect(screen.getByText(/financeiro/i)).toBeTruthy();
  });

  it("formats prices as BRL from cents", () => {
    const batch = { ...baseBatch, costPrice: 12345, sellingPrice: 67890 };
    render(
      <BatchesDetailView
        batch={batch as any}
        isLoading={false}
        error={null}
        isDeleting={false}
        isDeleteOpen={false}
        onDeleteOpenChange={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    // Flexible regex for currency matching to handle potential non-breaking spaces
    expect(screen.getByText(/R\$\s?123,45/)).toBeTruthy();
    expect(screen.getByText(/R\$\s?678,90/)).toBeTruthy();
  });
});