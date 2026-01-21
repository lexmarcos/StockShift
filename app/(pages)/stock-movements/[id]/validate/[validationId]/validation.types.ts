import type {
  ValidationItem,
  ValidationProgress,
  ValidationScanResult,
  ValidationCompletionResult,
  ValidationDiscrepancy,
} from "../../../stock-movements.types";

export type { ValidationItem, ValidationProgress, ValidationScanResult, ValidationCompletionResult, ValidationDiscrepancy };

export interface ValidationSessionResponse {
  success: boolean;
  message: string | null;
  data: {
    validationId: string;
    status: "IN_PROGRESS" | "COMPLETED" | "COMPLETED_WITH_DISCREPANCY";
    startedAt: string;
    completedAt?: string;
    items: ValidationItem[];
    progress: ValidationProgress;
  };
}

export interface ScanResponse {
  success: boolean;
  message: string;
  data: ValidationScanResult;
}

export interface CompleteValidationResponse {
  success: boolean;
  message: string;
  data: ValidationCompletionResult;
}

export interface ValidationViewProps {
  movementId: string;
  validationId: string;
  sourceWarehouseName: string;
  destinationWarehouseName: string;
  items: ValidationItem[];
  progress: ValidationProgress;
  isLoading: boolean;
  isScanning: boolean;
  isCompleting: boolean;
  lastScanResult: ValidationScanResult | null;
  onScan: (barcode: string) => void;
  onComplete: () => void;
  onBack: () => void;
  showCompleteModal: boolean;
  onCompleteModalChange: (open: boolean) => void;
  hasDiscrepancies: boolean;
  discrepancies: ValidationDiscrepancy[];
}
