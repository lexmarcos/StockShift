import { UseFormReturn } from "react-hook-form";
import { NewTransferSchema } from "./new-transfer.schema";

export interface TransferProductOption {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  imageUrl?: string | null;
  totalQuantity?: number | null;
  stockQuantityLabel?: string;
}

export interface TransferBatchOption {
  id: string;
  productId: string;
  productName?: string;
  batchCode: string;
  quantity: number;
  manufacturedDate: string | null;
  expirationDate: string | null;
}

export interface TransferBatchDrawerState {
  isOpen: boolean;
  productId: string;
  productName: string;
  selectedBatchId: string;
  quantity: string;
  error: string | null;
}

export interface NewTransferItemView {
  id: string;
  productName?: string;
  batchCode?: string;
  quantity: number;
  availableQuantity?: number;
}

export interface NewTransferViewProps {
  form: UseFormReturn<NewTransferSchema>;
  onSubmit: (data: NewTransferSchema) => void;
  warehouses: { id: string; name: string }[];
  products: TransferProductOption[];
  productOptions: TransferProductOption[];
  batches: TransferBatchOption[];
  batchDrawer: TransferBatchDrawerState;
  isLoading: boolean;
  isProductSearchLoading: boolean;
  isProductOptionsOpen: boolean;
  isBatchLoading: boolean;
  isScannerOpen: boolean;
  isFooterVisible: boolean;
  isSubmitting: boolean;

  selectedProductId: string;
  productSearchQuery: string;
  addItemError: string | null;
  onProductSearchChange: (query: string) => void;
  onProductSearchFocus: () => void;
  onProductSearchBlur: () => void;
  onProductSelect: (product: TransferProductOption) => void;
  onProductClear: () => void;
  onScannerOpenChange: (open: boolean) => void;
  onBarcodeScan: (barcode: string) => void;
  onBatchDrawerOpenChange: (open: boolean) => void;
  onBatchChange: (batchId: string) => void;
  onQuantityChange: (value: string) => void;
  onQuantityIncrement: () => void;
  onQuantityDecrement: () => void;
  onConfirmBatch: () => void;
  onRemoveItem: (index: number) => void;
  items: NewTransferItemView[];
}
