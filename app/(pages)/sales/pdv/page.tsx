import type { Metadata } from "next";
import { Suspense } from "react";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "PDV | StockShift",
  description: "Registre vendas no ponto de venda.",
};

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

const firstSearchParam = (
  value: string | string[] | undefined,
): string | null => {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
};

export default async function Page({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const params = await searchParams;
  return (
    <Suspense fallback={null}>
      <PageClient
        infinitepayStatus={firstSearchParam(params.infinitepay)}
        infinitepayMessage={firstSearchParam(params.message)}
      />
    </Suspense>
  );
}
