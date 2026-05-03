"use client";

import { Suspense } from "react";
import { CreateStockMovementView } from "./create-stock-movement.view";
import { useCreateStockMovementModel } from "./create-stock-movement.model";
import { StockMovementReloadGuard } from "./stock-movement-reload-guard";

function CreateStockMovementContent() {
  const model = useCreateStockMovementModel();
  return (
    <>
      <StockMovementReloadGuard />
      <CreateStockMovementView {...model} />
    </>
  );
}

export default function CreateStockMovementPage() {
  return (
    <Suspense fallback={null}>
      <CreateStockMovementContent />
    </Suspense>
  );
}
