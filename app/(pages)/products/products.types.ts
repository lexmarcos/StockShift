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

export interface Batch {
  id: string;
  productId: string;
  productName: string;
  warehouseId: string;
  quantity: number;
  batchNumber: string;
  expirationDate: string | null;
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
export type StockStatus = "all" | "inStock" | "lowStock" | "outOfStock";
export type ActiveStatus = "all" | "active" | "inactive";

export interface ProductFilters {
  searchQuery: string;
  sortBy: SortField;
  sortOrder: SortOrder;
  stockStatus: StockStatus;
  activeStatus: ActiveStatus;
  page: number;
  pageSize: number;
}

export interface ProductFilterDraft {
  stockStatus: StockStatus;
  activeStatus: ActiveStatus;
  sortBy: SortField;
  sortOrder: SortOrder;
}

export interface ProductsViewProps {
  products: Product[];
  filteredProducts: Product[];
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
  isMobileFiltersOpen: boolean;
  mobileFiltersDraft: ProductFilterDraft;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSearchChange: (search: string) => void;
  onSortChange: (sortBy: SortField, sortOrder: SortOrder) => void;
  onMobileFiltersOpenChange: (open: boolean) => void;
  onOpenMobileFilters: () => void;
  onApplyMobileFilters: () => void;
  onClearFilters: () => void;
  onClearMobileFilters: () => void;
  onMobileFilterDraftChange: (patch: Partial<ProductFilterDraft>) => void;
  onOpenDeleteDialog: (product: Product) => void;
  onConfirmDelete: () => void;
  onSecondConfirmDelete: () => void;
  onCloseDeleteDialog: () => void;
  onCloseSecondConfirm: () => void;
  deleteDialogOpen: boolean;
  secondConfirmOpen: boolean;
  deleteProduct: Product | null;
  deleteBatches: Batch[];
  isCheckingDeleteBatches: boolean;
  isDeletingProduct: boolean;
}
