export interface User {
  userId: string;
  email: string;
  fullName: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface HeaderViewProps {
  pageName: string;
  warehouses: Warehouse[];
  selectedWarehouseId: string | null;
  isLoadingWarehouses: boolean;
  onWarehouseChange: (id: string) => void;
  user: User | null;
  onLogout: () => void;
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}
