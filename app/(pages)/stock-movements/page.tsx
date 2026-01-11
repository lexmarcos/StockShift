"use client";

import { useStockMovementsModel } from "./stock-movements.model";
import { StockMovementsView } from "./stock-movements.view";

export default function StockMovementsPage() {
  const model = useStockMovementsModel();
  return <StockMovementsView {...model} />;
}
