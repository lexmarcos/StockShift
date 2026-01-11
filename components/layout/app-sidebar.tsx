"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  Layers,
  Tag,
  Folder,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  Icon: typeof Package;
};

const navItems: NavItem[] = [
  { href: "/products", label: "Produtos", Icon: Package },
  { href: "/batches", label: "Batches", Icon: Layers },
  { href: "/brands", label: "Marcas", Icon: Tag },
  { href: "/categories", label: "Categorias", Icon: Folder },
  { href: "/stock-movements", label: "Movimentações", Icon: ArrowLeftRight },
];

export const AppSidebar = ({ onNavigate }: { onNavigate?: () => void }) => {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {navItems.map((item) => {
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
              isActive &&
                "border-border/60 bg-foreground/10 text-foreground"
            )}
          >
            <item.Icon className="h-3.5 w-3.5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
