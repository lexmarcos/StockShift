"use client";

import { useSalesModel } from "./sales.model";
import { SalesView } from "./sales.view";

export default function SalesPage() {
  const model = useSalesModel();
  return <SalesView {...model} />;
}
