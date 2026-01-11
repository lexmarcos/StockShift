import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProductCreateModel } from "./products-create.model";

const mockPost = vi.fn();

vi.mock("swr", () => ({
  default: vi.fn(() => ({
    data: { data: [] },
    isLoading: false,
  })),
}));

vi.mock("@/hooks/use-selected-warehouse", () => ({
  useSelectedWarehouse: () => ({
    warehouseId: "wh-1",
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
});
