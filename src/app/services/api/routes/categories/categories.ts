import { apiInstance } from "@/app/services/api/instance";
import { Category, CategoryOptionalDefaults } from "../../../../../../prisma/generated/zod";

export const categoriesApi = {
  getAll: async () => {
    return apiInstance.get<Category[]>("categories");
  },
  create: async (data: CategoryOptionalDefaults) => {
    return apiInstance.post<Category>("categories", data);
  },
};
