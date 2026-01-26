"use client";

import { useDashboardModel } from "./dashboard.model";
import { DashboardView } from "./dashboard.view";

export default function DashboardPage() {
  const model = useDashboardModel();

  return <DashboardView {...model} />;
}
