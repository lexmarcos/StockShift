export type StockMovementType =
  | "USAGE"
  | "GIFT"
  | "LOSS"
  | "DAMAGE"
  | "ADJUSTMENT_OUT"
  | "PURCHASE_IN"
  | "ADJUSTMENT_IN"
  | "TRANSFER_IN"
  | "TRANSFER_OUT";

export type StockMovementDirection = "IN" | "OUT";

export interface StockMovementItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string | null;
  batchId: string;
  batchCode: string;
  quantity: number;
}

export interface StockMovement {
  id: string;
  code: string;
  warehouseId: string;
  warehouseName: string;
  type: StockMovementType;
  direction: StockMovementDirection;
  notes: string | null;
  createdByUserId: string;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
  updatedAt: string;
  items: StockMovementItem[];
}

export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: string[];
  offset: number;
  unpaged: boolean;
  paged: boolean;
}

export interface StockMovementsResponse {
  success: boolean;
  message: string;
  data: {
    content: StockMovement[];
    pageable: Pageable;
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    empty: boolean;
  };
}

export type SortField = "createdAt" | "type" | "code" | "direction";
export type SortOrder = "asc" | "desc";

export interface StockMovementFilters {
  type?: StockMovementType | "ALL";
  dateFrom?: string;
  dateTo?: string;
  sortBy: SortField;
  sortOrder: SortOrder;
  page: number;
  pageSize: number;
}

export interface StockMovementsViewProps {
  movements: StockMovement[];
  isLoading: boolean;
  error: Error | null;
  filters: StockMovementFilters;
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalElements: number;
  };
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onFilterChange: (key: keyof StockMovementFilters, value: any) => void;
  onSortChange: (sortBy: SortField, sortOrder: SortOrder) => void;
}
