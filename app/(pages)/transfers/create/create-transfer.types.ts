import { UseFormReturn } from "react-hook-form";
import { CreateTransferFormData } from "./create-transfer.schema";

export interface Product {
  id: string;
  name: string;
  barcode: string | null;
  availableQuantity: number;
}

export interface Warehouse {
  id: string;
  name: string;
}

export interface CreateTransferViewProps {
  form: UseFormReturn<CreateTransferFormData>;
  onSubmit: (data: CreateTransferFormData) => Promise<void>;
  warehouses: Warehouse[];
  products: Product[];
  currentWarehouseName: string;
  isSubmitting: boolean;
}

export interface CreateTransferResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
  };
}
