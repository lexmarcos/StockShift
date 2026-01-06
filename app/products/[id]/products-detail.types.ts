export interface Product {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  brand: {
    id: string;
    name: string;
    logoUrl: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  barcode: string | null;
  barcodeType: string | null;
  sku: string | null;
  isKit: boolean;
  attributes: Record<string, string> | null;
  hasExpiration: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductResponse {
  success: boolean;
  message: string | null;
  data: Product;
}
