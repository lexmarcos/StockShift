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

export type WizardPhase = 'setup' | 'addition' | 'review' | 'success';

export interface MobileWizardItem {
  id: string;
  productId: string;
  productName: string;
  productSku?: string;
  batchId: string;
  batchCode: string;
  quantity: number;
  maxQuantity: number;
}

export interface WarehouseOption {
  id: string;
  name: string;
  productCount?: number;
}

export interface BatchOption {
  id: string;
  batchCode: string;
  quantity: number;
  expirationDate?: string;
}

export interface ProductSearchResult {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
}
