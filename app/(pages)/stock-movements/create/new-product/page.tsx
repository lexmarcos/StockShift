import type { Metadata } from "next";
import { Suspense } from "react";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "Novo produto da movimentação | StockShift",
  description: "Cadastre produto durante uma movimentação de estoque.",
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
        movementType={firstSearchParam(params.type)}
        editItem={firstSearchParam(params.editItem)}
      />
    </Suspense>
  );
}
