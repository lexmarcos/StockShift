export enum TransferStatus {
  DRAFT = "DRAFT",
  IN_TRANSIT = "IN_TRANSIT",
  PENDING_VALIDATION = "PENDING_VALIDATION",
  IN_VALIDATION = "IN_VALIDATION",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface TransferItem {
  id: string;
  sourceBatchId: string;
  quantity?: number;
  quantitySent?: number;
  quantityReceived?: number;
  productName?: string;
  productBarcode?: string;
  batchCode?: string;
}

export interface Transfer {
  id: string;
  code: string;
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  destinationWarehouseId: string;
  destinationWarehouseName: string;
  status: TransferStatus;
  notes?: string;
  items: TransferItem[];
  createdAt: string;
}

// GET /transfers — paginated response
export interface TransfersPageResponse {
  success: boolean;
  message?: string;
  data: {
    content: Transfer[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  };
}

// GET /transfers/{id} — single transfer response
export interface TransferDetailResponse {
  success: boolean;
  message?: string;
  data: Transfer;
}

// POST /transfers/{id}/scan — scan response
export interface ScanResponse {
  success: boolean;
  message: string;
  data: {
    valid: boolean;
    message: string;
    warning: string | null;
    productName: string;
    productBarcode: string;
    quantitySent: number;
    quantityReceived: number;
  };
}

// GET /transfers/{id}/discrepancy-report
export interface DiscrepancyItem {
  productName: string;
  quantitySent: number;
  quantityReceived: number;
  discrepancyType: "SHORTAGE" | "OVERAGE";
  difference: number;
}

export interface DiscrepancyReportResponse {
  success: boolean;
  message?: string;
  data: {
    transferId: string;
    items: DiscrepancyItem[];
  };
}

// GET /transfers/{id}/validation-logs
export interface ValidationLogEntry {
  id: string;
  transferItemId: string;
  barcode: string;
  validatedByUserId: string;
  validatedAt: string;
  valid: boolean;
}

export interface ValidationLogsResponse {
  success: boolean;
  message?: string;
  data: ValidationLogEntry[];
}
