"use client";

import { LoadingState } from "@/components/ui/loading-state";
import { HomeViewProps } from "./home.types";

export function HomeView({ redirectMessage }: HomeViewProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4">
      <LoadingState message={redirectMessage} />
    </main>
  );
}
