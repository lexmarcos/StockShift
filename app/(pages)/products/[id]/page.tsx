"use client";

import { useParams } from "next/navigation";
import { useProductDetailModel } from "./products-detail.model";
import { ProductDetailView } from "./products-detail.view";

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;

  const { product, batches, isLoading, isLoadingBatches, error, batchesError } =
    useProductDetailModel(productId);

  return (
    <ProductDetailView
      product={product}
      batches={batches}
      isLoading={isLoading}
      isLoadingBatches={isLoadingBatches}
      error={error}
      batchesError={batchesError}
    />
  );
}
