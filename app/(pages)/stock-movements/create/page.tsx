import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PageClient } from "./page.client";
import { isManualMovementType } from "../stock-movements.constants";

export const metadata: Metadata = {
  title: "Nova movimentação | StockShift",
  description: "Registre uma entrada ou saída manual de estoque.",
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
  const typeParam = firstSearchParam(params.type);
  if (!isManualMovementType(typeParam)) {
    redirect("/stock-movements");
  }

  return (
    <Suspense fallback={null}>
      <PageClient typeParam={typeParam} />
    </Suspense>
  );
}
