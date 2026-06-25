import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import {
  buildLatestBatchPrice,
  buildLatestBatchPriceByProduct,
  buildPageRange,
  fetchProductImageUrl,
  findMostRecentBatch,
  productImageKey,
  scrollListingToTop,
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

const resolveSwrData = (key: unknown) => {
  if (typeof key === "string" && key.startsWith("batches/warehouse/")) {
    return warehouseBatchesData;
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

});

describe("product image fetching", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keys the image as a products sub-resource so edit invalidation reaches it", () => {
    const key = productImageKey("prod-1");
    expect(key).toBe("products/prod-1/image");
    expect(key.includes("products")).toBe(true);
  });

  it("returns the fetched imageUrl for a product", async () => {
    mockGet.mockReturnValue({
      json: vi.fn(async () => ({
        data: { imageUrl: "https://example.com/prod-1.png" },
      })),
    });

    await expect(fetchProductImageUrl("prod-1")).resolves.toBe(
      "https://example.com/prod-1.png"
    );
    expect(mockGet).toHaveBeenCalledWith("products/prod-1");
  });

  it("prefers the sm thumbnail over the original imageUrl", async () => {
    mockGet.mockReturnValue({
      json: vi.fn(async () => ({
        data: {
          imageUrl: "https://example.com/prod-1.png",
          thumbnails: {
            sm: "https://example.com/prod-1_sm.jpg",
            md: "https://example.com/prod-1_md.jpg",
          },
        },
      })),
    });

    await expect(fetchProductImageUrl("prod-1")).resolves.toBe(
      "https://example.com/prod-1_sm.jpg"
    );
  });

  it("returns null when the product has no image", async () => {
    mockGet.mockReturnValue({
      json: vi.fn(async () => ({ data: { imageUrl: null } })),
    });

    await expect(fetchProductImageUrl("prod-1")).resolves.toBeNull();
  });

  it("returns null instead of throwing when the request fails", async () => {
    mockGet.mockImplementationOnce(() => {
      throw new Error("network down");
    });

    await expect(fetchProductImageUrl("prod-1")).resolves.toBeNull();
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

  it("scrolls the listing to the top once the requested page's data renders", async () => {
    // The server echoes page 3, so the deferred scroll should fire after the
    // page state catches up to it. Regression for the first/last page never
    // scrolling because the inline scroll was cancelled by the data reflow.
    swrData = buildPagedData(5, 3);
    const scrollIntoView = vi.fn();
    const { result } = renderModel();
    result.current.listingTopRef.current = {
      scrollIntoView,
    } as unknown as HTMLDivElement;

    act(() => {
      result.current.onPageChange(3);
    });

    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "start",
      });
    });
  });

  it("does not scroll when the rendered page does not match the request yet", () => {
    // Data still reports page 0 while the request targets page 4: the scroll
    // must wait instead of yanking the user to the top of the stale rows.
    swrData = buildPagedData(5, 0);
    const scrollIntoView = vi.fn();
    const { result } = renderModel();
    result.current.listingTopRef.current = {
      scrollIntoView,
    } as unknown as HTMLDivElement;

    act(() => {
      result.current.onPageChange(4);
    });

    expect(scrollIntoView).not.toHaveBeenCalled();
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

describe("buildPageRange", () => {
  it("returns nothing when there is a single page or none", () => {
    expect(buildPageRange(0, 0)).toEqual([]);
    expect(buildPageRange(0, 1)).toEqual([]);
  });

  it("lists every page when the page count fits the flat threshold", () => {
    expect(buildPageRange(0, 5)).toEqual([
      { kind: "page", page: 0 },
      { kind: "page", page: 1 },
      { kind: "page", page: 2 },
      { kind: "page", page: 3 },
      { kind: "page", page: 4 },
    ]);
  });

  it("collapses to first, last and a 3-page window once past the flat threshold", () => {
    expect(buildPageRange(3, 7)).toEqual([
      { kind: "page", page: 0 },
      { kind: "ellipsis" },
      { kind: "page", page: 2 },
      { kind: "page", page: 3 },
      { kind: "page", page: 4 },
      { kind: "ellipsis" },
      { kind: "page", page: 6 },
    ]);
  });

  it("matches the design: page 2 of 12 renders 1 2 3 … 12", () => {
    expect(buildPageRange(1, 12)).toEqual([
      { kind: "page", page: 0 },
      { kind: "page", page: 1 },
      { kind: "page", page: 2 },
      { kind: "ellipsis" },
      { kind: "page", page: 11 },
    ]);
  });

  it("keeps first, last and a window around the current page with ellipses", () => {
    expect(buildPageRange(4, 10)).toEqual([
      { kind: "page", page: 0 },
      { kind: "ellipsis" },
      { kind: "page", page: 3 },
      { kind: "page", page: 4 },
      { kind: "page", page: 5 },
      { kind: "ellipsis" },
      { kind: "page", page: 9 },
    ]);
  });

  it("drops the leading ellipsis when the current page is near the start", () => {
    expect(buildPageRange(0, 10)).toEqual([
      { kind: "page", page: 0 },
      { kind: "page", page: 1 },
      { kind: "ellipsis" },
      { kind: "page", page: 9 },
    ]);
  });

  it("drops the trailing ellipsis when the current page is near the end", () => {
    expect(buildPageRange(9, 10)).toEqual([
      { kind: "page", page: 0 },
      { kind: "ellipsis" },
      { kind: "page", page: 8 },
      { kind: "page", page: 9 },
    ]);
  });

  it("clamps the window so it never reaches beyond the first or last page", () => {
    expect(buildPageRange(1, 8)).toEqual([
      { kind: "page", page: 0 },
      { kind: "page", page: 1 },
      { kind: "page", page: 2 },
      { kind: "ellipsis" },
      { kind: "page", page: 7 },
    ]);
    expect(buildPageRange(6, 8)).toEqual([
      { kind: "page", page: 0 },
      { kind: "ellipsis" },
      { kind: "page", page: 5 },
      { kind: "page", page: 6 },
      { kind: "page", page: 7 },
    ]);
  });
});

describe("scrollListingToTop", () => {
  it("calls scrollIntoView on the given node", () => {
    const scrollIntoView = vi.fn();
    const node = { scrollIntoView } as unknown as HTMLElement;

    scrollListingToTop(node);

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });

  it("no-ops when there is no anchor node", () => {
    expect(() => scrollListingToTop(null)).not.toThrow();
  });

  it("no-ops when the host does not implement scrollIntoView", () => {
    expect(() =>
      scrollListingToTop({} as unknown as HTMLElement),
    ).not.toThrow();
  });
});
