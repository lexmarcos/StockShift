import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useQueryState, parseAsString, parseAsInteger } from "nuqs";
import useSWR, { mutate as mutateGlobal } from "swr";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { formatCentsToBRL } from "@/lib/currency";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import {
  Batch,
  LatestBatchPrice,
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

type LocalTableFilters = Pick<
  ProductFilters,
  "sortBy" | "sortOrder" | "stockStatus" | "activeStatus"
>;

const DEFAULT_LOCAL_FILTERS: LocalTableFilters = {
  sortBy: "name",
  sortOrder: "asc",
  stockStatus: "all",
  activeStatus: "all",
};

const DEFAULT_PAGE_SIZE = 20;

// Query-string keys persisted in the URL via nuqs, so the search, current page
// and page size survive navigating into a product detail (or reloading) and
// coming back. Page/size mirror the backend's 0-indexed pagination.
const SEARCH_QUERY_PARAM = "q";
const PAGE_PARAM = "page";
const PAGE_SIZE_PARAM = "size";

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
  const [localFilters, setLocalFilters] =
    useState<LocalTableFilters>(DEFAULT_LOCAL_FILTERS);

  const filters = useMemo<ProductFilters>(
    () => ({ ...localFilters, searchQuery, page, pageSize }),
    [localFilters, searchQuery, page, pageSize]
  );

  // Mirrors the original Dispatch<SetStateAction<ProductFilters>> contract,
  // routing searchQuery/page/pageSize to the URL and the rest to local state.
  const setFilters = useCallback<Dispatch<SetStateAction<ProductFilters>>>(
    (update) => {
      const next = typeof update === "function" ? update(filters) : update;
      if (next.searchQuery !== searchQuery) setSearchQuery(next.searchQuery);
      if (next.page !== page) setPage(next.page);
      if (next.pageSize !== pageSize) setPageSize(next.pageSize);
      setLocalFilters({
        sortBy: next.sortBy,
        sortOrder: next.sortOrder,
        stockStatus: next.stockStatus,
        activeStatus: next.activeStatus,
      });
    },
    [filters, searchQuery, page, pageSize, setSearchQuery, setPage, setPageSize]
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
  const pagination = {
    page,
    pageSize,
    totalPages: data?.data?.totalPages ?? 0,
    totalElements: data?.data?.totalElements ?? 0,
  };

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

  const onPageChange = (nextPage: number) => {
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

  const onSortChange = (sortBy: SortField, sortOrder: SortOrder) => {
    setLocalFilters((prev) => ({ ...prev, sortBy, sortOrder }));
    setPage(0);
  };

  const onOutOfStockKpiClick = () => {
    setLocalFilters((prev) => ({ ...prev, stockStatus: "outOfStock" }));
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
    setLocalFilters((prev) => ({
      ...prev,
      stockStatus: mobileFiltersDraft.stockStatus,
      activeStatus: mobileFiltersDraft.activeStatus,
      sortBy: mobileFiltersDraft.sortBy,
      sortOrder: mobileFiltersDraft.sortOrder,
    }));
    setPage(0);
    setIsMobileFiltersOpen(false);
  };

  const onClearFilters = () => {
    setSearchQuery("");
    setPage(0);
    setPageSize(DEFAULT_PAGE_SIZE);
    setLocalFilters(DEFAULT_LOCAL_FILTERS);
  };

  const onClearMobileFilters = () => {
    setSearchQuery("");
    setPage(0);
    setPageSize(DEFAULT_PAGE_SIZE);
    setLocalFilters(DEFAULT_LOCAL_FILTERS);
    setMobileFiltersDraft(DEFAULT_DRAFT);
  };

  const onMobileFilterDraftChange = (patch: Partial<ProductFilterDraft>) => {
    setMobileFiltersDraft((prev) => ({ ...prev, ...patch }));
  };

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
    pagination,
    isMobileFiltersOpen,
    mobileFiltersDraft,
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
