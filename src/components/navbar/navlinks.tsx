"use client";

import { cn } from "@/lib/utils";
import {
  Home,
  LineChart, Package, ShoppingCart,
  Users
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "../ui/badge";

export default function NavLinks() {
  const pathname = usePathname();

  const isRouteActive = (routeToCheck: string) => {
    return pathname.includes(routeToCheck);
  };

  const generateClassNamesOfActiveRoute = (routeToCheck: string) => {
    const activeRoute = isRouteActive(routeToCheck);
    return cn([
      "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
      {
        "text-primary": activeRoute,
        "bg-muted": activeRoute,
        "text-muted-foreground": !activeRoute,
      },
    ]);
  };

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      <Link href="/dashboard" className={generateClassNamesOfActiveRoute("/dashboard")}>
        <Home className="h-4 w-4" />
        Dashboard
      </Link>
      <Link href="#" className={generateClassNamesOfActiveRoute("/orders")}>
        <ShoppingCart className="h-4 w-4" />
        Pedidos
        <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
          6
        </Badge>
      </Link>
      <Link href="/products" className={generateClassNamesOfActiveRoute("/products")}>
        <Package className="h-4 w-4" />
        Produtos{" "}
      </Link>
      <Link href="#" className={generateClassNamesOfActiveRoute("/customers")}>
        <Users className="h-4 w-4" />
        Clientes
      </Link>
      <Link href="#" className={generateClassNamesOfActiveRoute("/analytics")}>
        <LineChart className="h-4 w-4" />
        Analytics
      </Link>
    </nav>
  );
}
