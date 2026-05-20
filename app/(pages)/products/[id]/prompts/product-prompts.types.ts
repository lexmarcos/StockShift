import type { UseFormReturn } from "react-hook-form";
import type { Product, ProductBatch } from "../products-detail.types";
import type {
  ProductPromptCreateFormData,
  ProductPromptGenerateFormData,
} from "./product-prompts.schema";

export type ProductPromptPricePosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "middle-center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface ProductPromptPositionOption {
  value: ProductPromptPricePosition;
  label: string;
}

export type ProductPromptCashOfferMode = "final-price" | "discount-percent";

export type ProductPromptInstallmentBase =
  | "normal-price"
  | "cash-price"
  | "custom-price";

export interface ProductPromptPriceConfigInput {
  normalPriceCents?: number;
  showCashOffer?: boolean;
  cashOfferMode?: ProductPromptCashOfferMode;
  cashPriceCents?: number;
  cashDiscountPercent?: number;
  showInstallments?: boolean;
  installments?: number;
  installmentBase?: ProductPromptInstallmentBase;
  installmentPriceCents?: number;
  pricePosition: ProductPromptPricePosition;
}

export interface SavedProductImagePrompt {
  id: string;
  name: string;
  prompt: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPromptProductResponse {
  success: boolean;
  message: string | null;
  data: Product;
}

export interface ProductPromptListResponse {
  success: boolean;
  message: string | null;
  data: SavedProductImagePrompt[];
}

export interface ProductPromptMutationResponse {
  success: boolean;
  message: string | null;
  data: SavedProductImagePrompt;
}

export interface ProductPromptBatchesResponse {
  success: boolean;
  message: string | null;
  data: ProductBatch[];
}

export interface ProductPromptCompanyResponse {
  success: boolean;
  message?: string | null;
  data: {
    logoUrl: string | null;
  };
}

export interface ProductPromptGenerationInput {
  savedPrompt: string;
  normalPriceCents: number;
  showCashOffer: boolean;
  cashOfferMode: ProductPromptCashOfferMode;
  cashPriceCents?: number;
  cashDiscountPercent?: number;
  showInstallments: boolean;
  installments?: number;
  installmentBase: ProductPromptInstallmentBase;
  installmentPriceCents?: number;
  pricePosition: ProductPromptPricePosition;
}

export type ProductPromptTextCopyResult =
  | "text"
  | "unsupported"
  | "copy-failed";

export type ProductPromptAssetShareResult =
  | "shared"
  | "unsupported"
  | "product-image-failed"
  | "brand-image-failed"
  | "share-failed"
  | "cancelled";

export interface ProductPromptTextCopyInput {
  promptText: string;
}

export interface ProductPromptAssetShareInput {
  productImageUrl: string;
  companyLogoUrl?: string | null;
}

export interface ProductPromptBrowserActions {
  copyPromptText: (
    input: ProductPromptTextCopyInput
  ) => Promise<ProductPromptTextCopyResult>;
  sharePromptAssets: (
    input: ProductPromptAssetShareInput
  ) => Promise<ProductPromptAssetShareResult>;
}

export interface UseProductPromptsModelDependencies {
  browserActions?: ProductPromptBrowserActions;
}

export interface ProductPromptsViewProps {
  product: Product | null;
  prompts: SavedProductImagePrompt[];
  isLoading: boolean;
  error: Error | null;
  isCreatePromptOpen: boolean;
  isPreparingShareImage: boolean;
  selectedPrompt: SavedProductImagePrompt | null;
  latestSellingPriceCents?: number;
  pricePositionOptions: ProductPromptPositionOption[];
  createPromptForm: UseFormReturn<ProductPromptCreateFormData>;
  generatePromptForm: UseFormReturn<ProductPromptGenerateFormData>;
  createPromptImageFile?: File;
  openCreatePromptForm: () => void;
  closeCreatePromptForm: () => void;
  openGeneratePromptForm: (prompt: SavedProductImagePrompt) => void;
  closeGeneratePromptForm: () => void;
  setCreatePromptImageFile: (file: File | null) => void;
  submitCreatePrompt: (data: ProductPromptCreateFormData) => Promise<void>;
  submitGeneratePrompt: (data: ProductPromptGenerateFormData) => Promise<void>;
}
