import type { Metadata } from "next";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Login | StockShift",
  description: "Entre no StockShift com suas credenciais.",
};

export default function Page() {
  return <PageClient />;
}
