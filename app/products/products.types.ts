export interface Brand {
  id: string;
  name: string;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  barcodeType: string | null;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  brand: Brand | null;
  isKit: boolean;
  attributes: Record<string, unknown>;
  hasExpiration: boolean;
  active: boolean;
  totalQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsPageable {
  pageNumber: number;
  pageSize: number;
  sort: string[];
  offset: number;
  unpaged: boolean;
  paged: boolean;
}

export interface ProductsResponse {
  success: boolean;
  data: {
    content: Product[];
    pageable: ProductsPageable;
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    empty: boolean;
  };
}

export type SortField = "name" | "sku" | "barcode" | "active" | "createdAt" | "updatedAt";
export type SortOrder = "asc" | "desc";

export interface ProductFilters {
  searchQuery: string;
  sortBy: SortField;
  sortOrder: SortOrder;
  page: number;
  pageSize: number;
}

export interface ProductsViewProps {
  products: Product[];
  isLoading: boolean;
  error: Error | null;
  requiresWarehouse: boolean;
  filters: ProductFilters;
  setFilters: (filters: ProductFilters) => void;
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalElements: number;
  };
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSearchChange: (search: string) => void;
  onSortChange: (sortBy: SortField, sortOrder: SortOrder) => void;
}
