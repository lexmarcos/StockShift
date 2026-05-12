import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { ProductsView } from "./products.view";

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
  filteredProducts: [],
  isLoading: false,
  error: null,
  requiresWarehouse: false,
  filters: {
    searchQuery: "",
    sortBy: "name" as const,
    sortOrder: "asc" as const,
    stockStatus: "all" as const,
    activeStatus: "all" as const,
    page: 0,
    pageSize: 20,
  },
  setFilters: vi.fn(),
  pagination: {
    page: 0,
    pageSize: 20,
    totalPages: 1,
    totalElements: 1,
  },
  isMobileFiltersOpen: false,
  mobileFiltersDraft: {
    stockStatus: "all" as const,
    activeStatus: "all" as const,
    sortBy: "name" as const,
    sortOrder: "asc" as const,
  },
  onPageChange: vi.fn(),
  onPageSizeChange: vi.fn(),
  onSearchChange: vi.fn(),
  onSortChange: vi.fn(),
  onOutOfStockKpiClick: vi.fn(),
  onMobileFiltersOpenChange: vi.fn(),
  onOpenMobileFilters: vi.fn(),
  onApplyMobileFilters: vi.fn(),
  onClearFilters: vi.fn(),
  onClearMobileFilters: vi.fn(),
  onMobileFilterDraftChange: vi.fn(),
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
        filteredProducts={[productItem]}
      />
    );

    expect(screen.getAllByText("Produto Teste").length).toBeGreaterThan(0);
  });

  it("renders mobile KPI cards outside the inventory accordion", () => {
    const { container } = render(
      <ProductsView
        {...baseProps}
        products={[productItem]}
        filteredProducts={[productItem]}
      />
    );

    const mobileKpis = container.querySelector('[data-slot="mobile-product-kpis"]');

    expect(screen.queryByRole("button", { name: /resumo do inventário/i })).toBeNull();
    expect(mobileKpis).toBeTruthy();
    expect(mobileKpis?.className).toContain("grid-cols-2");
    expect(mobileKpis?.textContent).toContain("Total Geral");
    expect(mobileKpis?.textContent).toContain("Sem Estoque");
    expect(mobileKpis?.textContent).not.toContain("Baixo Estoque");
    expect(mobileKpis?.textContent).not.toContain("Top Categoria");
  });

  it("calls out-of-stock filter when clicking the KPI card", () => {
    const onOutOfStockKpiClick = vi.fn();
    const { container } = render(
      <ProductsView
        {...baseProps}
        products={[productItem]}
        filteredProducts={[productItem]}
        onOutOfStockKpiClick={onOutOfStockKpiClick}
      />
    );

    const mobileKpis = container.querySelector('[data-slot="mobile-product-kpis"]');
    const button = within(mobileKpis as HTMLElement).getByRole("button", {
      name: /sem estoque/i,
    });

    fireEvent.click(button);

    expect(onOutOfStockKpiClick).toHaveBeenCalledTimes(1);
  });

  it("shows delete modal when deleteDialogOpen is true", () => {
    render(
      <ProductsView
        {...baseProps}
        products={[productItem]}
        filteredProducts={[productItem]}
        deleteDialogOpen
        deleteProduct={productItem}
      />
    );

    expect(screen.getByText(/confirmar exclusão/i)).toBeTruthy();
  });

  it("shows warning block with batches when delete dialog is open", () => {
    render(
      <ProductsView
        {...baseProps}
        products={[productItem]}
        filteredProducts={[productItem]}
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
        filteredProducts={[productItem]}
        secondConfirmOpen
        deleteProduct={productItem}
      />
    );

    expect(screen.getByText(/confirmação final/i)).toBeTruthy();
  });
});
