import type { Metadata } from "next";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Nova transferência | StockShift",
  description: "Crie uma transferência entre depósitos.",
};

export default function Page() {
  return <PageClient />;
}
