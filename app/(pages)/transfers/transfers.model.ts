import { useState, useMemo } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import { useBreadcrumb } from "@/components/breadcrumb";
import {
  Transfer,
  TransfersResponse,
  StatusFilter,
  DirectionFilter,
} from "./transfers.types";

export const useTransfersModel = () => {
  const { warehouseId } = useSelectedWarehouse();

  useBreadcrumb({
    title: "Transferências",
    backUrl: "/dashboard",
    section: "Transferências",
  });

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>("all");

  // Fetch transfers where current warehouse is source
  const { data: sentData, isLoading: sentLoading } = useSWR<TransfersResponse>(
    warehouseId ? `transfers?sourceWarehouseId=${warehouseId}` : null,
    async (url) => await api.get(url).json<TransfersResponse>()
  );

  // Fetch transfers where current warehouse is destination (excluding DRAFT)
  const { data: receivedData, isLoading: receivedLoading } = useSWR<TransfersResponse>(
    warehouseId
      ? `transfers?destinationWarehouseId=${warehouseId}&statusNot=DRAFT`
      : null,
    async (url) => await api.get(url).json<TransfersResponse>()
  );

  const allTransfers = useMemo(() => {
    const sent = sentData?.data || [];
    const received = receivedData?.data || [];

    // Merge and deduplicate (in case same warehouse is both source and dest)
    const map = new Map<string, Transfer>();
    sent.forEach((t) => map.set(t.id, t));
    received.forEach((t) => map.set(t.id, t));

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [sentData, receivedData]);

  const filteredTransfers = useMemo(() => {
    let filtered = allTransfers;

    // Direction filter
    if (directionFilter === "sent") {
      filtered = filtered.filter((t) => t.sourceWarehouse.id === warehouseId);
    } else if (directionFilter === "received") {
      filtered = filtered.filter((t) => t.destinationWarehouse.id === warehouseId);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    return filtered;
  }, [allTransfers, directionFilter, statusFilter, warehouseId]);

  return {
    transfers: filteredTransfers,
    isLoading: sentLoading || receivedLoading,
    error: undefined,
    currentWarehouseId: warehouseId,
    statusFilter,
    setStatusFilter,
    directionFilter,
    setDirectionFilter,
  };
};

// Helper: check if current warehouse needs to take action
export const needsAction = (transfer: Transfer, currentWarehouseId: string | null): boolean => {
  if (!currentWarehouseId) return false;

  const isSource = transfer.sourceWarehouse.id === currentWarehouseId;
  const isDestination = transfer.destinationWarehouse.id === currentWarehouseId;

  if (isSource && transfer.status === "DRAFT") return true;
  if (isDestination && transfer.status === "IN_TRANSIT") return true;
  if (isDestination && transfer.status === "IN_VALIDATION") return true;

  return false;
};
