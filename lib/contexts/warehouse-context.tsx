"use client";

import {
  createContext,
  use,
  useState,
  useSyncExternalStore,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

interface WarehouseContextValue {
  selectedWarehouseId: string | null;
  setSelectedWarehouseId: (id: string) => void;
}

const WarehouseContext = createContext<WarehouseContextValue | undefined>(undefined);

const WAREHOUSE_STORAGE_KEY = "selected-warehouse-id";

const subscribeToClientHydration = (onStoreChange: () => void): (() => void) => {
  onStoreChange();
  return () => undefined;
};

const getClientSnapshot = (): boolean => true;

const getServerSnapshot = (): boolean => false;

const readStoredWarehouseId = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(WAREHOUSE_STORAGE_KEY);
};

export const WarehouseProvider = ({ children }: { children: ReactNode }) => {
  const [selectedWarehouseId, setSelectedWarehouseIdState] =
    useState<string | null>(readStoredWarehouseId);
  const isClient = useSyncExternalStore(
    subscribeToClientHydration,
    getClientSnapshot,
    getServerSnapshot,
  );
  const { push } = useRouter();

  const setSelectedWarehouseId = (id: string) => {
    setSelectedWarehouseIdState(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(WAREHOUSE_STORAGE_KEY, id);
      // Redirecionar para /sales após selecionar warehouse
      push("/sales");
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
  const context = use(WarehouseContext);
  if (!context) {
    throw new Error("useWarehouse must be used within WarehouseProvider");
  }
  return context;
};
