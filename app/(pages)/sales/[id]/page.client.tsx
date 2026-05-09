"use client";

import { use } from "react";
import { useSaleDetailModel } from "./sales-detail.model";
import { SaleDetailView } from "./sales-detail.view";

export function PageClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const model = useSaleDetailModel(id);
  return <SaleDetailView {...model} />;
}
