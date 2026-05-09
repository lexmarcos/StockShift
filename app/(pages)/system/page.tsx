import type { Metadata } from "next";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Sistema | StockShift",
  description: "Acesse configurações administrativas do sistema.",
};

export default function Page() {
  return <PageClient />;
}
