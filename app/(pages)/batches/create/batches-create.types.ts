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
