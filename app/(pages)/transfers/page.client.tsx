"use client";

import { useTransfersModel } from "./transfers.model";
import { TransfersView } from "./transfers.view";

export function PageClient() {
  const model = useTransfersModel();

  return <TransfersView {...model} />;
}
