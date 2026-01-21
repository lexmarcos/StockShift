import type { StockMovement, ValidationItem } from "../stock-movements.types";

export interface StockMovementDetailResponse {
  success: boolean;
  message?: string | null;
  data: StockMovement;
}

export interface StartValidationResponse {
  success: boolean;
  message: string;
  data: {
    validationId: string;
    startedAt: string;
    items: ValidationItem[];
  };
}

export interface ExistingValidationItem {
  validationId: string;
  status: "IN_PROGRESS" | "COMPLETED" | "COMPLETED_WITH_DISCREPANCY";
  startedAt: string;
  completedAt: string | null;
  validatedByName: string;
  progress: {
    totalExpected: number;
    totalReceived: number;
  };
}

export interface ExistingValidationsResponse {
  success: boolean;
  message: string | null;
  data: ExistingValidationItem[];
}
