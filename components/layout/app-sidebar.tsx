"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  Layers,
  Tag,
  Folder,
  ArrowLeftRight,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/contexts/auth-context";

type NavItem = {
  href: string;
  label: string;
  Icon: typeof Package;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/products", label: "Produtos", Icon: Package },
  { href: "/batches", label: "Batches", Icon: Layers },
  { href: "/brands", label: "Marcas", Icon: Tag },
  { href: "/categories", label: "Categorias", Icon: Folder },
  { href: "/stock-movements", label: "Movimentações", Icon: ArrowLeftRight },
];

export const AppSidebar = ({ onNavigate }: { onNavigate?: () => void }) => {
  const pathname = usePathname();
  const { isAdmin, isLoading } = useAuth();

  const renderNavLink = (item: NavItem) => {
    const isActive =
      pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex items-center gap-2 rounded-sm px-3 py-2 text-xs font-semibold uppercase tracking-wide",
          "border border-transparent text-muted-foreground/70 hover:bg-foreground/5 hover:text-foreground",
          isActive && "border-border/60 bg-foreground/10 text-foreground",
        )}
      >
        <item.Icon className="h-3.5 w-3.5" />
        <span>{item.label}</span>
      </Link>
    );
  };

  const isSystemActive =
    pathname === "/system" || pathname.startsWith("/system/");

  return (
    <nav className="flex flex-col flex-1">
      {/* Main navigation */}
      <div className="space-y-2 flex-1">{navItems.map(renderNavLink)}</div>

      {/* Admin section - bottom */}
      {(isLoading || isAdmin) && (
        <div className="pt-4 mt-4 border-t border-border/40">
          <Link
            href="/system"
            onClick={onNavigate}
            aria-current={isSystemActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-sm px-3 py-2 text-xs font-semibold uppercase tracking-wide",
              "border border-transparent text-muted-foreground/70 hover:bg-foreground/5 hover:text-foreground",
              isSystemActive &&
                "border-border/60 bg-foreground/10 text-foreground",
            )}
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Gerenciamento do sistema</span>
          </Link>
        </div>
      )}
    </nav>
  );
};
