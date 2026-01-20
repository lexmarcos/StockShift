"use client";

import { useState } from "react";
import { Package, Warehouse, ChevronDown, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { WarehouseBottomSheet } from "./warehouse-bottom-sheet";
import type { WarehouseOption } from "../stock-movements-create.types";

interface SetupPhaseProps {
  warehouses: WarehouseOption[];
  sourceWarehouseId: string | null;
  destinationWarehouseId: string | null;
  onSourceChange: (warehouse: WarehouseOption) => void;
  onDestinationChange: (warehouse: WarehouseOption) => void;
}

export const SetupPhase = ({
  warehouses,
  sourceWarehouseId,
  destinationWarehouseId,
  onSourceChange,
  onDestinationChange,
}: SetupPhaseProps) => {
  const [sourceSheetOpen, setSourceSheetOpen] = useState(false);
  const [destinationSheetOpen, setDestinationSheetOpen] = useState(false);

  const sourceWarehouse = warehouses.find((w) => w.id === sourceWarehouseId);
  const destinationWarehouse = warehouses.find((w) => w.id === destinationWarehouseId);

  return (
    <div className="flex-1 px-4 py-6">
      <div className="space-y-4">
        {/* Source Card */}
        <button
          type="button"
          onClick={() => setSourceSheetOpen(true)}
          className={cn(
            "w-full rounded-[4px] border-2 p-4 text-left transition-colors",
            sourceWarehouseId
              ? "border-blue-600 bg-blue-500/5"
              : "border-neutral-800 bg-neutral-900 hover:bg-neutral-800"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-[4px]",
              sourceWarehouseId ? "bg-blue-500/10" : "bg-neutral-800"
            )}>
              <Package className={cn(
                "h-6 w-6",
                sourceWarehouseId ? "text-blue-500" : "text-neutral-500"
              )} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Origem
              </p>
              <p className={cn(
                "text-sm font-medium mt-0.5",
                sourceWarehouseId ? "text-white" : "text-neutral-500"
              )}>
                {sourceWarehouse?.name || "Selecione o armazém..."}
              </p>
            </div>
            <ChevronDown className="h-5 w-5 text-neutral-500" />
          </div>
        </button>

        {/* Arrow connector */}
        <div className="flex justify-center">
          <ArrowDown className="h-6 w-6 text-neutral-600" />
        </div>

        {/* Destination Card */}
        <button
          type="button"
          onClick={() => setDestinationSheetOpen(true)}
          disabled={!sourceWarehouseId}
          className={cn(
            "w-full rounded-[4px] border-2 p-4 text-left transition-colors",
            destinationWarehouseId
              ? "border-blue-600 bg-blue-500/5"
              : "border-neutral-800 bg-neutral-900",
            sourceWarehouseId
              ? "hover:bg-neutral-800"
              : "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-[4px]",
              destinationWarehouseId ? "bg-blue-500/10" : "bg-neutral-800"
            )}>
              <Warehouse className={cn(
                "h-6 w-6",
                destinationWarehouseId ? "text-blue-500" : "text-neutral-500"
              )} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Destino
              </p>
              <p className={cn(
                "text-sm font-medium mt-0.5",
                destinationWarehouseId ? "text-white" : "text-neutral-500"
              )}>
                {destinationWarehouse?.name || "Selecione o armazém..."}
              </p>
            </div>
            <ChevronDown className="h-5 w-5 text-neutral-500" />
          </div>
        </button>
      </div>

      {/* Bottom Sheets */}
      <WarehouseBottomSheet
        open={sourceSheetOpen}
        onOpenChange={setSourceSheetOpen}
        title="Selecionar Origem"
        warehouses={warehouses}
        selectedId={sourceWarehouseId}
        onSelect={onSourceChange}
      />

      <WarehouseBottomSheet
        open={destinationSheetOpen}
        onOpenChange={setDestinationSheetOpen}
        title="Selecionar Destino"
        warehouses={warehouses}
        selectedId={destinationWarehouseId}
        onSelect={onDestinationChange}
        disabledId={sourceWarehouseId}
      />
    </div>
  );
};
