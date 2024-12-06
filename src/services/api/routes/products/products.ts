import { Product } from "@prisma/client";
import { apiInstance } from "../../instance";

export const productsAPIRoutes = {
  getProductsByName: async (name: string) => {
    return apiInstance.get<Product[]>("products", {name});
  },

  getProducts: async () => {
    return apiInstance.get<Product[]>("products");
  },

  createProduct: async (
    data: Product,
  ) => {
    return apiInstance.post<Product>(
      "products",
      data,
    );
  },
  getProductBySKU: async (sku: string) => {
    return apiInstance.get<Product>(
      "products/sku/" + sku,
    );
  },
  updateProduct: async (data: Product) => {
    return apiInstance.update<Product>("products", data);
  },
};
