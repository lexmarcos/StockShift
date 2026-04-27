import { PdvSchema } from "./pdv.schema";

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string | null;
  productImageUrl: string | null;
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
  imageUrl: string | null;
  totalQuantity: number;
}

export type SaleDrawerStep = "sale-type" | "link-payment" | "in-person";

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
  batchPopoverOpen: number | null;
  onBatchPopoverChange: (index: number | null) => void;
  meetsMinimumForPaymentLink: boolean;
  saleDrawerOpen: boolean;
  saleDrawerStep: SaleDrawerStep;
  saleDrawerData: { saleCode: string; total: number; paymentLink: string } | null;
  onOpenSaleDrawer: () => void;
  onCloseSaleDrawer: () => void;
  onCheckPaymentLater: () => void;
  onGoToLinkPayment: () => void;
  onGoToInPerson: () => void;
  barcodeDrawerOpen: boolean;
  onOpenBarcodeDrawer: () => void;
  onCloseBarcodeDrawer: () => void;
  onBarcodeScanned: (barcode: string) => void;
  favorites: ProductWithStock[];
  isMobile: boolean;
}
