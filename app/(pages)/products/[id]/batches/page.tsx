import type { Metadata } from "next";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Lotes do Produto | StockShift",
  description: "Consulte os lotes do produto no armazém selecionado.",
};

export default function Page() {
  return <PageClient />;
}
