"use client";

import { useWarehousesModel } from "./warehouses.model";
import { WarehousesView } from "./warehouses.view";

export default function WarehousesPage() {
  const model = useWarehousesModel();

  return <WarehousesView {...model} />;
}
