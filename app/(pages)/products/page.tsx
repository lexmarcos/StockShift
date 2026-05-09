import type { Metadata } from "next";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Produtos | StockShift",
  description: "Gerencie produtos, estoque e cadastro comercial.",
};

export default function Page() {
  return <PageClient />;
}
