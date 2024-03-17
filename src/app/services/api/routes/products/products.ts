import { ProductCreateInputObjectSchema } from "../../../../../../prisma/generated/schemas";
import { apiInstance } from "../../instance";
import { IResponseGetProducts } from "./types";
import { z } from "zod";

export const productsAPIRoutes = {
  getProducts: async () => {
    return apiInstance.get<IResponseGetProducts[]>("products");
  },
  createProduct: async (data: z.infer<typeof ProductCreateInputObjectSchema>) => {
    return apiInstance.post<z.infer<typeof ProductCreateInputObjectSchema>>("products", data);
  },
};
