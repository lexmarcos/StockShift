"use client";

import { useBatchCreateModel } from "./batches-create.model";
import { BatchCreateView } from "./batches-create.view";

export function PageClient() {
  const model = useBatchCreateModel();
  return <BatchCreateView {...model} />;
}
