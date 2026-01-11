import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, within } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { ProductForm } from "./product-form.view";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

vi.mock("@/components/product/barcode-scanner-modal", () => ({
  BarcodeScannerModal: () => null,
}));

vi.mock("@/components/product/image-dropzone", () => ({
  ImageDropzone: () => null,
}));

afterEach(() => cleanup());

const baseProps = {
  mode: "edit" as const,
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
  productImage: null,
  currentImageUrl: undefined,
  handleImageSelect: vi.fn(),
  handleImageRemove: vi.fn(),
  batchesDrawer: {
    isOpen: false,
    onOpenChange: vi.fn(),
    direction: "bottom" as const,
    isLoading: false,
    fields: [
      {
        id: "batch-1",
        fieldId: "field-1",
        productId: "prod-1",
        warehouseId: "wh-1",
        warehouseName: "Main",
        warehouseCode: "WH-01",
        quantity: 10,
        batchCode: "BATCH-001",
        expirationDate: "2026-12-31",
        costPrice: 1250,
        sellingPrice: 1990,
        notes: "note",
      },
    ],
    onSave: vi.fn(),
    updatingBatchId: null,
    form: {} as any,
  },
};

const Wrapper = (props: any) => {
  const {
    batchesDrawer: batchesDrawerOverride,
    defaultValues,
    ...rest
  } = props;
  const useOverride = Object.prototype.hasOwnProperty.call(
    props,
    "batchesDrawer"
  );
  const form = useForm({
    defaultValues: {
      name: "Produto",
      description: "",
      barcode: "",
      isKit: false,
      hasExpiration: false,
      active: true,
      continuousMode: false,
      categoryId: "",
      brandId: "",
      attributes: { weight: "", dimensions: "" },
      quantity: 0,
      manufacturedDate: "",
      expirationDate: "",
      costPrice: undefined,
      sellingPrice: undefined,
      ...defaultValues,
    },
  });

  const batchesDrawerValue = useOverride
    ? batchesDrawerOverride
    : baseProps.batchesDrawer;
  const batchForm = useForm({
    defaultValues: {
      batches: (batchesDrawerValue?.fields ?? []) as typeof baseProps.batchesDrawer.fields,
    },
  });

  const batchesDrawerProp = batchesDrawerValue
    ? { ...batchesDrawerValue, form: batchForm }
    : undefined;

  return (
    <ProductForm
      {...rest}
      form={form}
      batchesDrawer={batchesDrawerProp}
    />
  );
};

describe("ProductForm batches drawer", () => {
  it("shows the batches button in edit mode", () => {
    render(
      <Wrapper
        {...baseProps}
        batchesDrawer={{ ...baseProps.batchesDrawer, isOpen: true }}
      />
    );
    expect(screen.getByText(/gerenciar lotes/i)).toBeTruthy();
  });

  it("hides the batches button in create mode", () => {
    render(<Wrapper {...baseProps} mode="create" batchesDrawer={undefined} />);
    expect(screen.queryByRole("button", { name: /ver batches/i })).toBeNull();
  });

  it("shows selling price field in the batches drawer", () => {
    render(
      <Wrapper
        {...baseProps}
        batchesDrawer={{ ...baseProps.batchesDrawer, isOpen: true }}
      />
    );
    fireEvent.click(screen.getByText(/batch-001/i));
    const drawer = screen.getByTestId("batch-accordion-scroll");
    expect(within(drawer).getByText(/pre.o de venda/i)).toBeTruthy();
  });

  it("adds a scroll container to the batch accordion content", () => {
    render(
      <Wrapper
        {...baseProps}
        batchesDrawer={{ ...baseProps.batchesDrawer, isOpen: true }}
      />
    );
    fireEvent.click(screen.getByText(/batch-001/i));
    const scrollContainer = screen.getByTestId("batch-accordion-scroll");
    expect(scrollContainer.className).toContain("max-h-[70vh]");
    expect(scrollContainer.className).toContain("overflow-y-auto");
  });
});

describe("ProductForm price formatting", () => {
  it("renders main prices as BRL", () => {
    render(
      <Wrapper
        {...baseProps}
        mode="create"
        batchesDrawer={undefined}
        defaultValues={{ costPrice: 1250, sellingPrice: 1990 }}
      />
    );
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

  it("renders batch drawer prices as BRL", () => {
    render(
      <Wrapper
        {...baseProps}
        batchesDrawer={{ ...baseProps.batchesDrawer, isOpen: true }}
      />
    );
    fireEvent.click(screen.getByText(/batch-001/i));
    const drawer = screen.getByTestId("batch-accordion-scroll");
    const costLabel = within(drawer).getAllByText((_, element) =>
      element?.tagName === "LABEL" && element.textContent?.includes("Custo")
    )[0];
    const sellingLabel = within(drawer).getAllByText((_, element) =>
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
