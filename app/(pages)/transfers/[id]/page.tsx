import type { Metadata } from "next";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Detalhe da transferência | StockShift",
  description: "Visualize dados e status de uma transferência.",
};

export default function Page() {
  return <PageClient />;
}
