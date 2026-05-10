import type { Metadata } from "next";
import { Suspense } from "react";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Callback InfinitePay | StockShift",
  description: "Processa o retorno de pagamento InfinitePay.",
};

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

const buildQueryString = (
  params: Record<string, string | string[] | undefined>,
): string => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
      return;
    }
    if (value) query.set(key, value);
  });
  return query.toString();
};

export default async function Page({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const callbackQueryString = buildQueryString(await searchParams);
  return (
    <Suspense fallback={null}>
      <PageClient callbackQueryString={callbackQueryString} />
    </Suspense>
  );
}
