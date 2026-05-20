import type { Metadata } from "next";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Artes com IA | StockShift",
  description: "Crie prompts e gere imagens de produto com preço.",
};

export default function Page() {
  return <PageClient />;
}
