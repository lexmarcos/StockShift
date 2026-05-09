import type { Metadata } from "next";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Usuários | StockShift",
  description: "Gerencie usuários e permissões de acesso.",
};

export default function Page() {
  return <PageClient />;
}
