import type { Metadata } from "next";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Detalhe da movimentação | StockShift",
  description: "Visualize dados completos de uma movimentação de estoque.",
};

export default function Page() {
  return <PageClient />;
}
