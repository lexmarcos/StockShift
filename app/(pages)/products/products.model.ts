import { useCallback, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useQueryState, parseAsString } from "nuqs";
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

type TableFilters = Omit<ProductFilters, "searchQuery">;

const DEFAULT_FILTERS: TableFilters = {
  sortBy: "name",
  sortOrder: "asc",
  stockStatus: "all",
  activeStatus: "all",
  page: 0,
  pageSize: 20,
};

// Key for the search query persisted in the URL via nuqs, so it survives
// navigating into a product detail and coming back.
const SEARCH_QUERY_PARAM = "q";

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

const fetchProductImage = async (
  id: string,
): Promise<{ id: string; imageUrl: string | null }> => {
  try {
    const response = await api
      .get(`products/${id}`)
      .json<ProductImageResponse>();
    return { id, imageUrl: response.data.imageUrl ?? null };
  } catch {
    return { id, imageUrl: null };
  }
};

const fetchProductImages = async (
  productIds: string[],
): Promise<Record<string, string | null>> => {
  const results = await Promise.all(productIds.map(fetchProductImage));
  return Object.fromEntries(results.map((result) => [result.id, result.imageUrl]));
};

const buildProductImagesKey = (
  products: readonly Product[],
): string | null => {
  const ids = products
    .filter((product) => !product.imageUrl)
    .map((product) => product.id)
    .sort();
  if (ids.length === 0) return null;
  return `product-images-${ids.join(",")}`;
};

const parseProductImageIds = (key: string): string[] =>
  key.replace("product-images-", "").split(",");

const mergeProductImages = (
  products: Product[],
  images: Record<string, string | null> | undefined,
): Product[] => {
  if (!images) return products;
  return products.map((product) => ({
    ...product,
    imageUrl: product.imageUrl ?? images[product.id] ?? null,
  }));
};

export const useProductsModel = () => {
  const { warehouseId } = useSelectedWarehouse();

  const [searchQuery, setSearchQuery] = useQueryState(
    SEARCH_QUERY_PARAM,
    parseAsString.withDefault("")
  );
  const [tableFilters, setTableFilters] =
    useState<TableFilters>(DEFAULT_FILTERS);

  const filters = useMemo<ProductFilters>(
    () => ({ ...tableFilters, searchQuery }),
    [tableFilters, searchQuery]
  );

  // Mirrors the original Dispatch<SetStateAction<ProductFilters>> contract,
  // routing searchQuery to the URL and the remaining filters to local state.
  const setFilters = useCallback<Dispatch<SetStateAction<ProductFilters>>>(
    (update) => {
      const next = typeof update === "function" ? update(filters) : update;
      const { searchQuery: nextSearch, ...rest } = next;
      if (nextSearch !== searchQuery) setSearchQuery(nextSearch);
      setTableFilters(rest);
    },
    [filters, searchQuery, setSearchQuery]
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
    }
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

  // The warehouse products list may not return imageUrl. Fetch missing
  // images individually so the mobile card can show the product photo.
  const productImagesKey = useMemo(
    () => buildProductImagesKey(products),
    [products]
  );
  const { data: productImagesData } = useSWR<Record<string, string | null>>(
    productImagesKey,
    async (key: string) => fetchProductImages(parseProductImageIds(key)),
    { revalidateOnFocus: false }
  );

  const productsWithImages = useMemo(
    () => mergeProductImages(products, productImagesData),
    [products, productImagesData]
  );

  const latestBatchPriceByProduct = useMemo(
    () => buildLatestBatchPriceByProduct(warehouseBatchesData?.data ?? []),
    [warehouseBatchesData]
  );

  const filteredProducts = useMemo(
    () =>
      productsWithImages.filter(
        (p) =>
          filterByStockStatus(p, filters.stockStatus) &&
          filterByActiveStatus(p, filters.activeStatus)
      ),
    [productsWithImages, filters.stockStatus, filters.activeStatus]
  );

  const pagination = data?.data
    ? {
        page: data.data.number,
        pageSize: data.data.size,
        totalPages: data.data.totalPages,
        totalElements: data.data.totalElements,
      }
    : {
        page: 0,
        pageSize: 20,
        totalPages: 0,
        totalElements: 0,
      };

  const onPageChange = (page: number) => {
    setTableFilters((prev) => ({ ...prev, page }));
  };

  const onPageSizeChange = (pageSize: number) => {
    setTableFilters((prev) => ({ ...prev, pageSize, page: 0 }));
  };

  const onSearchChange = (nextSearch: string) => {
    setSearchQuery(nextSearch);
    setTableFilters((prev) => ({ ...prev, page: 0 }));
  };

  const onSortChange = (sortBy: SortField, sortOrder: SortOrder) => {
    setTableFilters((prev) => ({ ...prev, sortBy, sortOrder, page: 0 }));
  };

  const onOutOfStockKpiClick = () => {
    setTableFilters((prev) => ({
      ...prev,
      stockStatus: "outOfStock",
      page: 0,
    }));
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
    setTableFilters((prev) => ({
      ...prev,
      stockStatus: mobileFiltersDraft.stockStatus,
      activeStatus: mobileFiltersDraft.activeStatus,
      sortBy: mobileFiltersDraft.sortBy,
      sortOrder: mobileFiltersDraft.sortOrder,
    }));
    setIsMobileFiltersOpen(false);
  };

  const onClearFilters = () => {
    setSearchQuery("");
    setTableFilters(DEFAULT_FILTERS);
  };

  const onClearMobileFilters = () => {
    setSearchQuery("");
    setTableFilters(DEFAULT_FILTERS);
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
