"use client";

import { ArrowRight } from "lucide-react";

interface WarehouseContextBarProps {
  sourceWarehouse: string;
  destinationWarehouse: string;
}

export const WarehouseContextBar = ({
  sourceWarehouse,
  destinationWarehouse,
}: WarehouseContextBarProps) => {
  return (
    <div className="border-b border-neutral-800 bg-neutral-900 px-4 py-2.5">
      <div className="flex items-center justify-center gap-2 text-sm">
        <span className="font-medium text-white truncate max-w-[120px]">
          {sourceWarehouse}
        </span>
        <ArrowRight className="h-4 w-4 text-neutral-500 flex-shrink-0" />
        <span className="font-medium text-white truncate max-w-[120px]">
          {destinationWarehouse}
        </span>
      </div>
    </div>
  );
};
