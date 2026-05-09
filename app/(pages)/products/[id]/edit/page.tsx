import type { Metadata } from "next";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Editar produto | StockShift",
  description: "Atualize os dados cadastrais de um produto.",
};

export default function Page() {
  return <PageClient />;
}
