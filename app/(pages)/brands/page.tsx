import type { Metadata } from "next";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Marcas | StockShift",
  description: "Gerencie marcas de produtos.",
};

export default function Page() {
  return <PageClient />;
}
