"use client";

import { useState } from "react";
import { Pencil, Package, Warehouse, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MobileWizardItem } from "../stock-movements-create.types";

interface ReviewPhaseProps {
  sourceWarehouseName?: string;
  destinationWarehouseName?: string;
  items: MobileWizardItem[];
  onEditRoute: () => void;
  onEditItems: () => void;
}

export const ReviewPhase = ({
  sourceWarehouseName,
  destinationWarehouseName,
  items,
  onEditRoute,
  onEditItems,
}: ReviewPhaseProps) => {
  const [showAllItems, setShowAllItems] = useState(false);

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const visibleItems = showAllItems ? items : items.slice(0, 5);
  const hiddenCount = items.length - 5;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 pb-40">
      <div className="space-y-4">
        {/* Route Card */}
        <div className="rounded-[4px] border border-neutral-800 bg-neutral-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Rota
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onEditRoute}
              className="h-7 w-7 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-blue-500"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="space-y-4">
            {sourceWarehouseName && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-neutral-800">
                  <Package className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Origem
                  </p>
                  <p className="text-sm font-medium text-white">
                    {sourceWarehouseName}
                  </p>
                </div>
              </div>
            )}

            {sourceWarehouseName && destinationWarehouseName && (
              <div className="flex justify-center">
                <div className="h-6 w-px bg-neutral-700" />
              </div>
            )}

            {destinationWarehouseName && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-neutral-800">
                  <Warehouse className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Destino
                  </p>
                  <p className="text-sm font-medium text-white">
                    {destinationWarehouseName}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Items Card */}
        <div className="rounded-[4px] border border-neutral-800 bg-neutral-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Itens ({items.length})
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onEditItems}
              className="h-7 w-7 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-blue-500"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="space-y-2">
            {visibleItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-1.5"
              >
                <span className="text-sm text-neutral-300 truncate flex-1">
                  {item.productName}
                </span>
                <span className="text-sm font-medium text-white ml-2">
                  × {item.quantity}
                </span>
              </div>
            ))}

            {hiddenCount > 0 && !showAllItems && (
              <button
                type="button"
                onClick={() => setShowAllItems(true)}
                className="flex items-center justify-center gap-1 w-full py-2 text-xs text-blue-500 hover:text-blue-400"
              >
                +{hiddenCount} itens
                <ChevronDown className="h-3 w-3" />
              </button>
            )}

            {showAllItems && items.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllItems(false)}
                className="flex items-center justify-center gap-1 w-full py-2 text-xs text-neutral-500 hover:text-neutral-400"
              >
                Mostrar menos
                <ChevronUp className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="border-t border-neutral-800 mt-3 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-neutral-400">
                Total
              </span>
              <span className="text-sm font-bold text-white">
                {totalQuantity} unidades
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
