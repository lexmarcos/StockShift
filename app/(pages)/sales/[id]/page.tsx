import type { Metadata } from "next";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Detalhe da venda | StockShift",
  description: "Visualize itens e pagamentos de uma venda.",
};

export default function Page(props: { params: Promise<{ id: string }> }) {
  return <PageClient {...props} />;
}
