export interface BatchCreateFormData {
  productId: string;
  warehouseId: string;
  quantity: number;
  batchCode?: string;
  manufacturedDate?: string;
  expirationDate?: string;
  costPrice?: number;
  sellingPrice?: number;
  notes?: string;
}

export interface BatchCreateResponse {
  success: boolean;
  message?: string | null;
  data: { id: string };
}
