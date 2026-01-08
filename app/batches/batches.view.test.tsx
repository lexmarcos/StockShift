import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BatchesView } from "./batches.view";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

const baseProps = {
  batches: [],
  isLoading: false,
  error: null,
  filters: {
    searchQuery: "",
    warehouseId: "",
    status: "all" as const,
    lowStockThreshold: 10,
  },
  sortConfig: { key: "createdAt", direction: "desc" as const },
  warehouses: [],
  statusCounts: { expired: 0, expiring: 0, low: 0 },
  setSearchQuery: vi.fn(),
  setWarehouseId: vi.fn(),
  setStatus: vi.fn(),
  setSortConfig: vi.fn(),
  onClearFilters: vi.fn(),
};

describe("BatchesView", () => {
  it("shows empty state when no batches", () => {
    render(<BatchesView {...baseProps} />);
    expect(screen.getByText(/nenhum batch encontrado/i)).toBeTruthy();
  });
});
