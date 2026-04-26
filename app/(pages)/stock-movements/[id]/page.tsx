"use client";

import { useParams } from "next/navigation";
import { useStockMovementDetailModel } from "./stock-movements-detail.model";
import { StockMovementDetailView } from "./stock-movements-detail.view";

export default function StockMovementDetailPage() {
  const params = useParams();
  const movementId = params.id as string;
  const { movement, batchPrices, isLoading, error } =
    useStockMovementDetailModel(movementId);

  return (
    <StockMovementDetailView
      movement={movement}
      batchPrices={batchPrices}
      isLoading={isLoading}
      error={error}
    />
  );
}
