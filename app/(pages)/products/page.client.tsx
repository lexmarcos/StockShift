"use client";

import { useProductsModel } from "./products.model";
import { ProductsView } from "./products.view";

export function PageClient() {
  const model = useProductsModel();

  return <ProductsView {...model} />;
}
