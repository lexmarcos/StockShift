"use client";

import { useStockMovementCreateModel } from "./stock-movements-create.model";
import { StockMovementCreateView } from "./stock-movements-create.view";

export default function StockMovementCreatePage() {
  const model = useStockMovementCreateModel();
  return <StockMovementCreateView {...model} />;
}
