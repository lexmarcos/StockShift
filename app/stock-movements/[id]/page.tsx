"use client";

import { useParams } from "next/navigation";
import { useStockMovementDetailModel } from "./stock-movements-detail.model";
import { StockMovementDetailView } from "./stock-movements-detail.view";

export default function StockMovementDetailPage() {
  const params = useParams();
  const movementId = params.id as string;
  const model = useStockMovementDetailModel(movementId);

  return <StockMovementDetailView {...model} />;
}
