"use client";

import { useExploratoryTestsModel } from "./exploratory-tests.model";
import { ExploratoryTestsView } from "./exploratory-tests.view";

export function PageClient() {
  const model = useExploratoryTestsModel();
  return <ExploratoryTestsView {...model} />;
}
