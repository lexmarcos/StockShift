import { apiInstance } from "../../instance";
import { IResponseGetProducts } from "./types";

export const productsAPIRoutes = {
  getProducts: async () => {
    return apiInstance.get<IResponseGetProducts[]>("products");
  },
};
