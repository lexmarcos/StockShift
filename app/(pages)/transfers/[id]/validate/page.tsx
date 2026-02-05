"use client";

import React from "react";
import { useParams } from "next/navigation";
import { ValidateTransferView } from "./validate-transfer.view";
import { useValidateTransferModel } from "./validate-transfer.model";

export default function ValidateTransferPage() {
  const params = useParams();
  const id = params?.id as string;
  
  const model = useValidateTransferModel(id);

  return <ValidateTransferView {...model} />;
}
