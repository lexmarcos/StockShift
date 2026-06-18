import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Testes Exploratórios | StockShift",
  description: "Checklist de testes exploratórios da branch indexdb.",
};

export default function Page() {
  // The exploratory tests page is a development-only tool and must not be
  // reachable in production builds.
  if (process.env.NODE_ENV !== "development") notFound();

  return <PageClient />;
}
