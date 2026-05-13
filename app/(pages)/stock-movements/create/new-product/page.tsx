import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PageClient } from "./page.client";
import { isManualMovementType } from "../../stock-movements.constants";

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
  const movementType = firstSearchParam(params.type);
  if (!isManualMovementType(movementType)) {
    redirect("/stock-movements");
  }

  return (
    <Suspense fallback={null}>
      <PageClient
        movementType={movementType}
        editItem={firstSearchParam(params.editItem)}
      />
    </Suspense>
  );
}
