"use client";

import { useProductCreateModel } from "./products-create.model";
import { ProductForm } from "../components/product-form.view";

export function PageClient() {
  const modelProps = useProductCreateModel();

  return <ProductForm mode="create" {...modelProps} />;
}
