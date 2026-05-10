interface DashboardMovementStatsPeriod {
  entries: number;
  exits: number;
  transfers: number;
  adjustments: number;
}

export interface DashboardMovementStats {
  today: DashboardMovementStatsPeriod;
  thisWeek: DashboardMovementStatsPeriod;
  thisMonth: DashboardMovementStatsPeriod;
}

export interface DashboardRecentMovement {
  id: string;
  movementType: "ENTRY" | "EXIT" | "TRANSFER" | "ADJUSTMENT";
  status: string;
  createdAt: string;
  productCount: number;
  notes: string | null;
}

interface DashboardStockByWarehouse {
  warehouseId: string;
  warehouseName: string;
  batchCount: number;
  stockValue: number;
  productCount: number;
}

interface DashboardStockByCategory {
  categoryId: string;
  categoryName: string;
  batchCount: number;
  stockValue: number;
  productCount: number;
}

export interface DashboardData {
  totalProducts: number;
  activeProducts: number;
  totalWarehouses: number;
  activeWarehouses: number;
  totalBatches: number;
  totalStockValue: number;
  lowStockCount: number;
  expiringCount: number;
  recentMovements: DashboardRecentMovement[];
  stockByWarehouse: DashboardStockByWarehouse[];
  stockByCategory: DashboardStockByCategory[];
  movementStats: DashboardMovementStats;
}

export interface DashboardResponse {
  success: boolean;
  message: string | null;
  data: DashboardData;
}

export interface DashboardViewProps {
  data: DashboardData | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
}
