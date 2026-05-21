"use client";

import { useParams } from "next/navigation";
import { useStockMovementDetailModel } from "./stock-movements-detail.model";
import { StockMovementsDetailView } from "./stock-movements-detail.view";

export function PageClient() {
  const params = useParams();
  const movementId = params.id as string;
  const model = useStockMovementDetailModel(movementId);

  return <StockMovementsDetailView {...model} />;
}
