import { PdvSchema } from "./pdv.schema";

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string | null;
  batchId: string;
  batchCode: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  availableBatches: BatchOption[];
}

export interface BatchOption {
  batchId: string;
  batchCode: string;
  quantity: number;
  sellingPrice: number | null;
  expirationDate: string | null;
}

export interface ProductWithStock {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  totalQuantity: number;
}

export interface PdvViewProps {
  form: import("react-hook-form").UseFormReturn<PdvSchema>;
  cart: CartItem[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchResults: ProductWithStock[];
  isSearching: boolean;
  onAddProduct: (product: ProductWithStock) => void;
  onRemoveItem: (index: number) => void;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onChangeBatch: (itemIndex: number, batchId: string) => void;
  subtotal: number;
  discountAmount: number;
  total: number;
  isSubmitting: boolean;
  onSubmit: (data: PdvSchema) => void;
  warehouses: { id: string; name: string }[];
  isLoadingWarehouses: boolean;
  batchPopoverOpen: number | null;
  onBatchPopoverChange: (index: number | null) => void;
  isMobile: boolean;
}
