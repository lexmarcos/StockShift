"use client";

import { useParams } from "next/navigation";
import { useBatchDetailModel } from "./batches-detail.model";
import { BatchesDetailView } from "./batches-detail.view";

export function PageClient() {
  const params = useParams();
  const batchId = params.id as string;
  const model = useBatchDetailModel(batchId);

  return (
    <BatchesDetailView
      batch={model.batch}
      isLoading={model.isLoading}
      error={model.error}
      status={model.status}
      daysToExpire={model.daysToExpire}
      formattedCostPrice={model.formattedCostPrice}
      formattedSellingPrice={model.formattedSellingPrice}
      formattedCostTotal={model.formattedCostTotal}
      formattedSellingTotal={model.formattedSellingTotal}
      marginLabel={model.marginLabel}
      marginClass={model.marginClass}
      expirationLabel={model.expirationLabel}
      isDeleteOpen={model.isDeleteOpen}
      onDeleteOpenChange={model.onDeleteOpenChange}
      isDeleting={model.isDeleting}
      onDelete={model.onDelete}
    />
  );
}
