import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useProductEditModel } from "./products-edit.model";
import { api } from "@/lib/api";
import { toast } from "sonner";

const swrMock = vi.fn();

vi.mock("swr", () => ({
  default: (...args: unknown[]) => swrMock(...args),
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

vi.mock("@/components/breadcrumb", () => ({
  useBreadcrumb: vi.fn(),
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

const productWithRelationsResponse = {
  ...productResponse,
  data: {
    ...productResponse.data,
    categoryId: "cat-current",
    categoryName: "Categoria Legada",
    brandId: "brand-current",
    attributes: {
      weight: "1kg",
      dimensions: "10x10",
      color: "red",
    },
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
      batchCode: "BATCH-001",
      expirationDate: "2026-12-31",
      costPrice: 1250,
      sellingPrice: 1990,
      notes: "note",
      createdAt: "2026-01-02T00:00:00Z",
      updatedAt: "2026-01-03T00:00:00Z",
    },
  ],
};

const setupSWR = () => {
  swrMock.mockImplementation((key: string | null) => {
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
  swrMock.mockReset();
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

    const hadBatchesKey = swrMock.mock.calls.some(
      ([key]) => typeof key === "string" && key.startsWith("batches/product")
    );
    expect(hadBatchesKey).toBe(false);

    await act(async () => {
      result.current.batchesDrawer.onOpenChange(true);
    });

    const hasBatchesKey = swrMock.mock.calls.some(
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
        costPrice: 1250,
        sellingPrice: 1990,
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
      result.current.batchesDrawer.form.setValue("batches.0.batchCode", "");
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
        costPrice: 1250,
        sellingPrice: 1990,
        notes: "note",
      },
    });
  });

  it("populates fallback category, brand and custom attributes from product", async () => {
    swrMock.mockImplementation((key: string | null) => {
      if (key === "products/prod-1") return { data: productWithRelationsResponse, isLoading: false };
      if (key === "categories") return { data: { success: true, data: [] }, isLoading: false };
      if (key === "brands") return { data: { success: true, data: [] }, isLoading: false };
      return { data: undefined, isLoading: false };
    });
    mockMatchMedia(false);

    const { result } = renderHook(() => useProductEditModel("prod-1"));

    await waitFor(() => {
      expect(result.current.isFormReady).toBe(true);
    });

    expect(result.current.categories[0]).toEqual({
      id: "cat-current",
      name: "Categoria Legada",
    });
    expect(result.current.brands[0]).toEqual({
      id: "brand-current",
      name: "Marca atual",
    });
    expect(result.current.customAttributes[0]).toMatchObject({
      key: "color",
      value: "red",
    });
  });

  it("manages scanner, image and custom attribute state", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useProductEditModel("prod-1"));
    const image = new File(["img"], "product.png", { type: "image/png" });

    act(() => {
      result.current.openScanner();
      result.current.handleBarcodeScan("789");
      result.current.closeScanner();
      result.current.handleImageSelect(image);
      result.current.addCustomAttribute();
    });

    act(() => {
      result.current.updateCustomAttribute(0, "key", "color");
      result.current.updateCustomAttribute(0, "value", "blue");
    });

    expect(result.current.isScannerOpen).toBe(false);
    expect(result.current.form.getValues("barcode")).toBe("789");
    expect(result.current.productImage).toBe(image);
    expect(result.current.customAttributes[0]).toMatchObject({
      key: "color",
      value: "blue",
    });

    act(() => {
      result.current.removeCustomAttribute(0);
      result.current.handleImageRemove();
    });

    expect(result.current.customAttributes).toEqual([]);
    expect(result.current.productImage).toBeNull();
  });

  it("blocks submit when custom attribute is incomplete", async () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useProductEditModel("prod-1"));

    act(() => {
      result.current.addCustomAttribute();
    });

    await act(async () => {
      await result.current.onSubmit({
        name: "Produto A",
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
      });
    });

    expect(toast.error).toHaveBeenCalledWith("Atributo 1: Nome e valor são obrigatórios");
    expect(api.put).not.toHaveBeenCalledWith("products/prod-1", expect.anything());
  });

  it("submits product update with image and merged attributes", async () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useProductEditModel("prod-1"));
    const image = new File(["img"], "product.png", { type: "image/png" });

    act(() => {
      result.current.handleImageSelect(image);
      result.current.addCustomAttribute();
    });

    act(() => {
      result.current.updateCustomAttribute(0, "key", "color");
      result.current.updateCustomAttribute(0, "value", "blue");
    });

    await act(async () => {
      await result.current.onSubmit({
        name: "Produto A",
        description: "desc",
        barcode: "789",
        isKit: false,
        hasExpiration: true,
        active: true,
        continuousMode: false,
        categoryId: "cat-1",
        brandId: "brand-1",
        attributes: { weight: "1kg", dimensions: "" },
        quantity: 0,
        manufacturedDate: "",
        expirationDate: "",
        costPrice: undefined,
        sellingPrice: undefined,
      });
    });

    expect(api.put).toHaveBeenCalledWith("products/prod-1", {
      body: expect.any(FormData),
    });
    const [, options] = vi.mocked(api.put).mock.calls.find(
      ([url]) => url === "products/prod-1",
    )!;
    const body = (options as { body: FormData }).body;
    expect(body.get("image")).toBe(image);
    expect(toast.success).toHaveBeenCalledWith("Produto atualizado com sucesso!");
  });

  it("shows fallback error when product update fails", async () => {
    vi.mocked(api.put).mockImplementationOnce(() => {
      throw new Error("fail");
    });
    mockMatchMedia(false);
    const { result } = renderHook(() => useProductEditModel("prod-1"));

    await act(async () => {
      await result.current.onSubmit({
        name: "Produto A",
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
      });
    });

    expect(toast.error).toHaveBeenCalledWith("Erro ao atualizar produto. Verifique os dados.");
    expect(result.current.isSubmitting).toBe(false);
  });

  it("does not save invalid or missing batch and reports batch API errors", async () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useProductEditModel("prod-1"));

    await act(async () => {
      await result.current.batchesDrawer.onSave(99);
    });

    expect(vi.mocked(api.put)).not.toHaveBeenCalledWith("batches/undefined", expect.anything());

    await act(async () => {
      result.current.batchesDrawer.onOpenChange(true);
    });

    await waitFor(() => {
      expect(result.current.batchesDrawer.fields.length).toBe(1);
    });

    vi.mocked(api.put).mockImplementationOnce(() => {
      throw new Error("Batch falhou");
    });

    await act(async () => {
      await result.current.batchesDrawer.onSave(0);
    });

    expect(toast.error).toHaveBeenCalledWith("Batch falhou");
  });
});
