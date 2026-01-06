import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
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
        costPrice: 12.5,
        notes: "note",
      },
    ],
    onSave: vi.fn(),
    updatingBatchId: null,
    form: {} as any,
  },
};

const Wrapper = (props: any) => {
  const { batchesDrawer: batchesDrawerOverride, ...rest } = props;
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
    render(<Wrapper {...baseProps} />);
    expect(screen.getByRole("button", { name: /ver batches/i })).toBeTruthy();
  });

  it("hides the batches button in create mode", () => {
    render(<Wrapper {...baseProps} mode="create" batchesDrawer={undefined} />);
    expect(screen.getByText(/novo produto/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /ver batches/i })).toBeNull();
  });
});
