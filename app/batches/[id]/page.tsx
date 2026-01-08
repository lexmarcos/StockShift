"use client";

import { useParams } from "next/navigation";
import { useBatchDetailModel } from "./batches-detail.model";
import { BatchesDetailView } from "./batches-detail.view";

export default function BatchDetailPage() {
  const params = useParams();
  const batchId = params.id as string;
  const {
    batch,
    isLoading,
    error,
    onDelete,
    isDeleting,
    isDeleteOpen,
    onDeleteOpenChange,
  } = useBatchDetailModel(batchId);

  return (
    <BatchesDetailView
      batch={batch}
      isLoading={isLoading}
      error={error}
      onDelete={onDelete}
      isDeleting={isDeleting}
      isDeleteOpen={isDeleteOpen}
      onDeleteOpenChange={onDeleteOpenChange}
    />
  );
}
