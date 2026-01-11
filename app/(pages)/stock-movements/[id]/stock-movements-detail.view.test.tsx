import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StockMovementDetailView } from "./stock-movements-detail.view";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

const movement = {
  id: "m1",
  movementType: "ENTRY",
  status: "PENDING",
  sourceWarehouseId: null,
  sourceWarehouseName: null,
  destinationWarehouseId: "w1",
  destinationWarehouseName: "Central",
  notes: "Pedido",
  createdBy: "u1",
  createdByName: "User",
  executedBy: null,
  executedByName: null,
  items: [
    {
      id: "i1",
      productId: "p1",
      productName: "Produto",
      productSku: "SKU",
      batchId: null,
      batchNumber: null,
      quantity: 2,
      reason: "",
    },
  ],
  createdAt: "2026-01-01T10:00:00Z",
  updatedAt: "2026-01-01T10:00:00Z",
  executedAt: null,
};

describe("StockMovementDetailView", () => {
  it("shows movement header", () => {
    render(
      <StockMovementDetailView
        movement={movement as any}
        isLoading={false}
        error={null}
        isExecuting={false}
        isCancelling={false}
        onExecute={vi.fn()}
        onCancel={vi.fn()}
        isCancelOpen={false}
        onCancelOpenChange={vi.fn()}
      />
    );
    expect(screen.getAllByText(/ENTRADA/i).length).toBeGreaterThan(0);
  });
});
