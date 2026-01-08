"use client";

import { useBatchesModel } from "./batches.model";
import { BatchesView } from "./batches.view";

export default function BatchesPage() {
  const model = useBatchesModel();
  return <BatchesView {...model} />;
}
