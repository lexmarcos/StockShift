import { apiInstance } from "@/services/api/instance";
import { InventoryOptionalDefaults } from "../../../../../prisma/generated/zod";
import { Inventory } from "@prisma/client";

export const inventoriesApi = {
  getAll: async () => {
    return apiInstance.get<Inventory[]>("inventories");
  },
  create: async (data: InventoryOptionalDefaults) => {
    return apiInstance.post<Inventory>("inventories", data);
  },
};
