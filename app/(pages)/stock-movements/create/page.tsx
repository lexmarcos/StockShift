"use client";

import { Suspense } from "react";
import { CreateStockMovementView } from "./create-stock-movement.view";
import { useCreateStockMovementModel } from "./create-stock-movement.model";

function CreateStockMovementContent() {
  const model = useCreateStockMovementModel();
  return <CreateStockMovementView {...model} />;
}

export default function CreateStockMovementPage() {
  return (
    <Suspense fallback={null}>
      <CreateStockMovementContent />
    </Suspense>
  );
}
