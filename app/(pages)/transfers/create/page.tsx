"use client";

import { useCreateTransferModel } from "./create-transfer.model";
import { CreateTransferView } from "./create-transfer.view";

export default function CreateTransferPage() {
  const model = useCreateTransferModel();
  return <CreateTransferView {...model} />;
}
