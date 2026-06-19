import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import {
  buildLatestBatchPrice,
  buildLatestBatchPriceByProduct,
  findMostRecentBatch,
  useProductsModel,
} from "./products.model";
import type { ProductBatchPriceSource } from "./products.types";
import { toast } from "sonner";

const renderModel = () =>
  renderHook(() => useProductsModel(), {
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(NuqsTestingAdapter, null, children),
  });

const mockMutate = vi.fn();
const mockGlobalMutate = vi.fn();
const mockGet = vi.fn();
const mockDelete = vi.fn();

const baseProduct = {
  id: "prod-1",
  name: "Produto Teste",
  sku: "SKU-1",
  barcode: "123",
  barcodeType: "EAN13",
  description: null,
  imageUrl: null,
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

let swrData: {
  success: boolean;
  data: {
    content: typeof baseProduct[];
    pageable: {
      pageNumber: number;
      pageSize: number;
      sort: unknown[];
      offset: number;
      unpaged: boolean;
      paged: boolean;
    };
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    empty: boolean;
  };
} | undefined;

let warehouseBatchesData:
  | { success: boolean; data: ProductBatchPriceSource[] }
  | undefined;

let productImagesData: Record<string, string | null> | undefined;

const resolveSwrData = (key: unknown) => {
  if (typeof key === "string" && key.startsWith("batches/warehouse/")) {
    return warehouseBatchesData;
  }
  if (typeof key === "string" && key.startsWith("product-images-")) {
    return productImagesData;
  }
  return swrData;
};

vi.mock("swr", () => ({
  default: vi.fn((key: unknown) => ({
    data: resolveSwrData(key),
    error: null,
    isLoading: false,
    mutate: mockMutate,
  })),
  mutate: (...args: unknown[]) => mockGlobalMutate(...args),
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
    warehouseBatchesData = { success: true, data: [] };
    productImagesData = {};
  });

  it("loads selected warehouse batches with positive stock", async () => {
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
            warehouseId: "wh-1",
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

    const { result } = renderModel();

    await act(async () => {
      await result.current.onOpenDeleteDialog(result.current.products[0]);
    });

    expect(result.current.deleteDialogOpen).toBe(true);
    expect(result.current.deleteProduct?.id).toBe("prod-1");
    expect(mockGet).toHaveBeenCalledWith(
      "batches/warehouses/wh-1/products/prod-1/batches"
    );
    expect(result.current.deleteBatches).toHaveLength(2);
    expect(result.current.deleteBatches[0].warehouseId).toBe("wh-1");
    expect(result.current.isCheckingDeleteBatches).toBe(false);
  });

  it("opens second confirmation and removes batches from selected warehouse", async () => {
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

    const { result } = renderModel();

    await act(async () => {
      await result.current.onOpenDeleteDialog(result.current.products[0]);
    });

    await waitFor(() => {
      expect(result.current.deleteProduct?.id).toBe("prod-1");
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

    expect(mockDelete).toHaveBeenCalledWith(
      "batches/warehouses/wh-1/products/prod-1/batches"
    );
    expect(mockMutate).toHaveBeenCalled();
    expect(mockGlobalMutate).toHaveBeenCalledWith(expect.any(Function));
    expect(result.current.secondConfirmOpen).toBe(false);
  });

  it("removes from selected warehouse when no stock exists", async () => {
    mockGet.mockReturnValue({
      json: vi.fn(async () => ({
        success: true,
        data: [
          {
            id: "b1",
            productId: "prod-1",
            productName: "Produto Teste",
            warehouseId: "wh-1",
            quantity: 0,
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

    const { result } = renderModel();

    await act(async () => {
      await result.current.onOpenDeleteDialog(result.current.products[0]);
    });

    await act(async () => {
      await result.current.onConfirmDelete();
    });

    expect(mockDelete).toHaveBeenCalledWith(
      "batches/warehouses/wh-1/products/prod-1/batches"
    );
    expect(result.current.secondConfirmOpen).toBe(false);
    expect(result.current.deleteDialogOpen).toBe(false);
  });

  it("updates pagination, search and sort filters", () => {
    const { result } = renderModel();

    act(() => {
      result.current.onPageChange(2);
      result.current.onPageSizeChange(50);
      result.current.onSearchChange("cafe");
      result.current.onSortChange("createdAt", "desc");
    });

    expect(result.current.filters).toMatchObject({
      page: 0,
      pageSize: 50,
      searchQuery: "cafe",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    expect(result.current.pagination.totalElements).toBe(1);
  });

  it("filters products without stock from KPI action", () => {
    const { result } = renderModel();

    act(() => {
      result.current.onPageChange(2);
      result.current.onOutOfStockKpiClick();
    });

    expect(result.current.filters.stockStatus).toBe("outOfStock");
    expect(result.current.filters.page).toBe(0);
  });

  it("closes both delete dialogs and clears transient state", async () => {
    mockGet.mockReturnValue({
      json: vi.fn(async () => ({
        success: true,
        data: [
          {
            id: "b1",
            productId: "prod-1",
            productName: "Produto Teste",
            warehouseId: "wh-1",
            quantity: 1,
            batchNumber: "L1",
            expirationDate: null,
          },
        ],
      })),
    });

    const { result } = renderModel();

    await act(async () => {
      await result.current.onOpenDeleteDialog(result.current.products[0]);
    });

    await act(async () => {
      await result.current.onConfirmDelete();
    });

    act(() => {
      result.current.onCloseSecondConfirm();
    });

    expect(result.current.deleteDialogOpen).toBe(false);
    expect(result.current.secondConfirmOpen).toBe(false);
    expect(result.current.deleteProduct).toBeNull();
    expect(result.current.deleteBatches).toEqual([]);
  });

  it("shows API message when checking batches fails", async () => {
    mockGet.mockImplementationOnce(() => {
      throw { response: { data: { message: "Falha ao verificar" } } };
    });

    const { result } = renderModel();

    await act(async () => {
      await result.current.onOpenDeleteDialog(result.current.products[0]);
    });

    expect(toast.error).toHaveBeenCalledWith("Falha ao verificar");
    expect(result.current.isCheckingDeleteBatches).toBe(false);
  });

  it("shows fallback message when second confirm delete request fails", async () => {
    mockGet.mockReturnValue({
      json: vi.fn(async () => ({
        success: true,
        data: [
          {
            id: "b1",
            productId: "prod-1",
            productName: "Produto Teste",
            warehouseId: "wh-1",
            quantity: 1,
            batchNumber: "L1",
            expirationDate: null,
          },
        ],
      })),
    });
    mockDelete.mockImplementationOnce(() => {
      throw {};
    });

    const { result } = renderModel();

    await act(async () => {
      await result.current.onOpenDeleteDialog(result.current.products[0]);
    });

    await act(async () => {
      await result.current.onConfirmDelete();
    });

    expect(result.current.secondConfirmOpen).toBe(true);

    await act(async () => {
      await result.current.onSecondConfirmDelete();
    });

    expect(mockDelete).toHaveBeenCalledWith(
      "batches/warehouses/wh-1/products/prod-1/batches"
    );
    expect(toast.error).toHaveBeenCalledWith(
      "Erro ao remover produto do armazém"
    );
    expect(result.current.isDeletingProduct).toBe(false);
  });

  it("exposes latest batch selling price per product from warehouse batches", async () => {
    warehouseBatchesData = {
      success: true,
      data: [
        {
          id: "batch-old",
          productId: "prod-1",
          sellingPrice: 1500,
          costPrice: 1000,
          createdAt: "2025-01-01T00:00:00Z",
        },
        {
          id: "batch-new",
          productId: "prod-1",
          sellingPrice: 2500,
          costPrice: 1800,
          createdAt: "2025-06-01T00:00:00Z",
        },
      ],
    };

    const { result } = renderModel();

    await waitFor(() => {
      expect(result.current.latestBatchPriceByProduct["prod-1"]).not.toBeNull();
    });

    expect(result.current.latestBatchPriceByProduct["prod-1"]).toMatchObject({
      batchId: "batch-new",
      sellingPriceCents: 2500,
    });
  });

  it("fetches missing product images and merges them into filtered products", async () => {
    productImagesData = { "prod-1": "https://example.com/prod-1.png" };

    const { result } = renderModel();

    await waitFor(() => {
      expect(result.current.filteredProducts[0]?.imageUrl).toBe(
        "https://example.com/prod-1.png"
      );
    });
  });
});

describe("useProductsModel - pagination persistence", () => {
  const buildPagedData = (totalPages: number, number: number) => ({
    success: true,
    data: {
      content: [baseProduct],
      pageable: {
        pageNumber: number,
        pageSize: 20,
        sort: [],
        offset: number * 20,
        unpaged: false,
        paged: true,
      },
      totalElements: totalPages * 20,
      totalPages,
      number,
      size: 20,
      empty: false,
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    warehouseBatchesData = { success: true, data: [] };
    productImagesData = {};
    swrData = buildPagedData(5, 0);
  });

  it("exposes the requested page and size for the pagination controls", () => {
    const { result } = renderModel();

    act(() => {
      result.current.onPageChange(3);
    });

    expect(result.current.pagination.page).toBe(3);
    expect(result.current.filters.page).toBe(3);
  });

  it("returns to the first page when the page size changes", () => {
    const { result } = renderModel();

    act(() => {
      result.current.onPageChange(3);
      result.current.onPageSizeChange(50);
    });

    expect(result.current.filters.page).toBe(0);
    expect(result.current.filters.pageSize).toBe(50);
  });

  it("clamps a page that points past the last available page", async () => {
    swrData = buildPagedData(3, 0);
    const { result } = renderModel();

    act(() => {
      result.current.onPageChange(9);
    });

    await waitFor(() => {
      expect(result.current.pagination.page).toBe(2);
    });
  });
});

describe("findMostRecentBatch", () => {
  const batches: ProductBatchPriceSource[] = [
    { id: "b1", productId: "p1", sellingPrice: 100, costPrice: 50, createdAt: "2025-01-01T00:00:00Z" },
    { id: "b2", productId: "p1", sellingPrice: 200, costPrice: 80, createdAt: "2025-06-01T00:00:00Z" },
  ];

  it("returns the batch with the latest createdAt", () => {
    expect(findMostRecentBatch(batches)?.id).toBe("b2");
  });

  it("returns null for an empty list", () => {
    expect(findMostRecentBatch([])).toBeNull();
  });

  it("does not let an invalid first date poison selection of valid batches", () => {
    const withInvalidFirst: ProductBatchPriceSource[] = [
      { id: "bad", productId: "p1", sellingPrice: 100, costPrice: 50, createdAt: "not-a-date" },
      { id: "good", productId: "p1", sellingPrice: 200, costPrice: 80, createdAt: "2025-06-01T00:00:00Z" },
    ];
    expect(findMostRecentBatch(withInvalidFirst)?.id).toBe("good");
  });
});

describe("buildLatestBatchPrice", () => {
  it("builds price info from a batch", () => {
    const batch: ProductBatchPriceSource = {
      id: "b1",
      productId: "p1",
      sellingPrice: 2500,
      costPrice: 1800,
      createdAt: "2025-06-01T00:00:00Z",
    };
    expect(buildLatestBatchPrice(batch)).toMatchObject({
      batchId: "b1",
      sellingPriceCents: 2500,
    });
  });

  it("returns null when batch is null", () => {
    expect(buildLatestBatchPrice(null)).toBeNull();
  });
});

describe("buildLatestBatchPriceByProduct", () => {
  it("groups batches by product and keeps only the most recent per product", () => {
    const batches: ProductBatchPriceSource[] = [
      { id: "b1", productId: "p1", sellingPrice: 100, costPrice: 50, createdAt: "2025-01-01T00:00:00Z" },
      { id: "b2", productId: "p1", sellingPrice: 200, costPrice: 80, createdAt: "2025-06-01T00:00:00Z" },
      { id: "b3", productId: "p2", sellingPrice: 300, costPrice: 150, createdAt: "2025-03-01T00:00:00Z" },
    ];

    const map = buildLatestBatchPriceByProduct(batches);

    expect(map["p1"]?.batchId).toBe("b2");
    expect(map["p1"]?.sellingPriceCents).toBe(200);
    expect(map["p2"]?.batchId).toBe("b3");
  });

  it("returns an empty map for an empty batch list", () => {
    expect(buildLatestBatchPriceByProduct([])).toEqual({});
  });

  it("skips price-less batches so an earlier priced batch still wins", () => {
    const batches: ProductBatchPriceSource[] = [
      { id: "older", productId: "p1", sellingPrice: 1500, costPrice: 1000, createdAt: "2025-01-01T00:00:00Z" },
      { id: "newer", productId: "p1", sellingPrice: null, costPrice: null, createdAt: "2025-06-01T00:00:00Z" },
    ];

    const map = buildLatestBatchPriceByProduct(batches);

    expect(map["p1"]).toMatchObject({ batchId: "older", sellingPriceCents: 1500 });
  });

  it("returns null when a product has only price-less batches", () => {
    const batches: ProductBatchPriceSource[] = [
      { id: "b1", productId: "p1", sellingPrice: null, costPrice: null, createdAt: "2025-06-01T00:00:00Z" },
    ];

    expect(buildLatestBatchPriceByProduct(batches)["p1"]).toBeNull();
  });
});
