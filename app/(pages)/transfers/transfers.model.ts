import { useState } from "react";
import useSWR from "swr";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import { Transfer } from "./transfers.types";

export function useTransfersModel() {
  const [activeTab, setActiveTab] = useState<"outgoing" | "incoming">("outgoing");
  const { warehouseId } = useSelectedWarehouse();

  // Fetch all transfers
  // In a real app, we might want to filter on the server side
  const { data, isLoading } = useSWR<Transfer[]>("/stockshift/api/transfers");

  const transfers = data || [];

  const filteredTransfers = transfers.filter((transfer) => {
    if (!warehouseId) return false;

    if (activeTab === "outgoing") {
      return transfer.sourceWarehouseId === warehouseId;
    } else {
      return transfer.destinationWarehouseId === warehouseId;
    }
  });

  // Sort by createdAt desc
  const sortedTransfers = [...filteredTransfers].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    transfers: sortedTransfers,
    isLoading,
    activeTab,
    onTabChange: setActiveTab,
  };
}
