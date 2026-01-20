"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MovementItemCardProps {
  productName: string;
  productSku?: string;
  batchCode: string;
  quantity: number;
  maxQuantity: number;
  movementType: "ENTRY" | "EXIT" | "TRANSFER" | "ADJUSTMENT";
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

const typeColors = {
  ENTRY: "bg-emerald-500",
  EXIT: "bg-rose-500",
  TRANSFER: "bg-blue-500",
  ADJUSTMENT: "bg-amber-500",
};

export function MovementItemCard({
  productName,
  productSku,
  batchCode,
  quantity,
  maxQuantity,
  movementType,
  onQuantityChange,
  onRemove,
}: MovementItemCardProps) {
  const handleDecrement = () => {
    if (quantity > 1) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < maxQuantity) {
      onQuantityChange(quantity + 1);
    }
  };

  return (
    <div className="group relative rounded-[4px] border border-neutral-800 bg-[#171717] overflow-hidden">
      {/* Color stripe */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", typeColors[movementType])} />

      <div className="py-3 pl-4 pr-3">
        <div className="flex items-start justify-between gap-4">
          {/* Product info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-white truncate">{productName}</h4>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-neutral-500">
              {productSku && <span>SKU: {productSku}</span>}
              {productSku && <span>•</span>}
              <span>Lote: {batchCode}</span>
              <span>•</span>
              <span>Disp: {maxQuantity}</span>
            </div>
          </div>

          {/* Quantity stepper */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleDecrement}
              disabled={quantity <= 1}
              className="h-8 w-8 rounded-[4px] border-neutral-700 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <div className="w-12 text-center">
              <span className="text-sm font-bold tracking-tight text-white">{quantity}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleIncrement}
              disabled={quantity >= maxQuantity}
              className="h-8 w-8 rounded-[4px] border-neutral-700 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Remove button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8 rounded-[4px] text-neutral-500 hover:bg-rose-950/30 hover:text-rose-500"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
