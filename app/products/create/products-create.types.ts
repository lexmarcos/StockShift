import { ProductCreateFormData } from "./products-create.schema";
import { CustomAttribute } from "@/components/product/custom-attributes-builder";

export type { ProductCreateFormData, CustomAttribute };

export interface Category {
  id: string;
  name: string;
}

export interface CreateProductResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    // ... outros campos retornados
  };
}

export interface CategoriesResponse {
  success: boolean;
  data: Category[];
}
