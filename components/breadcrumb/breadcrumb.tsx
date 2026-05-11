"use client";

import { useBreadcrumbContext } from "./breadcrumb-context";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function Breadcrumb() {
  const { breadcrumb } = useBreadcrumbContext();
  const { back } = useRouter();

  if (!breadcrumb) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="border-b border-neutral-800 bg-[#0A0A0A]"
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            aria-label="Voltar"
            onClick={back}
            variant="ghost"
            size="icon"
            className="size-9 rounded-[4px] border border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                {breadcrumb.section}
              </span>
              <span className="text-[10px] text-neutral-700">/</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">
                {breadcrumb.subsection}
              </span>
            </div>
            <h1 className="mt-0.5 text-sm font-semibold uppercase tracking-wide text-white">
              {breadcrumb.title}
            </h1>
          </div>
        </div>
      </div>
    </nav>
  );
}
