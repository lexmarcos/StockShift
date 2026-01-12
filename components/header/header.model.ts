"use client";

import { usePathname } from "next/navigation";
import useSWR from "swr";
import { useAuth } from "@/lib/contexts/auth-context";
import { useWarehouse } from "@/lib/contexts/warehouse-context";
import { api } from "@/lib/api";
import { useMobileMenu } from "@/components/layout/mobile-menu-context";
import { Warehouse, HeaderViewProps } from "./header.types";

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

  const isWarehousesPage = pathname.startsWith("/warehouses");

  const handleWarehouseChange = (id: string) => {
    setSelectedWarehouseId(id);
  };

  const handleLogout = async () => {
    await logout();
  };

  return {
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
