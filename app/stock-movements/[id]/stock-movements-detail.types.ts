import type { StockMovement } from "../stock-movements.types";

export interface StockMovementDetailResponse {
  success: boolean;
  message?: string | null;
  data: StockMovement;
}
