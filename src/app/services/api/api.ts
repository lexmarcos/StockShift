import { authApiRoutes } from "./routes/auth/auth";
import { productsAPIRoutes } from "./routes/products/products";

export const api = {
  auth: authApiRoutes,
  products: productsAPIRoutes,
};
