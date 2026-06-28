import type { UseFormReturn } from "react-hook-form";
import type { UpdateSellingPriceFormData } from "./update-selling-price.schema";

export interface ProductBatch {
  id: string;
  productName: string | null;
  batchCode: string | null;
  quantity: number;
  costPrice: number | null;
  sellingPrice: number | null;
  manufacturedDate: string | null;
  expirationDate: string | null;
  createdAt: string;
}

export type SortKey = "batchCode" | "quantity" | "expirationDate";
export type SortDirection = "asc" | "desc";

export interface SellingPriceUpdateModel {
  form: UseFormReturn<UpdateSellingPriceFormData>;
  isOpen: boolean;
  isConfirmOpen: boolean;
  isSubmitting: boolean;
  hasDifferentPrices: boolean;
  openModal: () => void;
  closeModal: () => void;
  requestConfirmation: () => void;
  closeConfirm: () => void;
  confirmUpdate: () => void;
}

export interface ProductBatchesViewProps {
  batches: ProductBatch[];
  productName: string;
  isLoading: boolean;
  error: Error | null;
  requiresWarehouse: boolean;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSortChange: (key: SortKey) => void;
  sellingPriceUpdate: SellingPriceUpdateModel;
}
