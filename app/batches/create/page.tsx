"use client";

import { useBatchCreateModel } from "./batches-create.model";
import { BatchCreateView } from "./batches-create.view";

export default function BatchCreatePage() {
  const model = useBatchCreateModel();
  return <BatchCreateView {...model} />;
}
