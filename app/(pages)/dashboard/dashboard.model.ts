import useSWR from "swr";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { DashboardResponse } from "./dashboard.types";

export function useDashboardModel() {
  const { data, error, isLoading, mutate } = useSWR<DashboardResponse>(
    "reports/dashboard",
    async (url: string) => {
      try {
        return await api.get(url).json<DashboardResponse>();
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
        toast.error("Erro ao carregar dashboard");
        throw err;
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    }
  );

  return {
    data: data?.data,
    isLoading,
    error: error ?? null,
    onRetry: () => mutate(),
  };
}
