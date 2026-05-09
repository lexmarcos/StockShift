import type { Metadata } from "next";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Empresa | StockShift",
  description: "Configure dados da empresa e integrações de pagamento.",
};

export default function Page() {
  return <PageClient />;
}
