"use client";

import { useParams } from "next/navigation";
import { useBatchEditModel } from "./batches-edit.model";
import { BatchEditView } from "./batches-edit.view";

export default function BatchEditPage() {
  const params = useParams();
  const batchId = params.id as string;
  const { form, onSubmit, isLoading } = useBatchEditModel(batchId);

  return <BatchEditView form={form} onSubmit={onSubmit} isLoading={isLoading} />;
}
