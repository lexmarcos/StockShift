"use client";

import { CreateStockMovementView } from "./create-stock-movement.view";
import { useCreateStockMovementModel } from "./create-stock-movement.model";

export default function CreateStockMovementPage() {
  const model = useCreateStockMovementModel();
  return <CreateStockMovementView {...model} />;
}
