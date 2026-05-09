import type { Metadata } from "next";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Detalhe do lote | StockShift",
  description: "Visualize dados completos de um lote.",
};

export default function Page() {
  return <PageClient />;
}
