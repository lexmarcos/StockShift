export enum TransferStatus {
  DRAFT = "DRAFT",
  IN_TRANSIT = "IN_TRANSIT",
  IN_VALIDATION = "IN_VALIDATION",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface TransferItem {
  id: string;
  sourceBatchId: string;
  quantity: number;
  productName?: string;
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
  updatedAt: string;
}

export interface DiscrepancyItem {
  productName: string;
  quantitySent: number;
  quantityReceived: number;
  discrepancyType: "SHORTAGE" | "OVERAGE";
  difference: number;
}
