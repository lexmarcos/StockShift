"use client";

import { NewTransferView } from "./new-transfer.view";
import { useNewTransferModel } from "./new-transfer.model";

export default function NewTransferPage() {
  const model = useNewTransferModel();
  return <NewTransferView {...model} />;
}
