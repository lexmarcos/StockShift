import { useState, useMemo } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import { ProductsResponse, ProductFilters, SortField, SortOrder } from "./products.types";

export const useProductsModel = () => {
  const { warehouseId } = useSelectedWarehouse();

  const [filters, setFilters] = useState<ProductFilters>({
    searchQuery: "",
    sortBy: "name",
    sortOrder: "asc",
    page: 0,
    pageSize: 20,
  });

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
  const { data, error, isLoading } = useSWR<ProductsResponse>(
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
  };
};
