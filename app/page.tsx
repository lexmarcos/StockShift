import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resolveHomeServerRedirectPath } from "./home.model";
import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "StockShift",
  description: "Gestão de estoque, vendas e transferências.",
};

export default async function HomePage() {
  const cookieStore = await cookies();
  const serverRedirectPath = resolveHomeServerRedirectPath({
    accessToken: cookieStore.get("accessToken")?.value,
    refreshToken: cookieStore.get("refreshToken")?.value,
  });

  if (serverRedirectPath) {
    redirect(serverRedirectPath);
  }

  return <PageClient />;
}
