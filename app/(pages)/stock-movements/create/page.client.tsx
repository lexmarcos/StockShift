"use client";

import { Suspense } from "react";
import { CreateStockMovementView } from "./create-stock-movement.view";
import { useCreateStockMovementModel } from "./create-stock-movement.model";
import { StockMovementReloadGuard } from "./stock-movement-reload-guard";

interface CreateStockMovementContentProps {
  typeParam: string | null;
}

function CreateStockMovementContent({
  typeParam,
}: CreateStockMovementContentProps) {
  const model = useCreateStockMovementModel({ typeParam });
  return (
    <>
      <StockMovementReloadGuard />
      <CreateStockMovementView {...model} />
    </>
  );
}

export function PageClient({ typeParam }: CreateStockMovementContentProps) {
  return (
    <Suspense fallback={null}>
      <CreateStockMovementContent typeParam={typeParam} />
    </Suspense>
  );
}
