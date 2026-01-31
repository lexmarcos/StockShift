import { useMemo, useState } from "react";
import useSWR from "swr";
import type {
  StockMovement,
  MovementFilters,
  SortConfig,
  StockMovementsResponse,
} from "./stock-movements.types";

export type { StockMovement, MovementFilters, SortConfig };

export const filterMovements = (
  movements: StockMovement[],
  filters: MovementFilters
) => {
  const query = filters.searchQuery.trim().toLowerCase();

  return movements.filter((movement) => {
    if (filters.status !== "all" && movement.status !== filters.status) {
      return false;
    }

    if (
      filters.movementType !== "all" &&
      movement.movementType !== filters.movementType
    ) {
      return false;
    }

    if (filters.warehouseId) {
      const matchesWarehouse =
        movement.sourceWarehouseId === filters.warehouseId ||
        movement.destinationWarehouseId === filters.warehouseId;
      if (!matchesWarehouse) {
        return false;
      }
    }

    if (query) {
      const itemText = movement.items
        .map(
          (item) =>
            `${item.productName} ${item.productSku ?? ""} ${
              item.batchCode ?? ""
            }`
        )
        .join(" ")
        .toLowerCase();

      const haystack = `${movement.notes ?? ""} ${itemText}`.toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }

    return true;
  });
};

export const sortMovements = (movements: StockMovement[], sort: SortConfig) => {
  const sorted = [...movements];
  sorted.sort((a, b) => {
    const direction = sort.direction === "asc" ? 1 : -1;

    if (sort.key === "createdAt") {
      return (
        direction *
        (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      );
    }

    if (sort.key === "movementType") {
      return direction * a.movementType.localeCompare(b.movementType);
    }

    return direction * a.status.localeCompare(b.status);
  });

  return sorted;
};

export const useStockMovementsModel = () => {
  const [filters, setFilters] = useState<MovementFilters>({
    searchQuery: "",
    status: "all",
    movementType: "all",
    warehouseId: "",
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "createdAt",
    direction: "desc",
  });

  const { data, error, isLoading } = useSWR<StockMovementsResponse>(
    "stock-movements",
    async () => {
      const { api } = await import("@/lib/api");
      return await api.get("stock-movements").json<StockMovementsResponse>();
    }
  );

  const rawMovements = data?.data || [];
  const filtered = useMemo(
    () => filterMovements(rawMovements, filters),
    [rawMovements, filters]
  );
  const sorted = useMemo(
    () => sortMovements(filtered, sortConfig),
    [filtered, sortConfig]
  );

  return {
    movements: sorted,
    isLoading,
    error,
    filters,
    sortConfig,
    setSearchQuery: (value: string) =>
      setFilters((prev) => ({ ...prev, searchQuery: value })),
    setStatus: (value: MovementFilters["status"]) =>
      setFilters((prev) => ({ ...prev, status: value })),
    setMovementType: (value: MovementFilters["movementType"]) =>
      setFilters((prev) => ({ ...prev, movementType: value })),
    setWarehouseId: (value: string) =>
      setFilters((prev) => ({ ...prev, warehouseId: value })),
    setSortConfig,
  };
};
