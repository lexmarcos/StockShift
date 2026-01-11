export interface Batch {
  id: string;
  productId: string;
  productName: string;
  productSku?: string | null;
  warehouseId: string;
  warehouseName: string;
  warehouseCode?: string | null;
  quantity: number;
  batchNumber?: string | null;
  batchCode?: string | null;
  expirationDate?: string | null;
  manufacturedDate?: string | null;
  costPrice?: number | null;
  sellingPrice?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BatchStatusKind = "expired" | "expiring" | "low" | "ok";

export interface BatchStatus {
  kind: BatchStatusKind;
  label: string;
  daysToExpire?: number | null;
}

export interface BatchFilters {
  searchQuery: string;
  warehouseId: string | "";
  status: "all" | BatchStatusKind;
  lowStockThreshold: number;
}

export interface SortConfig {
  key: "product" | "quantity" | "expiration" | "createdAt";
  direction: "asc" | "desc";
}

export interface BatchesResponse {
  success: boolean;
  message?: string | null;
  data: Batch[];
}
