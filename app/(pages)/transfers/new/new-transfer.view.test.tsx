import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NewTransferView } from "./new-transfer.view";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { newTransferSchema, NewTransferSchema } from "./new-transfer.schema";
import { NewTransferViewProps } from "./new-transfer.types";
import React from "react";

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

vi.mock("./new-transfer-scanner.view", () => ({
  NewTransferScanner: () => <div data-testid="transfer-scanner" />,
}));

vi.mock("./new-transfer-batch-drawer.view", () => ({
  NewTransferBatchDrawer: () => <div data-testid="transfer-batch-drawer" />,
}));

const TestWrapper = (props: Partial<NewTransferViewProps>) => {
  const form = useForm<NewTransferSchema>({
    resolver: zodResolver(newTransferSchema),
    defaultValues: {
      destinationWarehouseId: "",
      items: [],
    },
  });

  const defaultProps: NewTransferViewProps = {
    form,
    onSubmit: vi.fn(),
    warehouses: [
      { id: "w1", name: "Warehouse A" },
      { id: "w2", name: "Warehouse B" },
    ],
    products: [
      {
        id: "p1",
        name: "Product 1",
        sku: "P1",
        barcode: "789",
        totalQuantity: 12,
        stockQuantityLabel: "Quantidade: 12 un.",
      },
    ],
    productOptions: [
      {
        id: "p1",
        name: "Product 1",
        sku: "P1",
        barcode: "789",
        totalQuantity: 12,
        stockQuantityLabel: "Quantidade: 12 un.",
      },
    ],
    batches: [
      {
        id: "b1",
        productId: "p1",
        batchCode: "BATCH-001",
        quantity: 100,
        manufacturedDate: null,
        expirationDate: "2026-12-31",
      },
    ],
    batchDrawer: {
      isOpen: false,
      productId: "",
      productName: "",
      selectedBatchId: "",
      quantity: "1",
      error: null,
    },
    isLoading: false,
    isProductSearchLoading: false,
    isProductOptionsOpen: false,
    isBatchLoading: false,
    isScannerOpen: false,
    isFooterVisible: true,
    isSubmitting: false,
    selectedProductId: "",
    productSearchQuery: "",
    addItemError: null,
    onProductSearchChange: vi.fn(),
    onProductSearchFocus: vi.fn(),
    onProductSearchBlur: vi.fn(),
    onProductSelect: vi.fn(),
    onProductClear: vi.fn(),
    onScannerOpenChange: vi.fn(),
    onBarcodeScan: vi.fn(),
    onBatchDrawerOpenChange: vi.fn(),
    onBatchChange: vi.fn(),
    onQuantityChange: vi.fn(),
    onQuantityIncrement: vi.fn(),
    onQuantityDecrement: vi.fn(),
    onConfirmBatch: vi.fn(),
    onRemoveItem: vi.fn(),
    items: [],
    ...props,
  };

  return <NewTransferView {...defaultProps} />;
};

describe("NewTransferView", () => {
  it("renders the form correctly", () => {
    render(<TestWrapper />);
    expect(screen.getByText("Rota")).toBeTruthy();
    expect(screen.getByText("Selecionar produto")).toBeTruthy();

    const buttons = screen.getAllByText("CRIAR TRANSFERÊNCIA");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("shows validation errors when submitting empty form", async () => {
    render(<TestWrapper />);

    const submitBtn = screen.getAllByText("CRIAR TRANSFERÊNCIA")[0];
    fireEvent.click(submitBtn);

    expect(await screen.findByText("Selecione um warehouse de destino")).toBeTruthy();
    expect(await screen.findByText("Adicione pelo menos um item")).toBeTruthy();
  });

  it("shows product quantity instead of product code in autocomplete", () => {
    render(
      <TestWrapper
        isProductOptionsOpen={true}
        productSearchQuery="Product"
      />,
    );

    expect(screen.getByText("Product 1")).toBeTruthy();
    expect(screen.getByText("Quantidade: 12 un.")).toBeTruthy();
    expect(screen.queryByText(/P1/)).toBeNull();
    expect(screen.queryByText(/789/)).toBeNull();
  });
});
