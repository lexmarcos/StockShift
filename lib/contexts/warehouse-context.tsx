"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface WarehouseContextValue {
  selectedWarehouseId: string | null;
  setSelectedWarehouseId: (id: string) => void;
}

const WarehouseContext = createContext<WarehouseContextValue | undefined>(undefined);

const WAREHOUSE_STORAGE_KEY = "selected-warehouse-id";

export const WarehouseProvider = ({ children }: { children: ReactNode }) => {
  const [selectedWarehouseId, setSelectedWarehouseIdState] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const stored = localStorage.getItem(WAREHOUSE_STORAGE_KEY);
    if (stored) {
      setSelectedWarehouseIdState(stored);
    }
  }, []);

  const setSelectedWarehouseId = (id: string) => {
    setSelectedWarehouseIdState(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(WAREHOUSE_STORAGE_KEY, id);
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <WarehouseContext.Provider value={{ selectedWarehouseId, setSelectedWarehouseId }}>
      {children}
    </WarehouseContext.Provider>
  );
};

export const useWarehouse = () => {
  const context = useContext(WarehouseContext);
  if (!context) {
    throw new Error("useWarehouse must be used within WarehouseProvider");
  }
  return context;
};
