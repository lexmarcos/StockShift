import { UseFormReturn } from "react-hook-form";
import { CreateStockMovementSchema } from "./create-stock-movement.schema";

export interface CreateStockMovementViewProps {
  form: UseFormReturn<CreateStockMovementSchema>;
  onSubmit: (data: CreateStockMovementSchema) => void;
  products: { id: string; name: string }[];
  isLoadingProducts: boolean;
  isSubmitting: boolean;

  // Item builder state
  selectedProductId: string;
  itemQuantity: string;
  addItemError: string | null;
  onProductChange: (productId: string) => void;
  onQuantityChange: (value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    productName?: string;
  }>;
}
