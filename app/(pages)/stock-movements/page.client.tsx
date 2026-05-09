"use client";

import { useStockMovementsModel } from "./stock-movements.model";
import { StockMovementsView } from "./stock-movements.view";

export function PageClient() {
  const model = useStockMovementsModel();

  return <StockMovementsView {...model} />;
}
