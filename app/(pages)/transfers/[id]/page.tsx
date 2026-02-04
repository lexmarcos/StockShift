"use client";

import { useTransferDetailModel } from "./transfer-detail.model";
import { TransferDetailView } from "./transfer-detail.view";

export default function TransferDetailPage() {
  const model = useTransferDetailModel();
  return <TransferDetailView {...model} />;
}
