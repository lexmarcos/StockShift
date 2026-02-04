export type TransferStatus =
  | "DRAFT"
  | "IN_TRANSIT"
  | "IN_VALIDATION"
  | "COMPLETED"
  | "CANCELLED";

export interface TransferWarehouse {
  id: string;
  name: string;
}

export interface TransferItem {
  id: string;
  product: {
    id: string;
    name: string;
    barcode: string;
  };
  quantitySent: number;
  quantityReceived: number | null;
}

export interface Transfer {
  id: string;
  status: TransferStatus;
  sourceWarehouse: TransferWarehouse;
  destinationWarehouse: TransferWarehouse;
  notes: string | null;
  items: TransferItem[];
  createdAt: string;
  executedAt: string | null;
  completedAt: string | null;
}

export interface TransfersResponse {
  success: boolean;
  message: string | null;
  data: Transfer[];
}

export interface TransferResponse {
  success: boolean;
  message: string | null;
  data: Transfer;
}

export interface TransferActionResponse {
  success: boolean;
  message: string;
  data: Transfer;
}

export interface ScanResponse {
  success: boolean;
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

export interface DiscrepancyItem {
  type: "SHORTAGE" | "OVERAGE";
  productName: string;
  productBarcode: string;
  expected: number;
  received: number;
  difference: number;
}

export interface CompleteValidationResponse {
  success: boolean;
  message: string;
  data: {
    transfer: Transfer;
    discrepancies: DiscrepancyItem[];
  };
}

export type DirectionFilter = "all" | "sent" | "received";

export type StatusFilter = "all" | TransferStatus;

export interface TransfersViewProps {
  transfers: Transfer[];
  isLoading: boolean;
  error: Error | undefined;
  currentWarehouseId: string | null;
  statusFilter: StatusFilter;
  setStatusFilter: (filter: StatusFilter) => void;
  directionFilter: DirectionFilter;
  setDirectionFilter: (filter: DirectionFilter) => void;
}
