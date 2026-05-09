"use client";

import { useBatchesModel } from "./batches.model";
import { BatchesView } from "./batches.view";

export function PageClient() {
  const model = useBatchesModel();
  return <BatchesView {...model} />;
}
