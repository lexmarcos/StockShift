# Product Edit Batches Drawer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a batches drawer in product edit with responsive direction and inline batch editing.

**Architecture:** Keep MVVM for the edit page, add a batch edit form (RHF + Zod + useFieldArray) owned by the edit model, and render the drawer + accordions inside the shared ProductForm view. Drawer opens from the right on lg+ and from the bottom below lg.

**Tech Stack:** Next.js 15, TypeScript, SWR, ky, React Hook Form, Zod, shadcn/ui.

---

### Task 1: Write failing tests for batches drawer model

**Files:**
- Create: `app/products/[id]/edit/products-edit.model.test.ts`

**Step 1: Write the failing tests**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useProductEditModel } from "./products-edit.model";

const useSWRMock = vi.fn();

vi.mock("swr", () => ({
  default: (...args: any[]) => useSWRMock(...args),
  mutate: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(() => ({
      json: vi.fn(async () => ({ success: true, message: null, data: [] })),
    })),
    put: vi.fn(() => ({
      json: vi.fn(async () => ({ success: true, message: "ok", data: {} })),
    })),
  },
}));

vi.mock("@/hooks/use-selected-warehouse", () => ({
  useSelectedWarehouse: () => ({ warehouseId: "wh-1" }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
};

const productResponse = {
  success: true,
  message: null,
  data: {
    id: "prod-1",
    name: "Produto A",
    description: null,
    imageUrl: null,
    categoryId: null,
    brandId: null,
    barcode: null,
    barcodeType: null,
    sku: null,
    isKit: false,
    attributes: null,
    hasExpiration: false,
    active: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
};

const batchesResponse = {
  success: true,
  message: null,
  data: [
    {
      id: "batch-1",
      productId: "prod-1",
      productName: "Produto A",
      productSku: "SKU-1",
      warehouseId: "wh-1",
      warehouseName: "Main",
      warehouseCode: "WH-01",
      quantity: 10,
      batchNumber: "BATCH-001",
      expirationDate: "2026-12-31",
      costPrice: 12.5,
      notes: "note",
      createdAt: "2026-01-02T00:00:00Z",
      updatedAt: "2026-01-03T00:00:00Z",
    },
  ],
};

const setupSWR = () => {
  useSWRMock.mockImplementation((key: string | null) => {
    if (key === "products/prod-1") {
      return { data: productResponse, isLoading: false };
    }
    if (key === "categories") {
      return { data: { success: true, data: [] }, isLoading: false };
    }
    if (key === "brands") {
      return { data: { success: true, data: [] }, isLoading: false };
    }
    if (typeof key === "string" && key.startsWith("batches/product")) {
      return { data: batchesResponse, isLoading: false };
    }
    return { data: undefined, isLoading: false };
  });
};

beforeEach(() => {
  useSWRMock.mockReset();
  setupSWR();
});

describe("useProductEditModel batches drawer", () => {
  it("uses right drawer on lg+", async () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useProductEditModel("prod-1"));
    await waitFor(() => {
      expect(result.current.batchesDrawerDirection).toBe("right");
    });
  });

  it("uses bottom drawer below lg", async () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useProductEditModel("prod-1"));
    await waitFor(() => {
      expect(result.current.batchesDrawerDirection).toBe("bottom");
    });
  });

  it("does not fetch batches until drawer opens", async () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useProductEditModel("prod-1"));

    const hadBatchesKey = useSWRMock.mock.calls.some(
      ([key]) => typeof key === "string" && key.startsWith("batches/product")
    );
    expect(hadBatchesKey).toBe(false);

    await act(async () => {
      result.current.setBatchesDrawerOpen(true);
    });

    const hasBatchesKey = useSWRMock.mock.calls.some(
      ([key]) => typeof key === "string" && key.startsWith("batches/product")
    );
    expect(hasBatchesKey).toBe(true);
  });

  it("updates a batch with mapped payload", async () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useProductEditModel("prod-1"));

    await act(async () => {
      result.current.setBatchesDrawerOpen(true);
    });

    await act(async () => {
      await result.current.onSaveBatch(0);
    });

    const { api } = await import("@/lib/api");
    expect(api.put).toHaveBeenCalledWith("batches/batch-1", {
      json: {
        productId: "prod-1",
        warehouseId: "wh-1",
        quantity: 10,
        batchCode: "BATCH-001",
        expirationDate: "2026-12-31",
        costPrice: 12.5,
        notes: "note",
      },
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test app/products/[id]/edit/products-edit.model.test.ts`

Expected: FAIL (missing exports and batches drawer behavior).

---

### Task 2: Implement batch schema, types, and model behavior

**Files:**
- Create: `app/products/[id]/edit/products-edit.schema.ts`
- Create: `app/products/[id]/edit/products-edit.types.ts`
- Modify: `app/products/[id]/edit/products-edit.model.ts`

**Step 1: Add batch edit schema**

```ts
import { z } from "zod";

export const batchEditItemSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  warehouseName: z.string().min(1),
  warehouseCode: z.string().optional().nullable(),
  batchNumber: z.string().min(1, "Codigo do batch obrigatorio").max(50),
  quantity: z.number().min(0, "Quantidade deve ser positiva"),
  expirationDate: z.string().optional(),
  costPrice: z.number().optional(),
  notes: z.string().optional(),
});

export const batchEditFormSchema = z.object({
  batches: z.array(batchEditItemSchema),
});

export type BatchEditFormValues = z.infer<typeof batchEditFormSchema>;
```

**Step 2: Add batch types**

```ts
export interface Batch {
  id: string;
  productId: string;
  productName: string;
  productSku?: string | null;
  warehouseId: string;
  warehouseName: string;
  warehouseCode?: string | null;
  quantity: number;
  batchNumber: string;
  expirationDate?: string | null;
  costPrice?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BatchesResponse {
  success: boolean;
  message: string | null;
  data: Batch[];
}
```

**Step 3: Update model (drawer state, SWR, form, update handler)**

- Add drawer state and direction logic (`right` for lg+).
- Add SWR for `batches/product/${productId}` only when drawer is open.
- Add `useForm` + `useFieldArray` for batches, reset on data load.
- Add `onSaveBatch(index)` to update via `PUT /api/batches/{id}`.
- Expose `setBatchesDrawerOpen`, `batchesDrawerDirection`, `batchForm`, `batchFields`, `isLoadingBatches`, `onSaveBatch`, `updatingBatchId`.

**Step 4: Run test to verify it passes**

Run: `pnpm test app/products/[id]/edit/products-edit.model.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add app/products/[id]/edit/products-edit.model.ts \
  app/products/[id]/edit/products-edit.schema.ts \
  app/products/[id]/edit/products-edit.types.ts \
  app/products/[id]/edit/products-edit.model.test.ts

git commit -m "feat: add batches drawer model behavior"
```

---

### Task 3: Write failing tests for ProductForm batches drawer UI

**Files:**
- Create: `app/products/components/product-form.view.test.tsx`

**Step 1: Write the failing tests**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
        batchNumber: "BATCH-001",
        warehouseName: "Main",
        warehouseCode: "WH-01",
        quantity: 10,
        expirationDate: "2026-12-31",
      },
    ],
    onSave: vi.fn(),
    updatingBatchId: null,
    form: {} as any,
  },
};

const Wrapper = (props: any) => {
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

  return <ProductForm {...props} form={form} />;
};

describe("ProductForm batches drawer", () => {
  it("shows the batches button in edit mode", () => {
    render(<Wrapper {...baseProps} />);
    expect(screen.getByRole("button", { name: /ver batches/i })).toBeTruthy();
  });

  it("hides the batches button in create mode", () => {
    render(<Wrapper {...baseProps} mode="create" />);
    expect(screen.queryByRole("button", { name: /ver batches/i })).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test app/products/components/product-form.view.test.tsx`

Expected: FAIL (button and drawer not implemented).

---

### Task 4: Implement batches drawer UI and wiring

**Files:**
- Modify: `app/products/components/product-form.types.ts`
- Modify: `app/products/components/product-form.view.tsx`
- Modify: `app/products/[id]/edit/products-edit.model.ts`

**Step 1: Update ProductForm types (drawer props)**

Add a `batchesDrawer` optional prop:

```ts
export interface BatchDrawerField {
  id: string;
  batchNumber: string;
  warehouseName: string;
  warehouseCode?: string | null;
  quantity: number;
  expirationDate?: string | null;
}

export interface BatchesDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  direction: "right" | "bottom";
  isLoading: boolean;
  fields: BatchDrawerField[];
  onSave: (index: number) => void;
  updatingBatchId: string | null;
  form: import("react-hook-form").UseFormReturn<any>;
}

export interface ProductFormProps {
  // ...existing props
  batchesDrawer?: BatchesDrawerProps;
}
```

**Step 2: Add drawer button and UI in ProductForm view**

- Add the header button (edit mode only).
- Render a Drawer with Accordion, using `batchesDrawer` props.
- Use `Form` + `FormField` for batch fields (no nested `<form>` tag).
- Save button calls `batchesDrawer.onSave(index)`.
- Show loading state, empty state, and per-item loading.

**Step 3: Wire model output for view**

- Build `batchesDrawer` object in model return.
- Provide `fields` from `useFieldArray` and `form` from `useForm`.
- Pass `onSave` handler and drawer state to view.

**Step 4: Run tests to verify they pass**

Run:
- `pnpm test app/products/components/product-form.view.test.tsx`
- `pnpm test app/products/[id]/edit/products-edit.model.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add app/products/components/product-form.types.ts \
  app/products/components/product-form.view.tsx \
  app/products/[id]/edit/products-edit.model.ts

git commit -m "feat: add batches drawer UI"
```

---

### Task 5: Full verification

**Step 1: Run focused test suite**

Run: `pnpm test`

Expected: PASS (if dependencies installed).

**Step 2: Commit any remaining changes**

```bash
git add -A
git commit -m "test: verify batches drawer behavior"
```

