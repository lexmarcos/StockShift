export type MovementType = "ENTRY" | "EXIT" | "TRANSFER" | "ADJUSTMENT";
export type MovementStatus =
  | "PENDING"
  | "IN_TRANSIT"
  | "COMPLETED"
  | "COMPLETED_WITH_DISCREPANCY"
  | "CANCELLED";

// Validation Types
export type ValidationItemStatus = "PENDING" | "PARTIAL" | "COMPLETE";

export interface ValidationItem {
  itemId: string;
  productId: string;
  productName: string;
  barcode: string;
  expectedQuantity: number;
  scannedQuantity: number;
  status: ValidationItemStatus;
}

export interface ValidationProgress {
  totalItems: number;
  completeItems: number;
  partialItems: number;
  pendingItems: number;
}

export interface ValidationSession {
  validationId: string;
  status: "IN_PROGRESS" | "COMPLETED" | "COMPLETED_WITH_DISCREPANCY";
  startedAt: string;
  completedAt?: string;
  items: ValidationItem[];
  progress: ValidationProgress;
}

export interface ValidationScanResult {
  success: boolean;
  message: string;
  barcode: string;
  item: ValidationItem | null;
}

export interface ValidationDiscrepancy {
  productId: string;
  productName: string;
  expected: number;
  received: number;
  missing: number;
}

export interface ValidationCompletionResult {
  validationId: string;
  status: "COMPLETED" | "COMPLETED_WITH_DISCREPANCY";
  completedAt: string;
  summary: {
    totalExpected: number;
    totalReceived: number;
    totalMissing: number;
  };
  discrepancies: ValidationDiscrepancy[];
  reportUrl?: string;
}

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
  executedBy?: string | null;
  executedByName?: string | null;
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
