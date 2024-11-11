import { apiInstance } from "@/services/api/instance";
import { Inventory } from "@prisma/client";

export const inventoriesApi = {
  getAll: async () => {
    return apiInstance.get<Inventory[]>("inventories");
  },
  create: async (data: Inventory) => {
    return apiInstance.post<Inventory>("inventories", data);
  },
  select: async (inventoryId: string) => {
    return apiInstance.update<Inventory>(
      `inventories/${inventoryId}/select`,
      {},
    );
  },
};
