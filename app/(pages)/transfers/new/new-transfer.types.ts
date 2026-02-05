import { UseFormReturn } from "react-hook-form";
import { NewTransferSchema } from "./new-transfer.schema";

export interface NewTransferViewProps {
  form: UseFormReturn<NewTransferSchema>;
  onSubmit: (data: NewTransferSchema) => void;
  warehouses: { id: string; name: string }[];
  products: { id: string; name: string }[];
  batches: { id: string; code: string; quantity: number }[];
  onSelectProduct: (productId: string) => void;
  isLoading: boolean;
  isSubmitting: boolean;

  // Item builder state (managed by model)
  selectedProductId: string;
  selectedBatchId: string;
  itemQuantity: string;
  addItemError: string | null;
  onProductChange: (productId: string) => void;
  onBatchChange: (batchId: string) => void;
  onQuantityChange: (value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  items: Array<{ id: string; productName?: string; batchCode?: string; quantity: number }>;
}
