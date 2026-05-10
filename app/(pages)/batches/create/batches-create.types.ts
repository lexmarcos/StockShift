export interface ProductSearchOption {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  imageUrl?: string | null;
  hasExpiration: boolean;
}

export interface ProductSearchResponse {
  success: boolean;
  data: ProductSearchOption[];
}

export interface ProductLookupResponse {
  success: boolean;
  data: ProductSearchOption | null;
}

export interface BatchCreatePayload {
  productId: string;
  warehouseId: string;
  quantity: number;
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

export interface ProductBatchPriceSource {
  id: string;
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  originStockMovementItemId: string | null;
  originStockMovementId: string | null;
  originStockMovementCode: string | null;
  batchCode: string | null;
  quantity: number;
  manufacturedDate: string | null;
  expirationDate: string | null;
  costPrice: number | null;
  sellingPrice: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductBatchesResponse {
  success: boolean;
  message?: string | null;
  data: ProductBatchPriceSource[];
}

export interface LatestBatchPriceSuggestion {
  batchCode: string;
  createdAtLabel: string;
  costPriceCents: number | null;
  sellingPriceCents: number | null;
  costPriceLabel: string;
  sellingPriceLabel: string;
}
