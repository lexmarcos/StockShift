"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-60 flex-col border-r border-border/40 bg-card/80 p-4 md:flex">
          <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
            Navegação
          </div>
          <AppSidebar />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="sticky top-0 z-30 border-b border-border/40 bg-card/95 md:hidden">
            <div className="mx-auto flex h-12 w-full max-w-7xl items-center px-4">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="inline-flex items-center gap-2 rounded-sm border border-border/60 bg-foreground/5 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-foreground"
                aria-label="Abrir menu"
              >
                <Menu className="h-4 w-4" />
                Menu
              </button>
            </div>
          </div>

          {children}
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-border/40 bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
                Navegação
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-border/60 bg-foreground/5 text-foreground"
                aria-label="Fechar menu"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <AppSidebar onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
