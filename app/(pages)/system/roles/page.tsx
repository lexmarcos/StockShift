"use client";

import { useRolesModel } from "./roles.model";
import { RolesView } from "./roles.view";

export default function RolesPage() {
  const model = useRolesModel();

  return <RolesView {...model} />;
}
