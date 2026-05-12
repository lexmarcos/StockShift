export interface BatchDetail {
  id: string;
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  originStockMovementItemId: string | null;
  originStockMovementId: string | null;
  originStockMovementCode: string | null;
  batchCode: string;
  quantity: number;
  manufacturedDate: string | null;
  expirationDate: string | null;
  costPrice: number | null;
  sellingPrice: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BatchDetailResponse {
  success: boolean;
  message: string | null;
  data: BatchDetail;
}

export type BatchStatusKind = "expired" | "expiring" | "low_stock" | "ok";

export interface BatchStatusView {
  kind: BatchStatusKind;
  label: string;
  description: string;
  badgeClass: string;
  panelClass: string;
  textClass: string;
  meterClass: string;
}

export interface BatchDetailViewProps {
  batch: BatchDetail | null;
  isLoading: boolean;
  error: Error | null;
  status: BatchStatusView | null;
  daysToExpire: number | null;
  formattedCostPrice: string;
  formattedSellingPrice: string;
  formattedCostTotal: string;
  formattedSellingTotal: string;
  marginLabel: string;
  marginClass: string;
  expirationLabel: string;
  isDeleteOpen: boolean;
  onDeleteOpenChange: (open: boolean) => void;
  isDeleting: boolean;
  onDelete: () => void;
}
