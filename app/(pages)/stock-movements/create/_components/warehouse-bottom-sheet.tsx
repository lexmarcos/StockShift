"use client";

import { useState } from "react";
import { Search, Check } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { WarehouseOption } from "../stock-movements-create.types";

interface WarehouseBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  warehouses: WarehouseOption[];
  selectedId?: string | null;
  onSelect: (warehouse: WarehouseOption) => void;
  disabledId?: string | null;
}

export const WarehouseBottomSheet = ({
  open,
  onOpenChange,
  title,
  warehouses,
  selectedId,
  onSelect,
  disabledId,
}: WarehouseBottomSheetProps) => {
  const [search, setSearch] = useState("");

  const filteredWarehouses = warehouses.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (warehouse: WarehouseOption) => {
    if (warehouse.id === disabledId) return;
    onSelect(warehouse);
    onOpenChange(false);
    setSearch("");
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-neutral-800 bg-[#171717] max-h-[70vh]">
        <DrawerHeader className="border-b border-neutral-800 pb-4">
          <DrawerTitle className="text-sm font-bold uppercase tracking-wide text-white">
            {title}
          </DrawerTitle>
        </DrawerHeader>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <Input
              placeholder="Buscar armazém..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 pl-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-2">
            {filteredWarehouses.map((warehouse) => {
              const isSelected = warehouse.id === selectedId;
              const isDisabled = warehouse.id === disabledId;

              return (
                <button
                  key={warehouse.id}
                  type="button"
                  onClick={() => handleSelect(warehouse)}
                  disabled={isDisabled}
                  className={cn(
                    "w-full flex items-center justify-between rounded-[4px] border p-4 text-left transition-colors",
                    isSelected
                      ? "border-blue-600 bg-blue-500/5"
                      : "border-neutral-800 bg-neutral-900 hover:bg-neutral-800",
                    isDisabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {warehouse.name}
                    </p>
                    {warehouse.productCount !== undefined && (
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {warehouse.productCount} produtos em estoque
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  )}
                </button>
              );
            })}

            {filteredWarehouses.length === 0 && (
              <p className="text-center text-sm text-neutral-500 py-8">
                Nenhum armazém encontrado
              </p>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
