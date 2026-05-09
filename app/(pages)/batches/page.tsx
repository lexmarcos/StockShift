import type { Metadata } from "next";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Lotes | StockShift",
  description: "Consulte e filtre lotes por produto, validade e estoque.",
};

export default function Page() {
  return <PageClient />;
}
