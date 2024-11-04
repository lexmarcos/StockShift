import {
  ProductOptionalDefaultsSchema,
  ProductSchema,
} from "../../../../../prisma/generated/zod";
import { apiInstance } from "../../instance";
import { IResponseGetProduct } from "./types";
import { z } from "zod";

export const productsAPIRoutes = {
  getProducts: async () => {
    return apiInstance.get<IResponseGetProduct[]>("products");
  },
  createProduct: async (
    data: z.infer<typeof ProductOptionalDefaultsSchema>,
  ) => {
    return apiInstance.post<z.infer<typeof ProductOptionalDefaultsSchema>>(
      "products",
      data,
    );
  },
  getProductBySKU: async (sku: string) => {
    return apiInstance.get<z.infer<typeof ProductSchema>>(
      "products/sku/" + sku,
    );
  },
  updateProduct: async (data: z.infer<typeof ProductSchema>) => {
    return apiInstance.update<z.infer<typeof ProductSchema>>("products", data);
  },
};
