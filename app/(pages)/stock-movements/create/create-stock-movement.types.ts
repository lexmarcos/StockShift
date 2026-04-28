import { UseFormReturn } from "react-hook-form";
import { CreateStockMovementSchema } from "./create-stock-movement.schema";

export interface InlineProductData {
  name: string;
  description?: string;
  barcode?: string;
  categoryId?: string;
  brandId?: string;
  isKit?: boolean;
  hasExpiration?: boolean;
  active?: boolean;
  attributes?: Record<string, string>;
  manufacturedDate?: string;
  expirationDate?: string;
  costPrice?: number;
  sellingPrice?: number;
  image?: InlineProductImageData;
}

export interface InlineProductImageData {
  name: string;
  type: string;
  dataUrl: string;
}

export interface StockMovementDraftItem {
  productId?: string;
  quantity: number;
  productName?: string;
  newProductData?: InlineProductData;
}

export interface CreateStockMovementViewProps {
  form: UseFormReturn<CreateStockMovementSchema>;
  onSubmit: (data: CreateStockMovementSchema) => void;
  products: { id: string; name: string }[];
  isLoadingProducts: boolean;
  isSubmitting: boolean;

  // Item builder state
  selectedProductId: string;
  itemQuantity: string;
  addItemError: string | null;
  isScannerOpen: boolean;
  onProductChange: (productId: string) => void;
  onQuantityChange: (value: string) => void;
  onAddItem: () => void;
  onCreateNewProduct: () => void;
  onScannerOpenChange: (open: boolean) => void;
  onBarcodeScan: (barcode: string) => void;
  onRemoveItem: (index: number) => void;
  items: Array<{
    id: string;
    productId?: string;
    quantity: number;
    productName?: string;
    newProductData?: InlineProductData;
  }>;
}
