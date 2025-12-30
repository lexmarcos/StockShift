"use client";

import { useBrandsModel } from "./brands.model";
import { BrandsView } from "./brands.view";

export default function BrandsPage() {
  const model = useBrandsModel();

  return <BrandsView {...model} />;
}
