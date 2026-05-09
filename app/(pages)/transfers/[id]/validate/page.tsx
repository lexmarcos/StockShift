import type { Metadata } from "next";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Validar transferência | StockShift",
  description: "Valide itens recebidos em uma transferência.",
};

export default function Page() {
  return <PageClient />;
}
