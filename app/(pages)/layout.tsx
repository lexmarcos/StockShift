"use client";

import { X } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { useMobileMenu } from "@/components/layout/mobile-menu-context";
import { Header } from "@/components/header/header";

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen, closeMenu } = useMobileMenu();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-60 flex-col border-r border-border/40 bg-card/80 p-4 md:flex fixed">
          <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
            Navegação
          </div>
          <AppSidebar />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col md:ml-[var(--sidebar-width)]"><Header />{children}</div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={closeMenu} />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-border/40 bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
                Navegação
              </span>
              <button
                type="button"
                onClick={closeMenu}
                className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-border/60 bg-foreground/5 text-foreground"
                aria-label="Fechar menu"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <AppSidebar onNavigate={closeMenu} />
          </div>
        </div>
      )}
    </div>
  );
}
