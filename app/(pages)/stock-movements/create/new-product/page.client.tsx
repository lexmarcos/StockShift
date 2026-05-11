"use client";

import { Suspense } from "react";
import { ProductForm } from "../../../products/components/product-form.view";
import { useNewProductInlineModel } from "./new-product-inline.model";
import { StockMovementReloadGuard } from "../stock-movement-reload-guard";

interface NewProductInlineContentProps {
  movementType: string | null;
  editItem: string | null;
}

function NewProductInlineContent({
  movementType,
  editItem,
}: NewProductInlineContentProps) {
  const model = useNewProductInlineModel({ movementType, editItem });
  return (
    <>
      <StockMovementReloadGuard />
      <ProductForm {...model} />
    </>
  );
}

export function PageClient(props: NewProductInlineContentProps) {
  return (
    <Suspense fallback={null}>
      <NewProductInlineContent {...props} />
    </Suspense>
  );
}
