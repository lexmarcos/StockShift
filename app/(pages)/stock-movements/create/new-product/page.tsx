"use client";

import { Suspense } from "react";
import { ProductForm } from "../../../products/components/product-form.view";
import { useNewProductInlineModel } from "./new-product-inline.model";
import { StockMovementReloadGuard } from "../stock-movement-reload-guard";

function NewProductInlineContent() {
  const model = useNewProductInlineModel();
  return (
    <>
      <StockMovementReloadGuard />
      <ProductForm {...model} />
    </>
  );
}

export default function NewProductInlinePage() {
  return (
    <Suspense fallback={null}>
      <NewProductInlineContent />
    </Suspense>
  );
}
