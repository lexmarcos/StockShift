import { UseFormReturn } from "react-hook-form";
import { NewTransferSchema } from "./new-transfer.schema";

export interface NewTransferViewProps {
  form: UseFormReturn<NewTransferSchema>;
  onSubmit: (data: NewTransferSchema) => void;
  warehouses: { id: string; name: string }[];
  products: { id: string; name: string }[];
  batches: { id: string; code: string; quantity: number }[];
  onSearchProduct: (query: string) => void;
  onSelectProduct: (productId: string) => void;
  isLoading: boolean;
  isSubmitting: boolean;
}
