import type { Metadata } from "next";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Movimentações | StockShift",
  description: "Consulte entradas e saídas de estoque.",
};

export default function Page() {
  return <PageClient />;
}
