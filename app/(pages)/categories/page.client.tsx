"use client";

import { useCategoriesModel } from "./categories.model";
import { CategoriesView } from "./categories.view";

export function PageClient() {
  const model = useCategoriesModel();

  return <CategoriesView {...model} />;
}
