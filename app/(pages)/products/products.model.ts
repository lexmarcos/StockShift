import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useQueryState, parseAsString, parseAsInteger, parseAsStringLiteral } from "nuqs";
import useSWR, { mutate as mutateGlobal } from "swr";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { formatCentsToBRL } from "@/lib/currency";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import {
  Batch,
  LatestBatchPrice,
  PageRangeItem,
  Product,
  ProductBatchPriceSource,
  ProductImageResponse,
  ProductsResponse,
  ProductFilters,
  ProductFilterDraft,
  SortField,
  SortOrder,
  StockStatus,
  ActiveStatus,
  WarehouseBatchesResponse,
} from "./products.types";

interface BatchesResponse {
  success: boolean;
  data: Batch[];
}

const DEFAULT_PAGE_SIZE = 20;

// Query-string keys persisted in the URL via nuqs. All filter, search, and
// pagination state survives navigation and reloads.
const SEARCH_QUERY_PARAM = "q";
const PAGE_PARAM = "page";
const PAGE_SIZE_PARAM = "size";
const SORT_BY_PARAM = "sort";
const SORT_ORDER_PARAM = "order";
const STOCK_STATUS_PARAM = "stock";
const ACTIVE_STATUS_PARAM = "status";

const DEFAULT_DRAFT: ProductFilterDraft = {
  stockStatus: "all",
  activeStatus: "all",
  sortBy: "name",
  sortOrder: "asc",
};

export const findMostRecentBatch = (
  batches: readonly ProductBatchPriceSource[],
): ProductBatchPriceSource | null => {
  return batches.reduce<ProductBatchPriceSource | null>((latest, batch) => {
    if (!latest) return batch;
    const batchTime = new Date(batch.createdAt).getTime();
    const latestTime = new Date(latest.createdAt).getTime();
    if (!Number.isFinite(batchTime)) return latest;
    if (!Number.isFinite(latestTime)) return batch;
    return batchTime > latestTime ? batch : latest;
  }, null);
};

export const buildLatestBatchPrice = (
  batch: ProductBatchPriceSource | null,
): LatestBatchPrice | null => {
  if (!batch) return null;
  return {
    batchId: batch.id,
    sellingPriceCents: batch.sellingPrice,
    sellingPriceLabel: formatCentsToBRL(batch.sellingPrice, "Sem preço"),
  };
};

const groupBatchesByProduct = (
  batches: readonly ProductBatchPriceSource[],
): Map<string, ProductBatchPriceSource[]> =>
  batches.reduce<Map<string, ProductBatchPriceSource[]>>((groups, batch) => {
    const existing = groups.get(batch.productId) ?? [];
    existing.push(batch);
    groups.set(batch.productId, existing);
    return groups;
  }, new Map());

export const buildLatestBatchPriceByProduct = (
  batches: readonly ProductBatchPriceSource[],
): Record<string, LatestBatchPrice | null> => {
  const groups = groupBatchesByProduct(batches);
  const result: Record<string, LatestBatchPrice | null> = {};
  for (const [productId, productBatches] of groups) {
    // Ignore batches without a price so a newer price-less batch never hides
    // the known price of an earlier batch.
    const priced = productBatches.filter((batch) => batch.sellingPrice !== null);
    result[productId] = buildLatestBatchPrice(findMostRecentBatch(priced));
  }
  return result;
};

// Largest page count rendered without truncation. Below this every page gets
// its own button; above it the range collapses to first, last and a window
// around the current page, with ellipses marking the hidden gaps.
const MAX_FLAT_PAGES = 5;

const rangeInclusive = (start: number, end: number): number[] => {
  const result: number[] = [];
  for (let page = start; page <= end; page += 1) result.push(page);
  return result;
};

/**
 * Builds the page selector items for the pagination control. Pages are
 * 0-indexed to match the backend's pagination contract; the view renders them
 * as `page + 1`. Returns an empty list when there is nothing to paginate.
 */
export const buildPageRange = (
  currentPage: number,
  totalPages: number,
): PageRangeItem[] => {
  if (totalPages <= 1) return [];
  if (totalPages <= MAX_FLAT_PAGES) {
    return rangeInclusive(0, totalPages - 1).map((page) => ({
      kind: "page",
      page,
    }));
  }

  const firstPage = 0;
  const lastPage = totalPages - 1;
  const windowStart = Math.max(1, currentPage - 1);
  const windowEnd = Math.min(lastPage - 1, currentPage + 1);

  const items: PageRangeItem[] = [{ kind: "page", page: firstPage }];
  if (windowStart > firstPage + 1) items.push({ kind: "ellipsis" });
  for (const page of rangeInclusive(windowStart, windowEnd)) {
    items.push({ kind: "page", page });
  }
  if (windowEnd < lastPage - 1) items.push({ kind: "ellipsis" });
  items.push({ kind: "page", page: lastPage });
  return items;
};

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Scrolls the product listing anchor back into view. Called from
 * `onPageChange` so flipping pages lands the user on the new page's first
 * row instead of leaving them at the bottom controls. No-ops when the anchor
 * is missing (e.g. before the list mounts) or the host lacks scroll support.
 */
export const scrollListingToTop = (
  node: HTMLElement | null,
): void => {
  if (!node) return;
  if (typeof node.scrollIntoView !== "function") return;
  node.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "start",
  });
};

const buildFilterDraft = (filters: ProductFilters): ProductFilterDraft => ({
  stockStatus: filters.stockStatus,
  activeStatus: filters.activeStatus,
  sortBy: filters.sortBy,
  sortOrder: filters.sortOrder,
});

const filterByStockStatus = (product: Product, status: StockStatus) => {
  switch (status) {
    case "inStock":
      return product.totalQuantity >= 10;
    case "lowStock":
      return product.totalQuantity > 0 && product.totalQuantity < 10;
    case "outOfStock":
      return product.totalQuantity === 0;
    default:
      return true;
  }
};

const filterByActiveStatus = (product: Product, status: ActiveStatus) => {
  switch (status) {
    case "active":
      return product.active;
    case "inactive":
      return !product.active;
    default:
      return true;
  }
};

// The warehouse products list omits imageUrl, so each product's image is
// fetched on demand. Keying it as a "products/..." sub-resource lets the
// edit/create/delete flows invalidate it through their existing
// mutate((key) => key.includes("products")) call, so a changed image shows up
// on /products without a full reload. SWR also dedups and caches it per id.
export const productImageKey = (id: string): string => `products/${id}/image`;

export const fetchProductImageUrl = async (
  id: string,
): Promise<string | null> => {
  try {
    const response = await api
      .get(`products/${id}`)
      .json<ProductImageResponse>();
    return response.data.imageUrl ?? null;
  } catch {
    return null;
  }
};

// Resolves a product's thumbnail: prefer the URL already on the list row, else
// lazily fetch it. Each card owns one SWR subscription, deduped by product id.
export const useProductImageUrl = (product: Product): string | null => {
  const { data } = useSWR<string | null>(
    product.imageUrl ? null : productImageKey(product.id),
    () => fetchProductImageUrl(product.id),
    { revalidateOnFocus: false },
  );
  return product.imageUrl ?? data ?? null;
};

export const useProductsModel = () => {
  const { warehouseId } = useSelectedWarehouse();

  const [searchQuery, setSearchQuery] = useQueryState(
    SEARCH_QUERY_PARAM,
    parseAsString.withDefault("")
  );
  const [page, setPage] = useQueryState(
    PAGE_PARAM,
    parseAsInteger.withDefault(0)
  );
  const [pageSize, setPageSize] = useQueryState(
    PAGE_SIZE_PARAM,
    parseAsInteger.withDefault(DEFAULT_PAGE_SIZE)
  );
  const [sortBy, setSortBy] = useQueryState(
    SORT_BY_PARAM,
    parseAsStringLiteral(["name", "sku", "barcode", "active", "createdAt", "updatedAt"] as const).withDefault("name")
  );
  const [sortOrder, setSortOrder] = useQueryState(
    SORT_ORDER_PARAM,
    parseAsStringLiteral(["asc", "desc"] as const).withDefault("asc")
  );
  const [stockStatus, setStockStatus] = useQueryState(
    STOCK_STATUS_PARAM,
    parseAsStringLiteral(["all", "inStock", "lowStock", "outOfStock"] as const).withDefault("all")
  );
  const [activeStatus, setActiveStatus] = useQueryState(
    ACTIVE_STATUS_PARAM,
    parseAsStringLiteral(["all", "active", "inactive"] as const).withDefault("all")
  );

  const filters = useMemo<ProductFilters>(
    () => ({ searchQuery, sortBy, sortOrder, stockStatus, activeStatus, page, pageSize }),
    [searchQuery, sortBy, sortOrder, stockStatus, activeStatus, page, pageSize]
  );

  // Mirrors the original Dispatch<SetStateAction<ProductFilters>> contract,
  // routing all fields to the URL via nuqs.
  const setFilters = useCallback<Dispatch<SetStateAction<ProductFilters>>>(
    (update) => {
      const next = typeof update === "function" ? update(filters) : update;
      if (next.searchQuery !== searchQuery) setSearchQuery(next.searchQuery);
      if (next.page !== page) setPage(next.page);
      if (next.pageSize !== pageSize) setPageSize(next.pageSize);
      if (next.sortBy !== sortBy) setSortBy(next.sortBy);
      if (next.sortOrder !== sortOrder) setSortOrder(next.sortOrder);
      if (next.stockStatus !== stockStatus) setStockStatus(next.stockStatus);
      if (next.activeStatus !== activeStatus) setActiveStatus(next.activeStatus);
    },
    [filters, searchQuery, page, pageSize, sortBy, sortOrder, stockStatus, activeStatus, setSearchQuery, setPage, setPageSize, setSortBy, setSortOrder, setStockStatus, setActiveStatus]
  );

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [secondConfirmOpen, setSecondConfirmOpen] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [deleteBatches, setDeleteBatches] = useState<Batch[]>([]);
  const [isCheckingDeleteBatches, setIsCheckingDeleteBatches] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Mobile filter states
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [mobileFiltersDraft, setMobileFiltersDraft] =
    useState<ProductFilterDraft>(DEFAULT_DRAFT);

  // Anchor for the product listing. Scrolling it into view on page change
  // brings the user back to the top of the results so the new page's first
  // row is visible instead of leaving them parked at the bottom controls.
  const listingTopRef = useRef<HTMLDivElement | null>(null);

  // Set when a page change asks for a scroll-to-top, cleared once it runs.
  // The scroll is deferred (see effect below) instead of firing inline so the
  // smooth animation starts against the incoming page's final layout.
  const pendingPageScrollRef = useRef(false);

  // Build URL with query params
  const url = useMemo(() => {
    if (!warehouseId) return null;

    const params = new URLSearchParams();
    params.append("page", filters.page.toString());
    params.append("size", filters.pageSize.toString());
    params.append("sort", `${filters.sortBy},${filters.sortOrder}`);
    if (filters.searchQuery.trim()) {
      params.append("search", filters.searchQuery.trim());
    }

    return `warehouses/${warehouseId}/products?${params.toString()}`;
  }, [warehouseId, filters.page, filters.pageSize, filters.sortBy, filters.sortOrder, filters.searchQuery]);

  // Fetch products from warehouse
  const { data, error, isLoading, mutate } = useSWR<ProductsResponse>(
    url,
    async (url: string) => {
      try {
        return await api.get(url).json<ProductsResponse>();
      } catch (err) {
        console.error("Erro ao carregar produtos:", err);
        toast.error("Erro ao carregar produtos");
        throw err;
      }
    },
    { keepPreviousData: true, revalidateOnFocus: false }
  );

  // Fetch batches for the warehouse to derive the most recent batch selling
  // price per product. Used by the mobile product card.
  const warehouseBatchesUrl = warehouseId ? `batches/warehouse/${warehouseId}` : null;
  const { data: warehouseBatchesData } = useSWR<WarehouseBatchesResponse>(
    warehouseBatchesUrl,
    async (requestUrl: string) => {
      try {
        return await api.get(requestUrl).json<WarehouseBatchesResponse>();
      } catch (err) {
        console.error("Erro ao carregar lotes do armazém:", err);
        return { success: true, data: [] };
      }
    },
    { revalidateOnFocus: false }
  );

  // Client-side filtering for stock status and active status
  const products = useMemo(() => data?.data.content ?? [], [data]);

  const latestBatchPriceByProduct = useMemo(
    () => buildLatestBatchPriceByProduct(warehouseBatchesData?.data ?? []),
    [warehouseBatchesData]
  );

  // Each mobile card lazily fetches its own image via useProductImageUrl, so the
  // list only filters here; missing thumbnails are resolved per row.
  const filteredProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          filterByStockStatus(p, filters.stockStatus) &&
          filterByActiveStatus(p, filters.activeStatus)
      ),
    [products, filters.stockStatus, filters.activeStatus]
  );

  // The requested page/size (persisted in the URL) are the source of truth for
  // the controls, so they update instantly and survive reloads; totals come
  // from the server response.
  const totalPages = data?.data?.totalPages ?? 0;
  const pagination = {
    page,
    pageSize,
    totalPages,
    totalElements: data?.data?.totalElements ?? 0,
  };

  // Page selector tokens (page buttons + ellipses) for the pagination control.
  // Derived here so the view stays a pure render of pagination state.
  const pageRange = useMemo(
    () => buildPageRange(page, totalPages),
    [page, totalPages],
  );

  // Keep the persisted page within the available range. A page restored from
  // the URL (or left over after the result set shrank) can point past the last
  // page, which makes the API return an empty/out-of-range result on every
  // retry — clamp it down instead of looping on a page that no longer exists.
  useEffect(() => {
    if (page < 0) {
      setPage(0);
      return;
    }
    const totalPages = data?.data?.totalPages ?? 0;
    if (!isLoading && totalPages > 0 && page > totalPages - 1) {
      setPage(totalPages - 1);
    }
  }, [page, data, isLoading, setPage]);

  // Runs the deferred page-change scroll once the requested page's rows have
  // rendered (server echoes the page in `data.data.number`). Scrolling inline
  // from onPageChange instead starts a smooth scroll against the outgoing
  // page's layout, which the browser cancels the moment the new — often
  // shorter, e.g. the last — page loads and reflows, leaving the first and
  // last pages parked at the bottom controls.
  useEffect(() => {
    if (!pendingPageScrollRef.current) return;
    if (data?.data?.number !== page) return;
    pendingPageScrollRef.current = false;
    scrollListingToTop(listingTopRef.current);
  }, [data, page]);

  const onPageChange = (nextPage: number) => {
    if (nextPage === page) return;
    pendingPageScrollRef.current = true;
    setPage(nextPage);
  };

  const onPageSizeChange = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPage(0);
  };

  const onSearchChange = (nextSearch: string) => {
    setSearchQuery(nextSearch);
    setPage(0);
  };

  const onSortChange = (nextSortBy: SortField, nextSortOrder: SortOrder) => {
    setSortBy(nextSortBy);
    setSortOrder(nextSortOrder);
    setPage(0);
  };

  const onOutOfStockKpiClick = () => {
    setStockStatus("outOfStock");
    setPage(0);
  };

  // Mobile filter handlers
  const onOpenMobileFilters = () => {
    setMobileFiltersDraft(buildFilterDraft(filters));
    setIsMobileFiltersOpen(true);
  };

  const onMobileFiltersOpenChange = (open: boolean) => {
    if (open) {
      onOpenMobileFilters();
      return;
    }
    setIsMobileFiltersOpen(false);
  };

  const onApplyMobileFilters = () => {
    setSortBy(mobileFiltersDraft.sortBy);
    setSortOrder(mobileFiltersDraft.sortOrder);
    setStockStatus(mobileFiltersDraft.stockStatus);
    setActiveStatus(mobileFiltersDraft.activeStatus);
    setPage(0);
    setIsMobileFiltersOpen(false);
  };

  const onClearFilters = () => {
    setSearchQuery("");
    setPage(0);
    setPageSize(DEFAULT_PAGE_SIZE);
    setSortBy("name");
    setSortOrder("asc");
    setStockStatus("all");
    setActiveStatus("all");
  };

  const onClearMobileFilters = () => {
    setSearchQuery("");
    setPage(0);
    setPageSize(DEFAULT_PAGE_SIZE);
    setSortBy("name");
    setSortOrder("asc");
    setStockStatus("all");
    setActiveStatus("all");
    setMobileFiltersDraft(DEFAULT_DRAFT);
  };

  const onMobileFilterDraftChange = (patch: Partial<ProductFilterDraft>) => {
    setMobileFiltersDraft((prev) => ({ ...prev, ...patch }));
  };

  const buildEditUrl = useCallback((productId: string): string => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (page !== 0) params.set("page", page.toString());
    if (pageSize !== DEFAULT_PAGE_SIZE) params.set("size", pageSize.toString());
    if (sortBy !== "name") params.set("sort", sortBy);
    if (sortOrder !== "asc") params.set("order", sortOrder);
    if (stockStatus !== "all") params.set("stock", stockStatus);
    if (activeStatus !== "all") params.set("status", activeStatus);
    const returnTo = params.size > 0 ? `/products?${params.toString()}` : "/products";
    return `/products/${productId}/edit?returnTo=${encodeURIComponent(returnTo)}`;
  }, [searchQuery, page, pageSize, sortBy, sortOrder, stockStatus, activeStatus]);

  const onOpenDeleteDialog = async (product: Product) => {
    setDeleteProduct(product);
    setDeleteDialogOpen(true);
    setDeleteBatches([]);

    if (!warehouseId) return;

    setIsCheckingDeleteBatches(true);
    try {
      const batchesEndpoint =
        `batches/warehouses/${warehouseId}/products/${product.id}/batches`;
      const response = await api
        .get(batchesEndpoint)
        .json<BatchesResponse>();

      if (response.success) {
        const filtered = response.data.filter(
          (batch) => batch.quantity > 0
        );
        setDeleteBatches(filtered);
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage =
        error?.response?.data?.message || "Erro ao verificar estoque do produto";
      toast.error(errorMessage);
    } finally {
      setIsCheckingDeleteBatches(false);
    }
  };

  const onCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSecondConfirmOpen(false);
    setDeleteProduct(null);
    setDeleteBatches([]);
    setIsCheckingDeleteBatches(false);
  };

  const onCloseSecondConfirm = () => {
    onCloseDeleteDialog();
  };

  const executeDelete = async () => {
    if (!deleteProduct || !warehouseId) return;

    setIsDeletingProduct(true);
    try {
      const deleteBatchesEndpoint =
        `batches/warehouses/${warehouseId}/products/${deleteProduct.id}/batches`;
      await api.delete(deleteBatchesEndpoint).json();

      toast.success("Produto removido do estoque com sucesso");
      mutate();
      mutateGlobal((key) =>
        typeof key === "string" &&
        (key.includes("products") || key.includes("batches"))
      );
      onCloseDeleteDialog();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage =
        error?.response?.data?.message || "Erro ao remover produto do armazém";
      toast.error(errorMessage);
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!deleteProduct) return;

    if (deleteBatches.length > 0) {
      setDeleteDialogOpen(false);
      setSecondConfirmOpen(true);
      return;
    }

    await executeDelete();
  };

  const onSecondConfirmDelete = async () => {
    await executeDelete();
  };

  return {
    products,
    filteredProducts,
    latestBatchPriceByProduct,
    isLoading,
    error: error || null,
    requiresWarehouse: !warehouseId,
    filters,
    setFilters,
    buildEditUrl,
    pagination,
    pageRange,
    isMobileFiltersOpen,
    mobileFiltersDraft,
    listingTopRef,
    onPageChange,
    onPageSizeChange,
    onSearchChange,
    onSortChange,
    onOutOfStockKpiClick,
    onMobileFiltersOpenChange,
    onOpenMobileFilters,
    onApplyMobileFilters,
    onClearFilters,
    onClearMobileFilters,
    onMobileFilterDraftChange,
    onOpenDeleteDialog,
    onConfirmDelete,
    onSecondConfirmDelete,
    onCloseDeleteDialog,
    onCloseSecondConfirm,
    deleteDialogOpen,
    secondConfirmOpen,
    deleteProduct,
    deleteBatches,
    isCheckingDeleteBatches,
    isDeletingProduct,
  };
};
