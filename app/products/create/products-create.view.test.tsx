import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { ProductCreateView } from "./products-create.view";
import type { ProductCreateFormData } from "./products-create.schema";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

vi.mock("@/components/product/custom-attributes-builder", () => ({
  CustomAttributesBuilder: () => null,
}));

vi.mock("@/components/product/barcode-scanner-modal", () => ({
  BarcodeScannerModal: () => null,
}));

afterEach(() => cleanup());

const baseProps = {
  onSubmit: vi.fn(),
  isSubmitting: false,
  categories: [],
  isLoadingCategories: false,
  brands: [],
  isLoadingBrands: false,
  customAttributes: [],
  addCustomAttribute: vi.fn(),
  removeCustomAttribute: vi.fn(),
  updateCustomAttribute: vi.fn(),
  nameInputRef: { current: null },
  openScanner: vi.fn(),
  closeScanner: vi.fn(),
  isScannerOpen: false,
  handleBarcodeScan: vi.fn(),
  warehouseId: "wh-1",
};

const Wrapper = ({
  defaultValues,
}: {
  defaultValues?: Partial<ProductCreateFormData>;
}) => {
  const form = useForm<ProductCreateFormData>({
    defaultValues: {
      name: "Produto",
      description: "",
      barcode: "",
      categoryId: "",
      brandId: "",
      isKit: false,
      hasExpiration: false,
      active: true,
      continuousMode: false,
      attributes: { weight: "", dimensions: "" },
      quantity: 0,
      manufacturedDate: "",
      expirationDate: "",
      costPrice: undefined,
      sellingPrice: undefined,
      ...defaultValues,
    },
  });

  return <ProductCreateView {...baseProps} form={form} />;
};

describe("ProductCreateView price formatting", () => {
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
});
