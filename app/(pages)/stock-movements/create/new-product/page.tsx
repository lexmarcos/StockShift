"use client";

import { Suspense } from "react";
import { ProductForm } from "../../../products/components/product-form.view";
import { useNewProductInlineModel } from "./new-product-inline.model";

function NewProductInlineContent() {
  const model = useNewProductInlineModel();
  return <ProductForm {...model} />;
}

export default function NewProductInlinePage() {
  return (
    <Suspense fallback={null}>
      <NewProductInlineContent />
    </Suspense>
  );
}
