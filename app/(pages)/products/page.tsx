"use client";

import { useProductsModel } from "./products.model";
import { ProductsView } from "./products.view";

export default function ProductsPage() {
  const model = useProductsModel();

  return <ProductsView {...model} />;
}
