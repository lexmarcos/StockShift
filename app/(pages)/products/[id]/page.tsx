import type { Metadata } from "next";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Detalhe do produto | StockShift",
  description: "Visualize estoque, lotes e dados do produto.",
};

export default function Page() {
  return <PageClient />;
}
