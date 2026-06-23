"use client";

import { useParams } from "next/navigation";
import { useProductBatchesModel } from "./product-batches.model";
import { ProductBatchesView } from "./product-batches.view";

export function PageClient() {
  const params = useParams();
  const productId = params.id as string;
  const model = useProductBatchesModel(productId);

  return <ProductBatchesView {...model} />;
}
