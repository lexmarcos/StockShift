"use client";

import { useHomeModel } from "./home.client.model";
import { HomeView } from "./home.view";

export function PageClient() {
  const model = useHomeModel();

  return <HomeView {...model} />;
}
