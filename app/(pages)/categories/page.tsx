import type { Metadata } from "next";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Categorias | StockShift",
  description: "Gerencie categorias de produtos.",
};

export default function Page() {
  return <PageClient />;
}
