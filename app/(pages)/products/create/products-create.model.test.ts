import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProductCreateModel } from "./products-create.model";
import { toast } from "sonner";

const mockPost = vi.fn();
const selectedWarehouse = vi.hoisted(() => ({ warehouseId: "wh-1" as string | null }));

vi.mock("swr", () => ({
  default: vi.fn(() => ({
    data: { data: [] },
    isLoading: false,
  })),
}));

vi.mock("@/hooks/use-selected-warehouse", () => ({
  useSelectedWarehouse: () => ({
    warehouseId: selectedWarehouse.warehouseId,
    setWarehouseId: vi.fn(),
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/lib/api", () => ({
  api: {
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/components/breadcrumb", () => ({
  useBreadcrumb: vi.fn(),
}));

describe("useProductCreateModel - multipart submit", () => {
  const baseFormData = {
    name: "Produto Teste",
    description: "",
    barcode: "",
    categoryId: "",
    brandId: "",
    isKit: false,
    hasExpiration: false,
    active: true,
    continuousMode: false,
    attributes: { weight: "", dimensions: "" },
    quantity: 10,
    manufacturedDate: "",
    expirationDate: "",
    costPrice: undefined,
    sellingPrice: undefined,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    selectedWarehouse.warehouseId = "wh-1";
    localStorage.clear();
    mockPost.mockReturnValue({
      json: vi.fn(async () => ({
        success: true,
        message: "ok",
        data: {},
      })),
    });
  });

  it("sends product JSON as multipart form-data", async () => {
    const { result } = renderHook(() => useProductCreateModel());

    await act(async () => {
      await result.current.onSubmit(baseFormData);
    });

    const [url, options] = mockPost.mock.calls[0];
    expect(url).toBe("batches/with-product");
    expect(options).toHaveProperty("body");

    const body = (options as { body: FormData }).body;
    const productPart = body.get("product");
    expect(productPart).toBeTruthy();
    expect(body.get("image")).toBeNull();
  });

  it("includes image part when provided", async () => {
    const { result } = renderHook(() => useProductCreateModel());
    const image = new File(["file"], "image.png", { type: "image/png" });

    act(() => {
      result.current.handleImageSelect(image);
    });

    await act(async () => {
      await result.current.onSubmit(baseFormData);
    });

    const [, options] = mockPost.mock.calls[0];
    const body = (options as { body: FormData }).body;
    const imagePart = body.get("image");
    expect(imagePart).toBeInstanceOf(File);
  });

  it("handles scanner, AI modal and AI fill data", () => {
    const { result } = renderHook(() => useProductCreateModel());
    const image = new File(["img"], "ai.png", { type: "image/png" });

    act(() => {
      result.current.openScanner();
      result.current.handleBarcodeScan("789");
      result.current.closeScanner();
      result.current.openAiModal();
      result.current.handleAiFill(
        {
          name: "Café",
          categoryId: "cat-1",
          brandId: "brand-1",
          volumeValue: "500",
          volumeUnit: "g",
        },
        image,
        true,
      );
      result.current.closeAiModal();
    });

    expect(result.current.isScannerOpen).toBe(false);
    expect(result.current.isAiModalOpen).toBe(false);
    expect(result.current.form.getValues("barcode")).toBe("789");
    expect(result.current.form.getValues("name")).toBe("Café");
    expect(result.current.form.getValues("attributes.weight")).toBe("500g");
    expect(result.current.productImage).toBe(image);
    expect(toast.success).toHaveBeenCalledWith("Dados preenchidos via IA!");
  });

  it("blocks submit when warehouse is missing", async () => {
    selectedWarehouse.warehouseId = null;
    const { result } = renderHook(() => useProductCreateModel());

    await act(async () => {
      await result.current.onSubmit(baseFormData);
    });

    expect(mockPost).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Selecione um warehouse para criar o produto");
  });

  it("blocks submit when custom attribute is incomplete or duplicated", async () => {
    const { result } = renderHook(() => useProductCreateModel());

    act(() => {
      result.current.addCustomAttribute();
    });

    await act(async () => {
      await result.current.onSubmit(baseFormData);
    });

    expect(toast.error).toHaveBeenCalledWith("Atributo 1: Nome e valor são obrigatórios");

    act(() => {
      result.current.updateCustomAttribute(0, "key", "color");
      result.current.updateCustomAttribute(0, "value", "blue");
      result.current.addCustomAttribute();
    });

    act(() => {
      result.current.updateCustomAttribute(1, "key", "Color");
      result.current.updateCustomAttribute(1, "value", "red");
    });

    await act(async () => {
      await result.current.onSubmit(baseFormData);
    });

    expect(toast.error).toHaveBeenCalledWith('Já existe um atributo com o nome "color"');
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("submits continuous mode and resets preserving category and brand", async () => {
    const { result } = renderHook(() => useProductCreateModel());

    act(() => {
      result.current.form.setValue("categoryId", "cat-1");
      result.current.form.setValue("brandId", "brand-1");
      result.current.addCustomAttribute();
    });

    act(() => {
      result.current.updateCustomAttribute(0, "key", "origin");
      result.current.updateCustomAttribute(0, "value", "BR");
    });

    await act(async () => {
      await result.current.onSubmit({
        ...baseFormData,
        categoryId: "cat-1",
        brandId: "brand-1",
        continuousMode: true,
        attributes: { weight: "1kg", dimensions: "10x10" },
      });
    });

    expect(toast.success).toHaveBeenCalledWith("Produto Teste criado! Pronto para o próximo produto.");
    expect(result.current.form.getValues("categoryId")).toBe("cat-1");
    expect(result.current.form.getValues("brandId")).toBe("brand-1");
    expect(result.current.customAttributes).toEqual([]);
  });

  it("shows fallback error when create request fails", async () => {
    mockPost.mockImplementationOnce(() => {
      throw new Error("fail");
    });
    const { result } = renderHook(() => useProductCreateModel());

    await act(async () => {
      await result.current.onSubmit(baseFormData);
    });

    expect(toast.error).toHaveBeenCalledWith("Erro ao criar produto. Verifique os dados.");
    expect(result.current.isSubmitting).toBe(false);
  });
});
