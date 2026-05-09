import type { Metadata } from "next";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Cadastro | StockShift",
  description: "Crie uma conta para acessar o StockShift.",
};

export default function Page() {
  return <PageClient />;
}
