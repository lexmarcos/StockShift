import { apiInstance } from "@/services/api/instance";
import { ICategory } from "@/app/(stockshift)/(pagesOfInventory)/products/types";
import { Category } from "@prisma/client";

export const categoriesApi = {
  getAll: async () => {
    return apiInstance.get<Category[]>("categories");
  },
  create: async (data: ICategory) => {
    return apiInstance.post<Category>("categories", data);
  },
};
