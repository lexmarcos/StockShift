import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProductsModel } from "./products.model";

const mockMutate = vi.fn();
const mockGet = vi.fn();
const mockDelete = vi.fn();

let swrData: any;

vi.mock("swr", () => ({
  default: vi.fn(() => ({
    data: swrData,
    error: null,
    isLoading: false,
    mutate: mockMutate,
  })),
}));

vi.mock("@/hooks/use-selected-warehouse", () => ({
  useSelectedWarehouse: () => ({
    warehouseId: "wh-1",
    setWarehouseId: vi.fn(),
  }),
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useProductsModel - delete flow", () => {
  const baseProduct = {
    id: "prod-1",
    name: "Produto Teste",
    sku: "SKU-1",
    barcode: "123",
    barcodeType: "EAN13",
    description: null,
    categoryId: null,
    categoryName: null,
    brand: null,
    isKit: false,
    attributes: {},
    hasExpiration: false,
    active: true,
    totalQuantity: 0,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    swrData = {
      success: true,
      data: {
        content: [baseProduct],
        pageable: {
          pageNumber: 0,
          pageSize: 20,
          sort: [],
          offset: 0,
          unpaged: false,
          paged: true,
        },
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 20,
        empty: false,
      },
    };
  });

  it("loads and filters batches for the current warehouse when opening delete dialog", async () => {
    mockGet.mockReturnValue({
      json: vi.fn(async () => ({
        success: true,
        data: [
          {
            id: "b1",
            productId: "prod-1",
            productName: "Produto Teste",
            warehouseId: "wh-1",
            quantity: 5,
            batchNumber: "L1",
            expirationDate: null,
          },
          {
            id: "b2",
            productId: "prod-1",
            productName: "Produto Teste",
            warehouseId: "wh-2",
            quantity: 10,
            batchNumber: "L2",
            expirationDate: null,
          },
          {
            id: "b3",
            productId: "prod-1",
            productName: "Produto Teste",
            warehouseId: "wh-1",
            quantity: 0,
            batchNumber: "L3",
            expirationDate: null,
          },
        ],
      })),
    });

    const { result } = renderHook(() => useProductsModel());

    await act(async () => {
      await result.current.onOpenDeleteDialog(result.current.products[0]);
    });

    expect(result.current.deleteDialogOpen).toBe(true);
    expect(result.current.deleteProduct?.id).toBe("prod-1");
    expect(result.current.deleteBatches).toHaveLength(1);
    expect(result.current.deleteBatches[0].warehouseId).toBe("wh-1");
    expect(result.current.isCheckingDeleteBatches).toBe(false);
  });

  it("opens second confirmation when warehouse has stock and deletes after confirmation", async () => {
    mockGet.mockReturnValue({
      json: vi.fn(async () => ({
        success: true,
        data: [
          {
            id: "b1",
            productId: "prod-1",
            productName: "Produto Teste",
            warehouseId: "wh-1",
            quantity: 2,
            batchNumber: "L1",
            expirationDate: null,
          },
        ],
      })),
    });
    mockDelete.mockReturnValue({
      json: vi.fn(async () => ({
        success: true,
        message: "Product deleted successfully",
        data: null,
      })),
    });

    const { result } = renderHook(() => useProductsModel());

    await act(async () => {
      await result.current.onOpenDeleteDialog(result.current.products[0]);
    });

    await act(async () => {
      await result.current.onConfirmDelete();
    });

    expect(result.current.secondConfirmOpen).toBe(true);
    expect(result.current.deleteDialogOpen).toBe(false);
    expect(mockDelete).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.onSecondConfirmDelete();
    });

    expect(mockDelete).toHaveBeenCalledWith("products/prod-1");
    expect(result.current.secondConfirmOpen).toBe(false);
  });

  it("deletes immediately when no warehouse stock exists", async () => {
    mockGet.mockReturnValue({
      json: vi.fn(async () => ({
        success: true,
        data: [
          {
            id: "b1",
            productId: "prod-1",
            productName: "Produto Teste",
            warehouseId: "wh-2",
            quantity: 4,
            batchNumber: "L2",
            expirationDate: null,
          },
        ],
      })),
    });
    mockDelete.mockReturnValue({
      json: vi.fn(async () => ({
        success: true,
        message: "Product deleted successfully",
        data: null,
      })),
    });

    const { result } = renderHook(() => useProductsModel());

    await act(async () => {
      await result.current.onOpenDeleteDialog(result.current.products[0]);
    });

    await act(async () => {
      await result.current.onConfirmDelete();
    });

    expect(mockDelete).toHaveBeenCalledWith("products/prod-1");
    expect(result.current.secondConfirmOpen).toBe(false);
    expect(result.current.deleteDialogOpen).toBe(false);
  });
});
