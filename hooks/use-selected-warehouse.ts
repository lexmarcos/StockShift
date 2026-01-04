import { useWarehouse } from "@/lib/contexts/warehouse-context";

export const useSelectedWarehouse = () => {
  const { selectedWarehouseId, setSelectedWarehouseId } = useWarehouse();

  return {
    warehouseId: selectedWarehouseId,
    setWarehouseId: setSelectedWarehouseId,
  };
};
