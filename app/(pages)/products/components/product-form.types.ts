// app/products/components/product-form.types.ts
import { UseFormReturn } from "react-hook-form";
import { ProductCreateFormData, AiFillData } from "../create/products-create.types";
import { CustomAttribute } from "@/components/product/custom-attributes-builder";
import type {
  ExistingProductBatchFormState,
  ExistingProductPriceSuggestion,
  ExistingProductProfitSummary,
} from "../../stock-movements/create/create-stock-movement.types";

interface Category {
  id: string;
  name: string;
  parentCategoryName?: string | null;
  parentCategory?: {
    id: string;
    name: string;
  } | null;
}

interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface BatchDrawerFormItem {
  id: string;
  fieldId?: string;
  productId: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode?: string | null;
  batchCode: string;
  quantity: number;
  expirationDate?: string;
  costPrice?: number;
  sellingPrice?: number;
  notes?: string;
}

export interface BatchesDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  direction: "right" | "bottom";
  isLoading: boolean;
  fields: BatchDrawerFormItem[];
  onSave: (index: number) => void;
  updatingBatchId: string | null;
  form: UseFormReturn<{ batches: BatchDrawerFormItem[] }>;
}

export interface ExistingProductInfo {
  id: string;
  name: string;
  barcode: string;
}

export interface NewProductBatchOverlay {
  batchForm: ExistingProductBatchFormState;
  onBatchOpenChange: (open: boolean) => void;
  onBatchQuantityChange: (quantity: string) => void;
  onBatchQuantityIncrement: () => void;
  onBatchQuantityDecrement: () => void;
  onBatchManufacturedDateChange: (date: string) => void;
  onBatchExpirationDateChange: (date: string) => void;
  onBatchCostPriceChange: (price?: number) => void;
  onBatchSellingPriceChange: (price?: number) => void;
  onApplyBatchCostPriceSuggestion: () => void;
  onApplyBatchSalePriceSuggestion: () => void;
  onConfirmBatch: () => void;
  batchCostPriceSuggestion: ExistingProductPriceSuggestion | null;
  batchSalePriceSuggestion: ExistingProductPriceSuggestion | null;
  isBatchPriceSuggestionLoading: boolean;
  shouldShowMissingBatchCostPriceSuggestion: boolean;
  shouldShowMissingBatchSalePriceSuggestion: boolean;
  batchProfitSummary: ExistingProductProfitSummary;
}

/**
 * Props for the shared ProductForm component used in both create and edit modes.
 *
 * Note: Both modes use ProductCreateFormData schema - edit mode pre-populates
 * the form with existing product data but uses the same validation schema.
 *
 * Handles:
 * - Form state management via React Hook Form
 * - Auxiliary data (categories, brands) with loading states
 * - Custom product attributes (add/remove/update)
 * - Image handling (upload new, display current, remove existing)
 * - Barcode scanner integration
 */
export interface ProductFormProps {
  mode: 'create' | 'edit' | 'inline';
  onSubmit: (data: ProductCreateFormData) => void;
  isSubmitting: boolean;
  form: UseFormReturn<ProductCreateFormData>;

  // Dados auxiliares
  categories: Category[];
  isLoadingCategories: boolean;
  brands: Brand[];
  isLoadingBrands: boolean;

  // Atributos customizados
  customAttributes: CustomAttribute[];
  addCustomAttribute: () => void;
  removeCustomAttribute: (index: number) => void;
  updateCustomAttribute: (
    index: number,
    field: "key" | "value",
    value: string
  ) => void;

  // Imagem
  productImage: File | null;
  currentImageUrl?: string; // URL da imagem existente (edit mode)
  isImageProcessing?: boolean;
  handleImageSelect: (file: File | null) => void;
  handleImageProcessingChange?: (isProcessing: boolean) => void;
  handleImageRemove?: () => void; // Optional - only needed in edit mode

  // Scanner
  openScanner: () => void;
  closeScanner: () => void;
  isScannerOpen: boolean;
  handleBarcodeScan: (barcode: string) => void | Promise<void>;

  // Existing product modal (new-product page)
  scannedExistingProduct: ExistingProductInfo | null;
  onExistingProductModalOpenChange?: (open: boolean) => void;
  onCreateBatchForExistingProduct?: () => void | Promise<void>;

  // Batch overlay (new-product page)
  batchForm?: ExistingProductBatchFormState;
  onBatchOpenChange?: (open: boolean) => void;
  onBatchQuantityChange?: (quantity: string) => void;
  onBatchQuantityIncrement?: () => void;
  onBatchQuantityDecrement?: () => void;
  onBatchManufacturedDateChange?: (date: string) => void;
  onBatchExpirationDateChange?: (date: string) => void;
  onBatchCostPriceChange?: (price?: number) => void;
  onBatchSellingPriceChange?: (price?: number) => void;
  onApplyBatchCostPriceSuggestion?: () => void;
  onApplyBatchSalePriceSuggestion?: () => void;
  onConfirmBatch?: () => void;
  batchCostPriceSuggestion?: ExistingProductPriceSuggestion | null;
  batchSalePriceSuggestion?: ExistingProductPriceSuggestion | null;
  isBatchPriceSuggestionLoading?: boolean;
  shouldShowMissingBatchCostPriceSuggestion?: boolean;
  shouldShowMissingBatchSalePriceSuggestion?: boolean;
  batchProfitSummary?: ExistingProductProfitSummary;

  // AI Fill
  isAiModalOpen?: boolean;
  openAiModal?: () => void;
  closeAiModal?: () => void;
  handleAiFill?: (data: AiFillData, file: File, useImage: boolean) => void;

  // Outros
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  warehouseId: string | null;
  cancelHref?: string;
  onCancel?: () => void;
  isInlineEdit?: boolean;
  onQuantityIncrement?: () => void;
  onQuantityDecrement?: () => void;
  isFormReady?: boolean; // Optional - only needed in edit mode to prevent race conditions
  batchesDrawer?: BatchesDrawerProps;
}
