"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, Building2, Loader2, Package2, Warehouse, User, LogOut } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { useMobileMenu } from "@/components/layout/mobile-menu-context";
import { Header } from "@/components/header/header";
import { BreadcrumbProvider, Breadcrumb } from "@/components/breadcrumb";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import { useAuth } from "@/lib/contexts/auth-context";
import { useWarehouse } from "@/lib/contexts/warehouse-context";
import { api } from "@/lib/api";
import useSWR from "swr";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type WarehouseData = {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
};

const warehouseFetcher = async () => {
  const response = await api.get("warehouses").json<{
    success: boolean;
    data: WarehouseData[];
  }>();
  return response.data;
};

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen, closeMenu } = useMobileMenu();
  const { warehouseId } = useSelectedWarehouse();
  const { user, logout } = useAuth();
  const { selectedWarehouseId, setSelectedWarehouseId } = useWarehouse();
  const router = useRouter();

  const { data: warehouses = [] } = useSWR<WarehouseData[]>(
    isOpen ? "mobile-warehouses" : null,
    warehouseFetcher,
    { revalidateOnFocus: false }
  );

  const activeWarehouses = warehouses.filter((w) => w.isActive);

  useEffect(() => {
    if (user?.mustChangePassword) {
      router.replace("/change-password");
      return;
    }

    if (warehouseId === null) {
      router.replace("/warehouses");
    }
  }, [warehouseId, user, router]);

  const handleWarehouseChange = async (id: string) => {
    try {
      await api
        .post("auth/switch-warehouse", { json: { warehouseId: id } })
        .json<{ success: boolean; message: string }>();
      setSelectedWarehouseId(id);
    } catch {
      // silently ignore
    }
  };

  const handleLogout = async () => {
    closeMenu();
    await logout();
  };

  // Show loading while checking warehouse
  if (warehouseId === null) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-[4px] bg-blue-600/10 border border-blue-900/50">
          <Building2 className="h-8 w-8 text-blue-500" />
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          <span className="text-sm text-neutral-400">
            Redirecionando para seleção de armazém...
          </span>
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
            {/* Logo + close button */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-blue-600 shadow-[0_0_15px_-3px_rgba(37,99,235,0.4)]">
                  <Package2 className="h-4 w-4 text-white" strokeWidth={2.5} />
                </div>
                <h1 className="text-sm font-bold uppercase tracking-tight text-white">
                  Stockshift
                </h1>
              </div>
              <button
                type="button"
                onClick={closeMenu}
                className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-border/60 bg-foreground/5 text-foreground"
                aria-label="Fechar menu"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Warehouse selector */}
            <div className="mb-4">
              <Select
                value={selectedWarehouseId || ""}
                onValueChange={handleWarehouseChange}
                disabled={activeWarehouses.length === 0}
              >
                <SelectTrigger className="!h-9 w-full rounded-[4px] border-neutral-800 bg-neutral-900 text-xs font-medium uppercase tracking-wide text-neutral-300 focus:border-blue-600 focus:ring-0 hover:border-neutral-700">
                  <div className="flex items-center gap-2">
                    <Warehouse className="h-4 w-4 text-neutral-500" />
                    <SelectValue placeholder="Armazém" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-[4px] border border-neutral-800 bg-[#171717]">
                  {activeWarehouses.map((warehouse) => (
                    <SelectItem
                      key={warehouse.id}
                      value={warehouse.id}
                      className="text-xs uppercase focus:bg-neutral-800"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-white">{warehouse.name}</span>
                        <span className="text-[10px] text-neutral-500">{warehouse.code}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
              Navegação
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto">
              <AppSidebar onNavigate={closeMenu} />
            </div>

            {/* Profile section at bottom */}
            <div className="pt-4 mt-4 border-t border-border/40">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70 hover:bg-foreground/5 hover:text-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span className="truncate">{user?.fullName || "Perfil"}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="min-w-[200px] rounded-[4px] border border-neutral-800 bg-[#171717]"
                >
                  {user && (
                    <>
                      <div className="border-b border-neutral-800 p-3">
                        <p className="text-sm font-bold text-white">{user.fullName}</p>
                        <p className="text-xs text-neutral-500">{user.email}</p>
                      </div>
                      <DropdownMenuSeparator className="bg-neutral-800" />
                    </>
                  )}

                  <DropdownMenuItem asChild className="text-xs uppercase tracking-wide focus:bg-neutral-800">
                    <Link href="/profile" onClick={closeMenu} className="flex cursor-pointer items-center gap-2 text-neutral-300">
                      <User className="h-4 w-4" />
                      Perfil
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-neutral-800" />

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-xs uppercase tracking-wide text-rose-500 focus:bg-rose-950/50 focus:text-rose-500"
                  >
                    <div className="flex items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      Logout
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
