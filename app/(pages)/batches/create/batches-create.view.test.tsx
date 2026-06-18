import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { BatchCreateView } from "./batches-create.view";
import type { BatchCreateFormData } from "./batches-create.schema";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode; href: string }) => <a {...props}>{children}</a>,
}));

vi.mock("@/components/product/barcode-scanner-modal", () => ({
  BarcodeScannerModal: ({
    open,
    onScan,
  }: {
    open: boolean;
    onScan: (barcode: string) => void;
  }) =>
    open ? (
      <button type="button" onClick={() => onScan("7890000000000")}>
        Mock scanner
      </button>
    ) : null,
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

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const baseProps = {
  onSubmit: vi.fn(),
  productSearchQuery: "Produto A",
  productOptions: [
    {
      id: "prod-1",
      name: "Produto A",
      sku: "SKU-01",
      barcode: "7890000000000",
      hasExpiration: false,
    },
  ],
  isProductSearchLoading: false,
  isProductOptionsOpen: false,
  onProductSearchChange: vi.fn(),
  onProductSearchFocus: vi.fn(),
  onProductSearchBlur: vi.fn(),
  onProductSelect: vi.fn(),
  onProductClear: vi.fn(),
  openScanner: vi.fn(),
  closeScanner: vi.fn(),
  isScannerOpen: false,
  handleBarcodeScan: vi.fn(),
  selectedWarehouseId: "wh-1",
  onQuantityIncrement: vi.fn(),
  onQuantityDecrement: vi.fn(),
  selectedProduct: { id: "prod-1", name: "Produto A", hasExpiration: false },
  latestBatchPriceSuggestion: null,
  isLatestBatchPriceLoading: false,
  onApplyLatestCostPrice: vi.fn(),
  onApplyLatestSellingPrice: vi.fn(),
};

const Wrapper = ({
  defaultValues,
  viewProps,
}: {
  defaultValues?: Partial<BatchCreateFormData>;
  viewProps?: Partial<Omit<React.ComponentProps<typeof BatchCreateView>, "form">>;
}) => {
  const form = useForm<BatchCreateFormData>({
    defaultValues: {
      productId: "prod-1",
      quantity: 1,
      manufacturedDate: "",
      expirationDate: "",
      costPrice: undefined,
      sellingPrice: undefined,
      notes: "",
      ...defaultValues,
    },
  });

  return <BatchCreateView {...baseProps} {...viewProps} form={form} />;
};

describe("BatchCreateView price formatting", () => {
  it("renders prices as BRL", () => {
    render(<Wrapper defaultValues={{ costPrice: 1250, sellingPrice: 1990 }} />);
    const costLabel = screen.getAllByText((_, element) =>
      element?.tagName === "LABEL" && element.textContent?.includes("Custo")
    )[0];
    const sellingLabel = screen.getAllByText((_, element) =>
      element?.tagName === "LABEL" && element.textContent?.includes("Venda")
    )[0];
    const costItem = costLabel.closest("[data-slot='form-item']");
    const sellingItem = sellingLabel.closest("[data-slot='form-item']");
    const costInput = costItem?.querySelector("input") as HTMLInputElement;
    const sellingInput = sellingItem?.querySelector("input") as HTMLInputElement;
    expect(costInput?.value).toBe("R$ 12,50");
    expect(sellingInput?.value).toBe("R$ 19,90");
  });

  it("does not render warehouse selector or batch code input", () => {
    render(<Wrapper />);
    expect(screen.queryByText(/Armazém de Destino/i)).toBeNull();
    expect(screen.queryByText(/Batch Code/i)).toBeNull();
  });

  it("calls quantity stepper actions", () => {
    render(<Wrapper />);
    fireEvent.click(screen.getByLabelText("Aumentar quantidade"));
    fireEvent.click(screen.getByLabelText("Diminuir quantidade"));
    expect(baseProps.onQuantityIncrement).toHaveBeenCalledTimes(1);
    expect(baseProps.onQuantityDecrement).toHaveBeenCalledTimes(1);
  });

  it("renders product image and fallback icon in search options", () => {
    render(
      <Wrapper
        viewProps={{
          isProductOptionsOpen: true,
          productOptions: [
            {
              id: "prod-1",
              name: "Produto com foto",
              sku: "SKU-01",
              imageUrl: "https://cdn.test/produto.png",
              hasExpiration: false,
            },
            {
              id: "prod-2",
              name: "Produto sem foto",
              sku: "SKU-02",
              imageUrl: null,
              hasExpiration: false,
            },
          ],
        }}
      />,
    );

    const productImage = screen.getByLabelText("Foto de Produto com foto");
    expect(productImage.getAttribute("style")).toContain(
      "https://cdn.test/produto.png",
    );
    expect(screen.getByLabelText("Produto sem foto")).not.toBeNull();
  });
});
