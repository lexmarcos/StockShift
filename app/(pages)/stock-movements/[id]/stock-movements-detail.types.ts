import type {
  StockMovement,
  StockMovementItem,
  StockMovementType,
} from "../stock-movements.types";
import type { Batch } from "../../batches/batches.types";

export interface StockMovementDetailResponse {
  success: boolean;
  message: string;
  data: StockMovement;
}

export interface BatchDetailResponse {
  success: boolean;
  message?: string | null;
  data: Batch;
}

export interface BatchPriceInfo {
  batchId: string;
  costPrice: number | null;
  sellingPrice: number | null;
}

export interface FinancialSummary {
  totalPurchaseCost: number;
  totalExpectedSale: number;
  totalProfit: number;
  averageProfitMargin: number;
}

export interface GroupedProduct {
  productId: string;
  productName: string;
  productSku: string | null;
  productImageUrl: string | null;
  items: StockMovementItem[];
  totalQuantity: number;
}

export type MovementCategory =
  | "purchase"
  | "outflow"
  | "adjustment_in"
  | "transfer";

export const MOVEMENT_CATEGORY_MAP: Record<StockMovementType, MovementCategory> = {
  PURCHASE_IN: "purchase",
  SALE: "outflow",
  USAGE: "outflow",
  GIFT: "outflow",
  LOSS: "outflow",
  DAMAGE: "outflow",
  ADJUSTMENT_OUT: "outflow",
  ADJUSTMENT_IN: "adjustment_in",
  TRANSFER_IN: "transfer",
  TRANSFER_OUT: "transfer",
};

export interface StockMovementDetailViewProps {
  movement: StockMovement | null;
  batchPrices: BatchPriceInfo[];
  isLoading: boolean;
  error: Error | null;
}
