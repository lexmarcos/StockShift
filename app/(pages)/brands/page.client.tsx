"use client";

import { useBrandsModel } from "./brands.model";
import { BrandsView } from "./brands.view";

export function PageClient() {
  const model = useBrandsModel();

  return <BrandsView {...model} />;
}
