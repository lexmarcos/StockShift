import type { Metadata } from "next";
import { Suspense } from "react";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Resultado InfinitePay | StockShift",
  description: "Confira o resultado do pagamento InfinitePay.",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PageClient />
    </Suspense>
  );
}
