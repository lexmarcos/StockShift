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
  vi.clearAllMocks();
  useSWRMock.mockReset();
  setupSWR();
});

describe("useProductEditModel batches drawer", () => {
  it("uses right drawer on lg+", async () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useProductEditModel("prod-1"));
    await waitFor(() => {
      expect(result.current.batchesDrawer.direction).toBe("right");
    });
  });

  it("uses bottom drawer below lg", async () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useProductEditModel("prod-1"));
    await waitFor(() => {
      expect(result.current.batchesDrawer.direction).toBe("bottom");
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
      result.current.batchesDrawer.onOpenChange(true);
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
      result.current.batchesDrawer.onOpenChange(true);
    });

    await waitFor(() => {
      expect(result.current.batchesDrawer.fields.length).toBe(1);
    });

    await act(async () => {
      await result.current.batchesDrawer.onSave(0);
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

  it("omits batch code when empty", async () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useProductEditModel("prod-1"));

    await act(async () => {
      result.current.batchesDrawer.onOpenChange(true);
    });

    await waitFor(() => {
      expect(result.current.batchesDrawer.fields.length).toBe(1);
    });

    await act(async () => {
      result.current.batchesDrawer.form.setValue("batches.0.batchNumber", "");
    });

    await act(async () => {
      await result.current.batchesDrawer.onSave(0);
    });

    const { api } = await import("@/lib/api");
    expect(api.put).toHaveBeenCalledWith("batches/batch-1", {
      json: {
        productId: "prod-1",
        warehouseId: "wh-1",
        quantity: 10,
        batchCode: undefined,
        expirationDate: "2026-12-31",
        costPrice: 12.5,
        notes: "note",
      },
    });
  });
});
