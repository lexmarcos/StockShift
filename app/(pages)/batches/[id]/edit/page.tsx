import type { Metadata } from "next";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Editar lote | StockShift",
  description: "Atualize os dados de um lote existente.",
};

export default function Page() {
  return <PageClient />;
}
