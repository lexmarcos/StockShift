import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { BatchesView } from "./batches.view";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode; href: string }) => <a {...props}>{children}</a>,
}));

vi.mock("@/lib/contexts/auth-context", () => ({
  useAuth: () => ({
    user: { userId: "1", email: "test@test.com", fullName: "Test User" },
    isLoading: false,
    isAuthenticated: true,
    logout: vi.fn(),
    hasPermission: () => true,
    hasRole: () => false,
    isAdmin: false,
  }),
}));

afterEach(() => cleanup());

const baseProps = {
  batches: [],
  groupedByProduct: [],
  isLoading: false,
  error: null,
  filters: {
    searchQuery: "",
    warehouseId: "",
    status: "all" as const,
    lowStockThreshold: 10,
  },
  sortConfig: { key: "createdAt" as const, direction: "desc" as const },
  isGroupedByProduct: false,
  isMobileFiltersOpen: false,
  mobileFiltersDraft: {
    status: "all" as const,
    lowStockThreshold: 10,
    sortKey: "createdAt" as const,
    sortDirection: "desc" as const,
    isGroupedByProduct: false,
  },
  statusCounts: { expired: 0, expiring: 0, low: 0 },
  setSearchQuery: vi.fn(),
  setStatus: vi.fn(),
  onGroupedByProductChange: vi.fn(),
  onSortChange: vi.fn(),
  onMobileFiltersOpenChange: vi.fn(),
  onOpenMobileFilters: vi.fn(),
  onApplyMobileFilters: vi.fn(),
  onClearFilters: vi.fn(),
  onClearMobileFilters: vi.fn(),
  onMobileFilterDraftChange: vi.fn(),
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
    const onSortChange = vi.fn();
    render(
      <BatchesView
        {...baseProps}
        batches={[batchItem]}
        onSortChange={onSortChange}
      />
    );

    fireEvent.click(screen.getByRole("columnheader", { name: /produto/i }));
    expect(onSortChange).toHaveBeenCalledWith("product");
  });

  it("groups lots by product when grouping option is enabled", () => {
    const groupedByProduct = [
      {
        key: "p1",
        productId: "p1",
        productName: "Produto A",
        productSku: "SKU-A",
        totalQuantity: 19,
        batches: [
          batchItem,
          {
            ...batchItem,
            id: "b2",
            batchNumber: "BATCH-002",
            quantity: 7,
          },
        ],
      },
      {
        key: "p2",
        productId: "p2",
        productName: "Produto B",
        productSku: "SKU-B",
        totalQuantity: 12,
        batches: [
          {
            ...batchItem,
            id: "b3",
            productId: "p2",
            productName: "Produto B",
            productSku: "SKU-B",
            batchNumber: "BATCH-003",
          },
        ],
      },
    ];

    render(
      <BatchesView
        {...baseProps}
        batches={[
          batchItem,
          {
            ...batchItem,
            id: "b2",
            batchNumber: "BATCH-002",
            quantity: 7,
          },
          {
            ...batchItem,
            id: "b3",
            productId: "p2",
            productName: "Produto B",
            productSku: "SKU-B",
            batchNumber: "BATCH-003",
          },
        ]}
        groupedByProduct={groupedByProduct}
        isGroupedByProduct
      />
    );

    expect(
      screen.getByRole("button", { name: /produto a/i })
    ).toBeTruthy();

    expect(screen.getByText(/2 lotes/i)).toBeTruthy();
    expect(screen.getByText(/1 lote/i)).toBeTruthy();
  });
});
