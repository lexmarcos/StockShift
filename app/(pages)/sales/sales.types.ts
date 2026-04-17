export type PaymentMethod =
  | "CASH"
  | "DEBIT_CARD"
  | "CREDIT_CARD"
  | "INSTALLMENT"
  | "PIX"
  | "BANK_TRANSFER"
  | "OTHER";

export type SaleStatus = "PENDING" | "COMPLETED" | "CANCELLED";

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string | null;
  batchId: string;
  batchCode: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Sale {
  id: string;
  code: string;
  warehouseId: string;
  warehouseName: string;
  paymentMethod: PaymentMethod;
  installments: number | null;
  discountPercentage: number | null;
  subtotal: number;
  discountAmount: number;
  total: number;
  status: SaleStatus;
  cancelledByUserId: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdByUserId: string;
  createdAt: string;
  items: SaleItem[];
}

export interface SaleSummary {
  id: string;
  code: string;
  warehouseId: string;
  warehouseName: string;
  paymentMethod: PaymentMethod;
  total: number;
  status: SaleStatus;
  createdAt: string;
  createdByUserName: string;
}

export interface KpiPeriod {
  count: number;
  revenue: number;
  avgTicket: number;
}

export interface DailyChartEntry {
  date: string;
  count: number;
  revenue: number;
}

export interface SalesDashboardData {
  kpis: {
    today: KpiPeriod;
    week: KpiPeriod;
    month: KpiPeriod;
  };
  dailyChart: DailyChartEntry[];
}

export interface SalesDashboardResponse {
  success: boolean;
  message: string;
  data: SalesDashboardData;
}

export interface SalesResponse {
  success: boolean;
  message: string;
  data: {
    content: SaleSummary[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    empty: boolean;
  };
}

export interface SaleDetailResponse {
  success: boolean;
  message: string;
  data: Sale;
}

export interface SaleFilters {
  warehouseId?: string;
  paymentMethod?: PaymentMethod | "ALL";
  status?: SaleStatus | "ALL";
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Dinheiro",
  DEBIT_CARD: "Débito",
  CREDIT_CARD: "Crédito",
  INSTALLMENT: "Crediário",
  PIX: "PIX",
  BANK_TRANSFER: "Transferência",
  OTHER: "Outro",
};

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  PENDING: "Pendente",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
};

export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
