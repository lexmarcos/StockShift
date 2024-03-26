import { authApiRoutes } from "./routes/auth/auth";
import { inventoriesApi } from "./routes/inventories/inventories";
import { productsAPIRoutes } from "./routes/products/products";
import {categoriesApi} from "@/app/services/api/routes/categories/categories";

export const api = {
  auth: authApiRoutes,
  products: productsAPIRoutes,
  categories: categoriesApi,
  inventories: inventoriesApi,
};
