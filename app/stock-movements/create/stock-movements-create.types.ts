import type { MovementType } from "../stock-movements.types";

export interface MovementItemFormData {
  productId: string;
  batchId?: string;
  quantity: number;
  reason?: string;
}

export interface StockMovementCreateFormData {
  movementType: MovementType;
  sourceWarehouseId?: string;
  destinationWarehouseId?: string;
  notes?: string;
  items: MovementItemFormData[];
  executeNow?: boolean;
}

export interface StockMovementCreateResponse {
  success: boolean;
  message?: string | null;
  data: { id: string };
}

export interface BatchSummary {
  id: string;
  productId?: string | null;
  batchCode?: string | null;
  batchNumber?: string | null;
  quantity: number;
}
