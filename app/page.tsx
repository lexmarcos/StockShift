import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "StockShift",
  description: "Gestão de estoque, vendas e transferências.",
};

export default function HomePage(): never {
  redirect("/dashboard");
}
