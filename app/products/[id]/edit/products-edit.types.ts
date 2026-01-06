export interface Batch {
  id: string;
  productId: string;
  productName: string;
  productSku?: string | null;
  warehouseId: string;
  warehouseName: string;
  warehouseCode?: string | null;
  quantity: number;
  batchNumber: string;
  batchCode?: string | null;
  expirationDate?: string | null;
  costPrice?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BatchesResponse {
  success: boolean;
  message: string | null;
  data: Batch[];
}
