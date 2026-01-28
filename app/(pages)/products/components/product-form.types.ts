// app/products/components/product-form.types.ts
import { UseFormReturn } from "react-hook-form";
import { ProductCreateFormData, AiFillData } from "../create/products-create.types";
import { CustomAttribute } from "@/components/product/custom-attributes-builder";

export interface Category {
  id: string;
  name: string;
}

export interface Brand {
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
  mode: 'create' | 'edit';
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
  handleImageSelect: (file: File | null) => void;
  handleImageRemove?: () => void; // Optional - only needed in edit mode

  // Scanner
  openScanner: () => void;
  closeScanner: () => void;
  isScannerOpen: boolean;
  handleBarcodeScan: (barcode: string) => void;

  // AI Fill
  isAiModalOpen?: boolean;
  openAiModal?: () => void;
  closeAiModal?: () => void;
  handleAiFill?: (data: AiFillData, file: File, useImage: boolean) => void;

  // Outros
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  warehouseId: string | null;
  isFormReady?: boolean; // Optional - only needed in edit mode to prevent race conditions
  batchesDrawer?: BatchesDrawerProps;
}

export type { ProductCreateFormData, CustomAttribute };
