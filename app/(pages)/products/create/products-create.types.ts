import { ProductCreateFormData } from "./products-create.schema";
import { CustomAttribute } from "@/components/product/custom-attributes-builder";

export type { ProductCreateFormData, CustomAttribute };

export interface Category {
  id: string;
  name: string;
}

export interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface CreateProductWithBatchResponse {
  success: boolean;
  message: string;
  data: {
    product: {
      id: string;
      name: string;
      // ... outros campos do produto
    };
    batch: {
      id: string;
      productId: string;
      // ... outros campos do batch
    };
  };
}

export interface CategoriesResponse {
  success: boolean;
  data: Category[];
}

export interface BrandsResponse {
  success: boolean;
  data: Brand[];
}
