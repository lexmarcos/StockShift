import { useState, useMemo } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import { TransfersPageResponse } from "./transfers.types";

export function useTransfersModel() {
  const [activeTab, setActiveTab] = useState<"outgoing" | "incoming">("outgoing");
  const { warehouseId } = useSelectedWarehouse();

  const { data, isLoading, error } = useSWR<TransfersPageResponse>(
    warehouseId ? "transfers" : null,
    async (url: string) => {
      return await api.get(url).json<TransfersPageResponse>();
    }
  );

  const allTransfers = data?.data?.content || [];

  const filteredTransfers = useMemo(() => {
    if (!warehouseId) return [];

    const filtered = allTransfers.filter((transfer) => {
      if (activeTab === "outgoing") {
        return transfer.sourceWarehouseId === warehouseId;
      }
      return transfer.destinationWarehouseId === warehouseId;
    });

    return [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [allTransfers, warehouseId, activeTab]);

  return {
    transfers: filteredTransfers,
    isLoading,
    error: error || null,
    activeTab,
    onTabChange: setActiveTab,
  };
}
