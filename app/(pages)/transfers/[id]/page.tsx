"use client";

import { useParams } from "next/navigation";
import { TransferDetailView } from "./transfer-detail.view";
import { useTransferDetailModel } from "./transfer-detail.model";

export default function TransferDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const model = useTransferDetailModel(id);

  return <TransferDetailView {...model} />;
}
