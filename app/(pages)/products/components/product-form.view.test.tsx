import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, within } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { ProductForm } from "./product-form.view";
import type {
  BatchDrawerFormItem,
  BatchesDrawerProps,
  ProductFormProps,
} from "./product-form.types";
import type { ProductCreateFormData } from "../create/products-create.schema";
import type { UseFormReturn } from "react-hook-form";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode; href: string }) => <a {...props}>{children}</a>,
}));

vi.mock("@/components/product/barcode-scanner-modal", () => ({
  BarcodeScannerModal: () => null,
}));

vi.mock("@/components/product/image-dropzone", () => ({
  ImageDropzone: () => null,
}));

afterEach(() => cleanup());

const baseBatchesDrawer: BatchesDrawerProps = {
  isOpen: false,
  onOpenChange: vi.fn(),
  direction: "bottom",
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
  form: {} as UseFormReturn<{ batches: BatchDrawerFormItem[] }>,
};

const baseProps: Omit<ProductFormProps, "form"> = {
  mode: "edit",
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
  batchesDrawer: baseBatchesDrawer,
};

const Wrapper = ({
  defaultValues,
  ...props
}: Omit<ProductFormProps, "form"> & {
  defaultValues?: Partial<ProductCreateFormData>;
}) => {
  const {
    batchesDrawer: batchesDrawerOverride,
    ...rest
  } = props;
  const useOverride = Object.prototype.hasOwnProperty.call(
    props,
    "batchesDrawer"
  );
  const form = useForm<ProductCreateFormData>({
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
    : baseBatchesDrawer;
  const batchFields = (batchesDrawerValue?.fields ?? []) as BatchDrawerFormItem[];
  const batchForm = useForm<{ batches: BatchDrawerFormItem[] }>({
    defaultValues: {
      batches: batchFields,
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
  it("hides inventory and pricing section in edit mode", () => {
    render(
      <Wrapper
        {...baseProps}
        mode="edit"
        batchesDrawer={{ ...baseBatchesDrawer, isOpen: false }}
      />
    );
    expect(screen.queryByText(/estoque e precifica..o/i)).toBeNull();
  });

  it("shows the batches button in edit mode", () => {
    render(
      <Wrapper
        {...baseProps}
        batchesDrawer={{ ...baseBatchesDrawer, isOpen: true }}
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
        batchesDrawer={{ ...baseBatchesDrawer, isOpen: true }}
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
        batchesDrawer={{ ...baseBatchesDrawer, isOpen: true }}
      />
    );
    fireEvent.click(screen.getByText(/batch-001/i));
    const scrollContainer = screen.getByTestId("batch-accordion-scroll");
    expect(scrollContainer.className).toContain("max-h-[70vh]");
    expect(scrollContainer.className).toContain("overflow-y-auto");
  });
});

describe("ProductForm inline stock movement mode", () => {
  it("renders quantity, batch date fields, and batch mode toggle", () => {
    render(
      <Wrapper
        {...baseProps}
        mode="inline"
        batchesDrawer={undefined}
        defaultValues={{ hasExpiration: true }}
      />
    );
    expect(screen.getByText(/^Quantidade$/i)).toBeTruthy();
    expect(screen.getByText(/fabrica..o/i)).toBeTruthy();
    expect(
      screen.getByText((_, element) => {
        return element?.tagName === "LABEL"
          && element.textContent?.trim().startsWith("Validade") === true;
      }),
    ).toBeTruthy();
    expect(screen.queryByText(/qtd. inicial/i)).toBeNull();
    expect(screen.getByText(/modo em lote/i)).toBeTruthy();
  });

  it("keeps a mobile batch mode toggle copy after batch mode was selected", () => {
    render(
      <Wrapper
        {...baseProps}
        mode="inline"
        batchesDrawer={undefined}
      />
    );
    const batchModeItem = screen
      .getByText(/modo em lote/i)
      .closest("[data-slot='form-item']");
    const batchModeSwitch = batchModeItem?.querySelector("button");
    expect(screen.getAllByText(/modo em lote/i)).toHaveLength(1);

    fireEvent.click(batchModeSwitch as HTMLButtonElement);
    expect(screen.getAllByText(/modo em lote/i)).toHaveLength(2);

    fireEvent.click(batchModeSwitch as HTMLButtonElement);
    expect(screen.getAllByText(/modo em lote/i)).toHaveLength(2);
  });

  it("calls inline cancel callback before returning", () => {
    const onCancel = vi.fn();
    render(
      <Wrapper
        {...baseProps}
        mode="inline"
        batchesDrawer={undefined}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByRole("link", { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("renders inline edit actions without batch mode", () => {
    render(
      <Wrapper
        {...baseProps}
        mode="inline"
        batchesDrawer={undefined}
        isInlineEdit
      />
    );

    expect(screen.queryByText(/modo em lote/i)).toBeNull();
    expect(screen.getByRole("button", { name: /salvar edi..o/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /cancelar/i })).toBeTruthy();
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
        batchesDrawer={{ ...baseBatchesDrawer, isOpen: true }}
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
