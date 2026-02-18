import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useProductDetailModel } from "./products-detail.model";

const swrMock = vi.fn();
const useSelectedWarehouseMock = vi.fn();

vi.mock("swr", () => ({
  default: (...args: unknown[]) => swrMock(...args),
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(() => ({
      json: vi.fn(async () => ({ success: true, message: null, data: [] })),
    })),
  },
}));

vi.mock("@/components/breadcrumb", () => ({
  useBreadcrumb: vi.fn(),
}));

vi.mock("@/hooks/use-selected-warehouse", () => ({
  useSelectedWarehouse: () => useSelectedWarehouseMock(),
}));

const productResponse = {
  success: true,
  message: null,
  data: {
    id: "prod-1",
    name: "Produto Teste",
    description: null,
    imageUrl: null,
    categoryId: null,
    categoryName: null,
    brand: null,
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

beforeEach(() => {
  vi.clearAllMocks();
  swrMock.mockReset();
  useSelectedWarehouseMock.mockReturnValue({
    warehouseId: "wh-1",
    setWarehouseId: vi.fn(),
  });

  swrMock.mockImplementation((key: string | null) => {
    if (key === "products/prod-1") {
      return {
        data: productResponse,
        error: null,
        isLoading: false,
        mutate: vi.fn(),
      };
    }

    if (key === "batches/warehouses/wh-1/products/prod-1/batches") {
      return {
        data: { success: true, message: null, data: [] },
        error: null,
        isLoading: false,
      };
    }

    return { data: undefined, error: null, isLoading: false, mutate: vi.fn() };
  });
});

describe("useProductDetailModel", () => {
  it("fetches product batches using selected warehouse and product id", () => {
    renderHook(() => useProductDetailModel("prod-1"));

    expect(swrMock).toHaveBeenCalledWith(
      "batches/warehouses/wh-1/products/prod-1/batches",
      expect.any(Function)
    );
  });

  it("does not fetch product batches when there is no selected warehouse", () => {
    useSelectedWarehouseMock.mockReturnValue({
      warehouseId: null,
      setWarehouseId: vi.fn(),
    });

    renderHook(() => useProductDetailModel("prod-1"));

    expect(swrMock).toHaveBeenCalledWith(null, expect.any(Function));
  });
});
