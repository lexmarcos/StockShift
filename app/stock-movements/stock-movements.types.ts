export type MovementType = "ENTRY" | "EXIT" | "TRANSFER" | "ADJUSTMENT";
export type MovementStatus = "PENDING" | "COMPLETED" | "CANCELLED";

export interface StockMovementItem {
  id: string;
  productId: string;
  productName: string;
  productSku?: string | null;
  batchId?: string | null;
  batchNumber?: string | null;
  quantity: number;
  reason?: string | null;
}

export interface StockMovement {
  id: string;
  movementType: MovementType;
  status: MovementStatus;
  sourceWarehouseId: string | null;
  sourceWarehouseName: string | null;
  destinationWarehouseId: string | null;
  destinationWarehouseName: string | null;
  notes?: string | null;
  createdBy: string;
  createdByName: string;
  executedBy: string | null;
  executedByName: string | null;
  items: StockMovementItem[];
  createdAt: string;
  updatedAt: string;
  executedAt: string | null;
}

export interface StockMovementsResponse {
  success: boolean;
  message?: string | null;
  data: StockMovement[];
}

export interface MovementFilters {
  searchQuery: string;
  status: MovementStatus | "all";
  movementType: MovementType | "all";
  warehouseId: string | "";
}

export interface SortConfig {
  key: "createdAt" | "movementType" | "status";
  direction: "asc" | "desc";
}
