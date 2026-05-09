"use client";

import { useParams } from "next/navigation";
import { useBatchEditModel } from "./batches-edit.model";
import { BatchEditView } from "./batches-edit.view";

export function PageClient() {
  const params = useParams();
  const batchId = params.id as string;
  const { form, onSubmit, batch, isLoading } = useBatchEditModel(batchId);

  return (
    <BatchEditView
      form={form}
      onSubmit={onSubmit}
      batch={batch}
      isLoading={isLoading}
    />
  );
}
