import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { api } from "@/lib/api";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import { TransferStatus, TransfersPageResponse } from "./transfers.types";

export function useTransfersModel() {
  const [activeTab, setActiveTab] = useState<"outgoing" | "incoming">(
    "outgoing",
  );
  const { warehouseId } = useSelectedWarehouse();
  const router = useRouter();

  const { data, isLoading, error, mutate } = useSWR<TransfersPageResponse>(
    warehouseId ? "transfers" : null,
    async (url: string) => {
      return await api.get(url).json<TransfersPageResponse>();
    },
  );

  const allTransfers = useMemo(() => data?.data?.content || [], [data]);

  const filteredTransfers = useMemo(() => {
    if (!warehouseId) return [];

    const filtered = allTransfers.filter((transfer) => {
      if (activeTab === "outgoing") {
        return transfer.sourceWarehouseId === warehouseId;
      }
      return transfer.destinationWarehouseId === warehouseId;
    });

    return [...filtered].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [allTransfers, warehouseId, activeTab]);

  const stats = useMemo(() => {
    if (!warehouseId)
      return { total: 0, inTransit: 0, pending: 0, completed: 0 };

    const relevant = allTransfers.filter((t) =>
      activeTab === "outgoing"
        ? t.sourceWarehouseId === warehouseId
        : t.destinationWarehouseId === warehouseId,
    );

    return {
      total: relevant.length,
      inTransit: relevant.filter((t) => t.status === TransferStatus.IN_TRANSIT)
        .length,
      pending: relevant.filter(
        (t) =>
          t.status === TransferStatus.PENDING_VALIDATION ||
          t.status === TransferStatus.IN_VALIDATION ||
          t.status === TransferStatus.DRAFT,
      ).length,
      completed: relevant.filter((t) => t.status === TransferStatus.COMPLETED)
        .length,
    };
  }, [allTransfers, warehouseId, activeTab]);

  return {
    transfers: filteredTransfers,
    isLoading,
    error: error || null,
    activeTab,
    onTabChange: setActiveTab,
    stats,
    onRetry: () => mutate(),
    onNewTransfer: () => router.push("/transfers/new"),
  };
}
