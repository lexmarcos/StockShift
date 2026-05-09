import type { Metadata } from "next";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Perfis de acesso | StockShift",
  description: "Gerencie perfis e permissões do sistema.",
};

export default function Page() {
  return <PageClient />;
}
