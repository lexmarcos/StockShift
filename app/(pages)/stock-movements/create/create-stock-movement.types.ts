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
  manufacturedDate?: string;
  expirationDate?: string;
  costPrice?: number;
  sellingPrice?: number;
  newProductData?: InlineProductData;
}

export interface ExistingProductBatchFormState {
  isOpen: boolean;
  productId: string;
  productName: string;
  quantity: string;
  manufacturedDate: string;
  expirationDate: string;
  costPrice?: number;
  sellingPrice?: number;
  editingIndex: number | null;
  error: string | null;
}

export interface StockMovementProductOption {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  imageUrl?: string | null;
}

export interface CreateStockMovementViewProps {
  form: UseFormReturn<CreateStockMovementSchema>;
  onSubmit: (data: CreateStockMovementSchema) => void;
  products: StockMovementProductOption[];
  isLoadingProducts: boolean;
  isSubmitting: boolean;
  isFooterVisible: boolean;

  // Item builder state
  selectedProductId: string;
  productSearchQuery: string;
  productOptions: StockMovementProductOption[];
  isProductOptionsOpen: boolean;
  isProductSearchLoading: boolean;
  itemQuantity: string;
  addItemError: string | null;
  isScannerOpen: boolean;
  onProductSearchChange: (query: string) => void;
  onProductSearchFocus: () => void;
  onProductSearchBlur: () => void;
  onProductSelect: (product: StockMovementProductOption) => void;
  onProductClear: () => void;
  onQuantityChange: (value: string) => void;
  onAddItem: () => void;
  onCreateNewProduct: () => void;
  onEditNewProductItem: (index: number) => void;
  onEditExistingProductBatchData: (index: number) => void;
  onScannerOpenChange: (open: boolean) => void;
  onBarcodeScan: (barcode: string) => void;
  onRemoveItem: (index: number) => void;
  existingProductBatchForm: ExistingProductBatchFormState;
  onExistingProductBatchOpenChange: (open: boolean) => void;
  onExistingProductBatchQuantityChange: (quantity: string) => void;
  onExistingProductBatchManufacturedDateChange: (date: string) => void;
  onExistingProductBatchExpirationDateChange: (date: string) => void;
  onExistingProductBatchCostPriceChange: (price?: number) => void;
  onExistingProductBatchSellingPriceChange: (price?: number) => void;
  onConfirmExistingProductBatchData: () => void;
  items: Array<{
    id: string;
    productId?: string;
    quantity: number;
    productName?: string;
    manufacturedDate?: string;
    expirationDate?: string;
    costPrice?: number;
    sellingPrice?: number;
    newProductData?: InlineProductData;
  }>;
}
