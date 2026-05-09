"use client";

import { useSalesModel } from "./sales.model";
import { SalesView } from "./sales.view";

export function PageClient() {
  const model = useSalesModel();
  return <SalesView {...model} />;
}
