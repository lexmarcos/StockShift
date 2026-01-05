"use client";

import { useCategoriesModel } from "./categories.model";
import { CategoriesView } from "./categories.view";

export default function CategoriesPage() {
  const model = useCategoriesModel();

  return <CategoriesView {...model} />;
}
