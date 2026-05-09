import type { Metadata } from "next";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Depósitos | StockShift",
  description: "Gerencie depósitos e locais de estoque.",
};

export default function Page() {
  return <PageClient />;
}
