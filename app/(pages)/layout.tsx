"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Building2, Loader2 } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { useMobileMenu } from "@/components/layout/mobile-menu-context";
import { Header } from "@/components/header/header";
import { BreadcrumbProvider, Breadcrumb } from "@/components/breadcrumb";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen, closeMenu } = useMobileMenu();
  const { warehouseId } = useSelectedWarehouse();
  const router = useRouter();

  useEffect(() => {
    if (warehouseId === null) {
      router.replace("/warehouses");
    }
  }, [warehouseId, router]);

  // Show loading while checking warehouse
  if (warehouseId === null) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-[4px] bg-blue-600/10 border border-blue-900/50">
          <Building2 className="h-8 w-8 text-blue-500" />
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          <span className="text-sm text-neutral-400">Redirecionando para seleção de armazém...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-60 flex-col border-r border-border/40 bg-card/80 p-4 md:flex fixed h-svh">
          <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
            Navegação
          </div>
          <AppSidebar />
        </aside>

        <BreadcrumbProvider>
          <div className="flex min-w-0 flex-1 flex-col md:ml-[var(--sidebar-width)]">
            <Header />
            <Breadcrumb />
            {children}
          </div>
        </BreadcrumbProvider>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={closeMenu} />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-border/40 bg-card p-4 flex flex-col">
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
