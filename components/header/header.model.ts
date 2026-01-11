"use client";

import { usePathname } from "next/navigation";
import useSWR from "swr";
import { useAuth } from "@/lib/contexts/auth-context";
import { useWarehouse } from "@/lib/contexts/warehouse-context";
import { api } from "@/lib/api";
import { useMobileMenu } from "@/components/layout/mobile-menu-context";
import { Warehouse, HeaderViewProps } from "./header.types";

const PAGE_NAMES: Record<string, string> = {
  "/": "Dashboard",
  "/products": "Produtos",
  "/products/create": "Novo Produto",
  "/batches": "Lotes",
  "/batches/create": "Novo Lote",
  "/warehouses": "Armazéns",
  "/categories": "Categorias",
  "/brands": "Marcas",
  "/stock-movements": "Movimentações",
  "/stock-movements/create": "Nova Movimentação",
  "/profile": "Perfil",
};

const fetcher = async () => {
  const response = await api.get("warehouses").json<{
    success: boolean;
    data: Warehouse[];
  }>();
  return response.data;
};

export const useHeaderModel = (): HeaderViewProps => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { selectedWarehouseId, setSelectedWarehouseId } = useWarehouse();
  const { toggleMenu } = useMobileMenu();

  const { data: warehouses = [], isLoading: isLoadingWarehouses } = useSWR<Warehouse[]>(
    "header-warehouses",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const activeWarehouses = warehouses.filter((w) => w.isActive);

  const getPageName = (): string => {
    if (pathname.startsWith("/products/") && pathname.includes("/edit")) {
      return "Editar Produto";
    }
    if (pathname.startsWith("/batches/") && pathname.includes("/edit")) {
      return "Editar Lote";
    }
    if (pathname.startsWith("/stock-movements/") && pathname !== "/stock-movements" && pathname !== "/stock-movements/create") {
      return "Detalhes da Movimentação";
    }
    if (pathname.startsWith("/products/") && pathname !== "/products" && pathname !== "/products/create") {
      return "Detalhes do Produto";
    }
    if (pathname.startsWith("/batches/") && pathname !== "/batches" && pathname !== "/batches/create") {
      return "Detalhes do Lote";
    }

    return PAGE_NAMES[pathname] || "StockShift";
  };

  const isWarehousesPage = pathname.startsWith("/warehouses");

  const handleWarehouseChange = (id: string) => {
    setSelectedWarehouseId(id);
  };

  const handleLogout = async () => {
    await logout();
  };

  return {
    pageName: getPageName(),
    warehouses: activeWarehouses,
    selectedWarehouseId,
    isLoadingWarehouses,
    onWarehouseChange: handleWarehouseChange,
    user,
    onLogout: handleLogout,
    onToggleMobileMenu: toggleMenu,
    showWarehouseSelect: !isWarehousesPage,
  };
};
