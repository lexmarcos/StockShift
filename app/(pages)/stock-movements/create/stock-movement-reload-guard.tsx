"use client";

import { useStockMovementReloadGuardModel } from "./stock-movement-reload-guard.model";
import type {
  StockMovementReloadGuardProps,
} from "./stock-movement-reload-guard.types";
import { StockMovementReloadGuardView } from "./stock-movement-reload-guard.view";

export function StockMovementReloadGuard({
  isEnabled = true,
}: StockMovementReloadGuardProps) {
  const model = useStockMovementReloadGuardModel({ isEnabled });
  return <StockMovementReloadGuardView {...model} />;
}
