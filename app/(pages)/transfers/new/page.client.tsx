"use client";

import { NewTransferView } from "./new-transfer.view";
import { useNewTransferModel } from "./new-transfer.model";

export function PageClient() {
  const model = useNewTransferModel();
  return <NewTransferView {...model} />;
}
