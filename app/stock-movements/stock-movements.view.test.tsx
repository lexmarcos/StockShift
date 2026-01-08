import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StockMovementsView } from "./stock-movements.view";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

const baseProps = {
  movements: [],
  isLoading: false,
  error: null,
  filters: {
    searchQuery: "",
    status: "all" as const,
    movementType: "all" as const,
    warehouseId: "",
  },
  sortConfig: { key: "createdAt", direction: "desc" as const },
  setSearchQuery: vi.fn(),
  setStatus: vi.fn(),
  setMovementType: vi.fn(),
  setWarehouseId: vi.fn(),
  setSortConfig: vi.fn(),
};

describe("StockMovementsView", () => {
  it("shows empty state", () => {
    render(<StockMovementsView {...baseProps} />);
    expect(screen.getByText(/nenhuma movimentação/i)).toBeTruthy();
  });
});
