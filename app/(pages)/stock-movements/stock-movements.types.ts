export type StockMovementType =
  | "USAGE"
  | "SALE"
  | "GIFT"
  | "LOSS"
  | "DAMAGE"
  | "ADJUSTMENT_OUT"
  | "PURCHASE_IN"
  | "ADJUSTMENT_IN"
  | "TRANSFER_IN"
  | "TRANSFER_OUT";

type StockMovementDirection = "IN" | "OUT";

export interface StockMovementItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string | null;
  batchId: string;
  batchCode: string;
  quantity: number;
  productImageUrl?: string | null;
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

interface Pageable {
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
export type DateFilterPreset =
  | "ALL"
  | "TODAY"
  | "LAST_7_DAYS"
  | "THIS_MONTH"
  | "CUSTOM";

export interface StockMovementFilters {
  type?: StockMovementType | "ALL";
  dateFrom?: string;
  dateTo?: string;
  datePreset: DateFilterPreset;
  sortBy: SortField;
  sortOrder: SortOrder;
  page: number;
  pageSize: number;
}

export interface StockMovementFilterDraft {
  type: StockMovementType | "ALL";
  dateFrom?: string;
  dateTo?: string;
  datePreset: DateFilterPreset;
  sortBy: SortField;
  sortOrder: SortOrder;
}

export interface StockMovementsViewProps {
  movements: StockMovement[];
  isLoading: boolean;
  error: Error | null;
  filters: StockMovementFilters;
  mobileFiltersDraft: StockMovementFilterDraft;
  isMobileFiltersOpen: boolean;
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalElements: number;
  };
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onFilterChange: <K extends keyof StockMovementFilters>(
    key: K,
    value: StockMovementFilters[K],
  ) => void;
  onSortChange: (sortBy: SortField, sortOrder: SortOrder) => void;
  onDatePresetChange: (preset: DateFilterPreset) => void;
  onDateInputChange: (key: "dateFrom" | "dateTo", value: string) => void;
  onOpenMobileFilters: () => void;
  onCloseMobileFilters: () => void;
  onApplyMobileFilters: () => void;
  onClearMobileFilters: () => void;
  onMobileDatePresetChange: (preset: DateFilterPreset) => void;
  onMobileDateInputChange: (key: "dateFrom" | "dateTo", value: string) => void;
  onMobileFilterDraftChange: <K extends keyof StockMovementFilterDraft>(
    key: K,
    value: StockMovementFilterDraft[K],
  ) => void;
}
