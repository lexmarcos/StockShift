"use client";

import { useSystemModel } from "./system.model";
import { SystemView } from "./system.view";

export default function SystemPage() {
  const model = useSystemModel();

  return <SystemView {...model} />;
}
