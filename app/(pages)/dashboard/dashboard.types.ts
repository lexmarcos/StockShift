// Dashboard Types - Based on /api/reports/dashboard endpoint

export interface RecentMovement {
  id: string;
  movementType: "ENTRY" | "EXIT" | "TRANSFER" | "ADJUSTMENT";
  status: "COMPLETED" | "PENDING" | "CANCELLED";
  createdAt: string;
  productCount: number;
  notes: string | null;
  originWarehouseName?: string;
  destinationWarehouseName?: string;
}

export interface StockValuePoint {
  date: string;
  value: number;
}

export interface StockByWarehouse {
  warehouseId: string;
  warehouseName: string;
  batchCount: number;
  stockValue: number;
  productCount: number;
}

export interface StockByCategory {
  categoryId: string;
  categoryName: string;
  batchCount: number;
  stockValue: number;
  productCount: number;
}

export interface MovementPeriodStats {
  entries: number;
  exits: number;
  transfers: number;
  adjustments: number;
}

export interface MovementStats {
  today: MovementPeriodStats;
  thisWeek: MovementPeriodStats;
  thisMonth: MovementPeriodStats;
}

export interface LowStockProduct {
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  totalQuantity: number;
  totalValue: number;
  nearestExpiration: string | null;
  batchCount: number;
}

export interface DashboardData {
  totalProducts: number;
  totalWarehouses: number;
  totalStockQuantity: number;
  totalStockValue: number;
  pendingMovements: number;
  completedMovementsToday: number;
  lowStockProducts: LowStockProduct[];
  expiringProducts: LowStockProduct[]; // Using the same structure for simplicity
  stockByWarehouse: StockByWarehouse[];
  stockByCategory: StockByCategory[];
  movementStats: MovementStats;
  recentMovements: RecentMovement[];
  stockHistory?: StockValuePoint[];
}

export interface DashboardApiResponse {
  success: boolean;
  message: string | null;
  data: DashboardData;
}

// View Props
export interface DashboardViewProps {
  data: DashboardData | undefined;
  isLoading: boolean;
  error: Error | undefined;
  onRefresh: () => void;
  isRefreshing: boolean;
  navigateToLowStock: () => void;
  navigateToExpiring: () => void;
}

// Component Props
export interface AlertCardProps {
  type: "low-stock" | "expiring";
  items: LowStockProduct[];
  isLoading?: boolean;
  onSeeAll: () => void;
}

export interface KPICardProps {
  value: number | string;
  label: string;
  icon: React.ElementType;
  trend?: {
    direction: "up" | "down";
    value: string;
  };
  format?: "number" | "currency";
  color?: "blue" | "emerald" | "amber" | "rose";
}

export interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
  action?: React.ReactNode;
}
