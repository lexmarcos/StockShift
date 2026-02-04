"use client";

import { useValidateTransferModel } from "./validate-transfer.model";
import { ValidateTransferView } from "./validate-transfer.view";

export default function ValidateTransferPage() {
  const model = useValidateTransferModel();
  return <ValidateTransferView {...model} />;
}
