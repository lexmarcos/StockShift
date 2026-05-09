import type { Metadata } from "next";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Vendas | StockShift",
  description: "Acompanhe vendas e indicadores comerciais.",
};

export default function Page() {
  return <PageClient />;
}
