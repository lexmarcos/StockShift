import type { Metadata } from "next";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Gerar imagem | StockShift",
  description: "Configure preço, oferta, parcelamento e posição da arte.",
};

export default function Page() {
  return <PageClient />;
}
