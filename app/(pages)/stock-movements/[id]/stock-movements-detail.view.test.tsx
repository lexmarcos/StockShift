import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StockMovementDetailView } from "./stock-movements-detail.view";
import type { StockMovement } from "../stock-movements.types";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode; href: string }) => <a {...props}>{children}</a>,
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
  items: [
    {
      id: "i1",
      productId: "p1",
      productName: "Produto",
      productSku: "SKU",
      batchId: null,
      batchNumber: null,
      quantity: 2,
      unitPrice: 10.00,
      totalPrice: 20.00,
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
        movement={movement as StockMovement}
        isLoading={false}
        error={null}
        isExecuting={false}
        isCancelling={false}
        isStartingValidation={false}
        onExecute={vi.fn()}
        onCancel={vi.fn()}
        onStartValidation={vi.fn()}
        isCancelOpen={false}
        onCancelOpenChange={vi.fn()}
      />
    );
    expect(screen.getAllByText(/ENTRADA/i).length).toBeGreaterThan(0);
  });
});
