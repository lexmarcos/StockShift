"use client";

import { useTransfersModel } from "./transfers.model";
import { TransfersView } from "./transfers.view";

export default function TransfersPage() {
  const model = useTransfersModel();

  return <TransfersView {...model} />;
}
