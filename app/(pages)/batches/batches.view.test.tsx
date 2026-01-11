import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { BatchesView } from "./batches.view";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

afterEach(() => cleanup());

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

const batchItem = {
  id: "b1",
  productId: "p1",
  productName: "Produto A",
  productSku: "SKU-A",
  warehouseId: "w1",
  warehouseName: "Central",
  warehouseCode: "WH-1",
  quantity: 12,
  batchNumber: "BATCH-001",
  expirationDate: "2026-01-20",
  costPrice: 10,
  sellingPrice: 18,
  notes: "",
  createdAt: "2026-01-01T10:00:00Z",
  updatedAt: "2026-01-01T10:00:00Z",
};

describe("BatchesView", () => {
  it("shows empty state when no batches", () => {
    render(<BatchesView {...baseProps} />);
    expect(screen.getByText(/nenhum lote cadastrado/i)).toBeTruthy();
  });

  it("renders action icon in table actions", () => {
    render(<BatchesView {...baseProps} batches={[batchItem]} />);
    expect(screen.getByRole("button", { name: /ver detalhes/i })).toBeTruthy();
  });

  it("changes sort when clicking product header", () => {
    const setSortConfig = vi.fn();
    render(
      <BatchesView
        {...baseProps}
        batches={[batchItem]}
        setSortConfig={setSortConfig}
      />
    );

    fireEvent.click(screen.getByRole("columnheader", { name: /produto/i }));
    expect(setSortConfig).toHaveBeenCalledWith({ key: "product", direction: "asc" });
  });
});
