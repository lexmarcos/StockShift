"use client";

import { useSystemModel } from "./system.model";
import { SystemView } from "./system.view";

export function PageClient() {
  const model = useSystemModel();
  return <SystemView {...model} />;
}
