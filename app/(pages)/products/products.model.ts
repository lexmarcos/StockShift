import { useState, useMemo } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import {
  Batch,
  Product,
  ProductsResponse,
  ProductFilters,
  SortField,
  SortOrder,
} from "./products.types";

interface BatchesResponse {
  success: boolean;
  data: Batch[];
}

interface DeleteBatchesResponse {
  message: string;
  deletedCount: number;
  productId: string;
  warehouseId: string;
}

export const useProductsModel = () => {
  const { warehouseId } = useSelectedWarehouse();

  const [filters, setFilters] = useState<ProductFilters>({
    searchQuery: "",
    sortBy: "name",
    sortOrder: "asc",
    page: 0,
    pageSize: 20,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [secondConfirmOpen, setSecondConfirmOpen] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [deleteBatches, setDeleteBatches] = useState<Batch[]>([]);
  const [isCheckingDeleteBatches, setIsCheckingDeleteBatches] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Build URL with query params
  const url = useMemo(() => {
    if (!warehouseId) return null;

    const params = new URLSearchParams();
    params.append("page", filters.page.toString());
    params.append("size", filters.pageSize.toString());
    params.append("sort", `${filters.sortBy},${filters.sortOrder}`);

    return `warehouses/${warehouseId}/products?${params.toString()}`;
  }, [warehouseId, filters.page, filters.pageSize, filters.sortBy, filters.sortOrder]);

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

  const products = data?.data.content || [];
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

  // Filter products by search query (client-side for better UX)
  const filteredProducts = useMemo(() => {
    if (!filters.searchQuery.trim()) return products;

    const query = filters.searchQuery.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query) ||
        product.barcode?.toLowerCase().includes(query)
    );
  }, [products, filters.searchQuery]);

  const onPageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const onPageSizeChange = (pageSize: number) => {
    setFilters((prev) => ({ ...prev, pageSize, page: 0 }));
  };

  const onSearchChange = (searchQuery: string) => {
    setFilters((prev) => ({ ...prev, searchQuery }));
  };

  const onSortChange = (sortBy: SortField, sortOrder: SortOrder) => {
    setFilters((prev) => ({ ...prev, sortBy, sortOrder, page: 0 }));
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
          (batch) => batch.warehouseId === warehouseId && batch.quantity > 0
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
      const response = await api
        .delete(`batches/warehouses/${warehouseId}/products/${deleteProduct.id}/batches`)
        .json<DeleteBatchesResponse>();

      toast.success(response.message || "Produto removido do armazém com sucesso");
      mutate();
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
    products: filteredProducts,
    isLoading,
    error: error || null,
    requiresWarehouse: !warehouseId,
    filters,
    setFilters,
    pagination,
    onPageChange,
    onPageSizeChange,
    onSearchChange,
    onSortChange,
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
