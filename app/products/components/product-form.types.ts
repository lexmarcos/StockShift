// app/products/components/product-form.types.ts
import { UseFormReturn } from "react-hook-form";
import { ProductCreateFormData } from "../create/products-create.schema";
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

  // Outros
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  warehouseId: string | null;
}

export type { ProductCreateFormData, CustomAttribute };
