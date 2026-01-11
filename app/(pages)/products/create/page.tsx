"use client";

import { useProductCreateModel } from "./products-create.model";
import { ProductForm } from "../components/product-form.view";

export default function ProductCreatePage() {
  const modelProps = useProductCreateModel();

  return <ProductForm mode="create" {...modelProps} />;
}
