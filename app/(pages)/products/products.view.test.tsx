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

// The card resolves its thumbnail through a per-product SWR hook; stub it so the
// view test stays free of network I/O and just exercises the rendered markup.
vi.mock("./products.model", () => ({
  useProductImageUrl: (product: { imageUrl: string | null }) =>
    product.imageUrl ?? null,
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
  latestBatchPriceByProduct: {},
  batchCountByProduct: {},
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
  buildEditUrl: (productId: string) => `/products/${productId}/edit`,
  pagination: {
    page: 0,
    pageSize: 20,
    totalPages: 1,
    totalElements: 1,
  },
  pageRange: [],
  listingTopRef: { current: null },
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
  imageUrl: null,
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

  it("renders compact mobile card with photo, name, quantity, category badge and latest batch price", () => {
    const productWithCategoryAndImage = {
      ...productItem,
      id: "prod-cafe",
      name: "Café Torrado 1kg",
      imageUrl: "https://example.com/cafe.png",
      categoryName: "Bebidas",
      totalQuantity: 12,
    };

    render(
      <ProductsView
        {...baseProps}
        products={[productWithCategoryAndImage]}
        filteredProducts={[productWithCategoryAndImage]}
        latestBatchPriceByProduct={{
          "prod-cafe": {
            batchId: "batch-1",
            sellingPriceCents: 2000,
            sellingPriceLabel: "R$ 20,00",
          },
        }}
        batchCountByProduct={{ "prod-cafe": 3 }}
      />
    );

    expect(screen.getAllByText("Café Torrado 1kg").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bebidas").length).toBeGreaterThan(0);
    expect(screen.getByText("R$ 20,00 • 12 Unids • 3 lotes")).toBeTruthy();
    expect(screen.getByRole("img", { name: /foto de café torrado/i })).toBeTruthy();
  });

  it("renders product image placeholder when product has no photo", () => {
    const productWithoutImage = {
      ...productItem,
      id: "prod-sem-foto",
      name: "Produto Sem Foto",
      categoryName: "Outros",
      totalQuantity: 5,
    };

    render(
      <ProductsView
        {...baseProps}
        products={[productWithoutImage]}
        filteredProducts={[productWithoutImage]}
      />
    );

    expect(screen.getByRole("img", { name: /produto sem foto/i })).toBeTruthy();
  });

  it("hides category badge when product has no category", () => {
    render(
      <ProductsView
        {...baseProps}
        products={[productItem]}
        filteredProducts={[productItem]}
      />
    );

    expect(screen.queryByText(/sem categoria/i)).toBeNull();
  });

  it("shows fallback price label when product has no latest batch", () => {
    const productWithoutBatch = {
      ...productItem,
      id: "prod-no-batch",
      name: "Produto Sem Lote",
      totalQuantity: 3,
    };

    render(
      <ProductsView
        {...baseProps}
        products={[productWithoutBatch]}
        filteredProducts={[productWithoutBatch]}
        latestBatchPriceByProduct={{}}
      />
    );

    expect(screen.getByText(/Sem preço.*Unids/)).toBeTruthy();
  });

  it("truncates long product names in the mobile card", () => {
    const productWithLongName = {
      ...productItem,
      id: "prod-longo",
      name: "Perfume Importado Eau de Parfum 100ml Edição Limitada",
      categoryName: "Perfumes Importados Femininos",
      totalQuantity: 7,
    };

    const { container } = render(
      <ProductsView
        {...baseProps}
        products={[productWithLongName]}
        filteredProducts={[productWithLongName]}
      />
    );

    const card = container.querySelector('[data-testid="product-mobile-card"]');
    const name = card?.querySelector("h3");

    expect(name?.classList.contains("truncate")).toBe(true);
  });
});
