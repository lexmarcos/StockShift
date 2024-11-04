import {
  Badge,
  Home,
  LineChart,
  Menu,
  Package,
  Package2,
  ShoppingCart,
  Users,
} from "lucide-react";
import { Button } from "../ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "../ui/sheet";
import NavLinks from "./navlinks";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
export default function NavbarMobile() {
  const pathname = usePathname();

  const isRouteActive = (routeToCheck: string) => {
    return pathname.includes(routeToCheck);
  };

  const generateClassNamesOfActiveRoute = (routeToCheck: string) => {
    const activeRoute = isRouteActive(routeToCheck);
    return cn([
      "flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
      {
        "text-primary": activeRoute,
        "bg-muted": activeRoute,
        "text-muted-foreground": !activeRoute,
      },
    ]);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0 md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col">
        <Link
          href="#"
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <Package2 className="h-6 w-6" />
          <span className="">StockShift</span>
        </Link>
        <nav className="grid items-start text-sm font-medium lg:px-4">
          <Link href="/dashboard">
            <SheetClose
              className={generateClassNamesOfActiveRoute("/dashboard")}
            >
              <Home className="h-4 w-4" />
              Dashboard
            </SheetClose>
          </Link>
          {/* <Link href="#">
            <SheetClose className={generateClassNamesOfActiveRoute("/orders")}>
              <ShoppingCart className="h-4 w-4" />
              Pedidos
            </SheetClose>
          </Link> */}
          <Link href="/products">
            <SheetClose
              className={generateClassNamesOfActiveRoute("/products")}
            >
              <Package className="h-4 w-4" />
              Produtos
            </SheetClose>
          </Link>
          {/* <Link href="#" className={generateClassNamesOfActiveRoute("/customers")}>
            <Users className="h-4 w-4" />
            Clientes
          </Link>
          <Link href="#" className={generateClassNamesOfActiveRoute("/analytics")}>
            <LineChart className="h-4 w-4" />
            Analytics
          </Link> */}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
