import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ProductsView } from "./products.view";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode; href: string }) => <a {...props}>{children}</a>,
}));

vi.mock("@/components/product/scanner-drawer/scanner-drawer", () => ({
  ScannerDrawer: () => null,
}));

vi.mock("@/components/ui/responsive-modal", () => ({
  ResponsiveModal: ({ children, open, title, footer }: { children: React.ReactNode; open: boolean; title: string; footer: React.ReactNode }) =>
    open ? (
      <div data-testid="responsive-modal">
        <h2>{title}</h2>
        {children}
        {footer}
      </div>
    ) : null,
}));

afterEach(() => cleanup());

const baseProps = {
  products: [],
  isLoading: false,
  error: null,
  requiresWarehouse: false,
  filters: {
    searchQuery: "",
    sortBy: "name" as const,
    sortOrder: "asc" as const,
    page: 0,
    pageSize: 20,
  },
  pagination: {
    page: 0,
    pageSize: 20,
    totalPages: 1,
    totalElements: 1,
  },
  onPageChange: vi.fn(),
  onPageSizeChange: vi.fn(),
  onSearchChange: vi.fn(),
  onSortChange: vi.fn(),
  onOpenDeleteDialog: vi.fn(),
  onConfirmDelete: vi.fn(),
  onSecondConfirmDelete: vi.fn(),
  onCloseDeleteDialog: vi.fn(),
  onCloseSecondConfirm: vi.fn(),
  deleteDialogOpen: false,
  secondConfirmOpen: false,
  deleteProduct: null,
  deleteBatches: [],
  isCheckingDeleteBatches: false,
  isDeletingProduct: false,
};

const productItem = {
  id: "prod-1",
  name: "Produto Teste",
  sku: "SKU-1",
  barcode: "123",
  barcodeType: "EAN13",
  description: null,
  categoryId: null,
  categoryName: null,
  brand: null,
  isKit: false,
  attributes: {},
  hasExpiration: false,
  active: true,
  totalQuantity: 0,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

describe("ProductsView - delete action", () => {
  it("renders product in the list", () => {
    render(
      <ProductsView
        {...baseProps}
        products={[productItem]}
      />
    );

    expect(screen.getAllByText("Produto Teste").length).toBeGreaterThan(0);
  });

  it("shows delete modal when deleteDialogOpen is true", () => {
    render(
      <ProductsView
        {...baseProps}
        products={[productItem]}
        deleteDialogOpen
        deleteProduct={productItem}
      />
    );

    expect(screen.getByText(/confirmar remoção/i)).toBeTruthy();
  });

  it("shows warning block with batches when delete dialog is open", () => {
    render(
      <ProductsView
        {...baseProps}
        products={[productItem]}
        deleteDialogOpen
        deleteProduct={productItem}
        deleteBatches={[
          {
            id: "b1",
            productId: "prod-1",
            productName: "Produto Teste",
            warehouseId: "wh-1",
            quantity: 3,
            batchNumber: "L1",
            expirationDate: null,
          },
        ]}
      />
    );

    expect(screen.getByText(/ainda existe estoque/i)).toBeTruthy();
  });

  it("renders second confirmation modal when enabled", () => {
    render(
      <ProductsView
        {...baseProps}
        products={[productItem]}
        secondConfirmOpen
        deleteProduct={productItem}
      />
    );

    expect(screen.getByText(/confirmação final/i)).toBeTruthy();
  });
});
