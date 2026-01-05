export type ScannerState =
  | "scanning"
  | "product-found"
  | "product-not-found"
  | "loading"
  | "submitting";

export interface Product {
  id: string;
  name: string;
  barcode: string;
  barcodeType: string;
  sku: string;
  hasExpiration: boolean;
  categoryId?: string;
  brandId?: string;
  description?: string;
  isKit: boolean;
  attributes?: Record<string, unknown>;
  active: boolean;
}

export interface BatchFormData {
  quantity: number;
  hasExpiration: boolean;
  expirationDate?: Date;
  batchCode: string;
}

export interface ScannerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface UseScannerDrawerReturn {
  state: ScannerState;
  scannedBarcode: string | null;
  product: Product | null;
  isSubmitting: boolean;
  onScan: (barcode: string) => Promise<void>;
  onSubmitBatch: (data: BatchFormData) => Promise<void>;
  onReset: () => void;
}
