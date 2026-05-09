import { useMemo, useState } from "react";
import useSWR, { mutate as mutateGlobal } from "swr";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import {
  Batch,
  Product,
  ProductsResponse,
  ProductFilters,
  ProductFilterDraft,
  SortField,
  SortOrder,
  StockStatus,
  ActiveStatus,
} from "./products.types";

interface BatchesResponse {
  success: boolean;
  data: Batch[];
}

const DEFAULT_FILTERS: Omit<ProductFilters, "searchQuery"> = {
  sortBy: "name",
  sortOrder: "asc",
  stockStatus: "all",
  activeStatus: "all",
  page: 0,
  pageSize: 20,
};

const DEFAULT_DRAFT: ProductFilterDraft = {
  stockStatus: "all",
  activeStatus: "all",
  sortBy: "name",
  sortOrder: "asc",
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

export const useProductsModel = () => {
  const { warehouseId } = useSelectedWarehouse();

  const [filters, setFilters] = useState<ProductFilters>({
    searchQuery: "",
    ...DEFAULT_FILTERS,
  });
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

  // Client-side filtering for stock status and active status
  const products = useMemo(() => data?.data.content ?? [], [data]);

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          filterByStockStatus(p, filters.stockStatus) &&
          filterByActiveStatus(p, filters.activeStatus)
      ),
    [products, filters.stockStatus, filters.activeStatus]
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
    setFilters((prev) => ({ ...prev, page }));
  };

  const onPageSizeChange = (pageSize: number) => {
    setFilters((prev) => ({ ...prev, pageSize, page: 0 }));
  };

  const onSearchChange = (searchQuery: string) => {
    setFilters((prev) => ({ ...prev, searchQuery, page: 0 }));
  };

  const onSortChange = (sortBy: SortField, sortOrder: SortOrder) => {
    setFilters((prev) => ({ ...prev, sortBy, sortOrder, page: 0 }));
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
    setFilters((prev) => ({
      ...prev,
      stockStatus: mobileFiltersDraft.stockStatus,
      activeStatus: mobileFiltersDraft.activeStatus,
      sortBy: mobileFiltersDraft.sortBy,
      sortOrder: mobileFiltersDraft.sortOrder,
    }));
    setIsMobileFiltersOpen(false);
  };

  const onClearFilters = () => {
    setFilters((prev) => ({
      ...prev,
      searchQuery: "",
      ...DEFAULT_FILTERS,
    }));
  };

  const onClearMobileFilters = () => {
    const nextFilters = {
      searchQuery: "",
      ...DEFAULT_FILTERS,
    };
    setFilters(nextFilters);
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
      const response = await api
        .get(`batches/product/${product.id}`)
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
      await api.delete(`products/${deleteProduct.id}`).json();

      toast.success("Produto excluído com sucesso");
      mutate();
      mutateGlobal((key) =>
        typeof key === "string" &&
        (key.includes("products") || key.includes("batches"))
      );
      onCloseDeleteDialog();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage =
        error?.response?.data?.message || "Erro ao excluir produto";
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
