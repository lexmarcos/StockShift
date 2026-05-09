import type { Metadata } from "next";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Novo produto | StockShift",
  description: "Cadastre um novo produto no estoque.",
};

export default function Page() {
  return <PageClient />;
}
