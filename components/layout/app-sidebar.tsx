"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  Layers,
  Tag,
  Folder,
  LayoutDashboard,
  Settings,
  ArrowLeftRight,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/contexts/auth-context";

type NavItem = {
  href: string;
  label: string;
  Icon: typeof Package;
  requiredPermission?: string;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard, adminOnly: true },
  {
    href: "/products",
    label: "Produtos",
    Icon: Package,
    requiredPermission: "products:read",
  },
  {
    href: "/batches",
    label: "Lotes",
    Icon: Layers,
    requiredPermission: "batches:read",
  },
  {
    href: "/stock-movements",
    label: "Movimentações",
    Icon: Activity,
    requiredPermission: "stock_movements:read",
  },
  {
    href: "/transfers",
    label: "Transferências",
    Icon: ArrowLeftRight,
    requiredPermission: "transfers:read",
  },
  {
    href: "/brands",
    label: "Marcas",
    Icon: Tag,
    requiredPermission: "brands:read",
  },
  {
    href: "/categories",
    label: "Categorias",
    Icon: Folder,
    requiredPermission: "categories:read",
  },
];

export const AppSidebar = ({ onNavigate }: { onNavigate?: () => void }) => {
  const pathname = usePathname();
  const { isAdmin, hasPermission } = useAuth();

  const visibleNavItems = navItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (!item.requiredPermission) return true;
    return hasPermission(item.requiredPermission);
  });

  const canAccessSystem =
    isAdmin ||
    hasPermission("users:read") ||
    hasPermission("roles:read") ||
    hasPermission("permissions:read");

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
      <div className="space-y-2 flex-1">{visibleNavItems.map(renderNavLink)}</div>

      {/* System section - bottom */}
      {canAccessSystem && (
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
