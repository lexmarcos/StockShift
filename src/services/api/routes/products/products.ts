import { Product } from "@prisma/client";
import { apiInstance } from "../../instance";
import { IResponseGetProduct } from "./types";

export const productsAPIRoutes = {
  getProducts: async () => {
    return apiInstance.get<IResponseGetProduct[]>("products");
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
