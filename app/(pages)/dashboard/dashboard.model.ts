import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import {
  DashboardApiResponse,
  DashboardData,
  DashboardViewProps,
} from "./dashboard.types";

const fetcher = async (url: string): Promise<DashboardData> => {
  const response = await api.get(url).json<DashboardApiResponse>();
  if (!response.success) {
    throw new Error(response.message || "Erro ao carregar dashboard");
  }
  return response.data;
};

export function useDashboardModel(): DashboardViewProps {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<DashboardData, Error>(
    "reports/dashboard",
    fetcher,
    {
      refreshInterval: 300000, // 5 minutes auto-refresh
      revalidateOnFocus: true,
      dedupingInterval: 60000, // 1 minute deduping
    },
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await mutate();
    } finally {
      setIsRefreshing(false);
    }
  }, [mutate]);

  const navigateToLowStock = useCallback(() => {
    router.push("/reports/low-stock");
  }, [router]);

  const navigateToExpiring = useCallback(() => {
    router.push("/reports/expiring");
  }, [router]);

  return {
    data,
    isLoading,
    error,
    onRefresh,
    isRefreshing,
    navigateToLowStock,
    navigateToExpiring,
  };
}

// Utility functions for formatting
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Agora";
  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}
