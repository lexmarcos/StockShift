import type { Metadata } from "next";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Novo lote | StockShift",
  description: "Cadastre um novo lote de produto.",
};

export default function Page() {
  return <PageClient />;
}
