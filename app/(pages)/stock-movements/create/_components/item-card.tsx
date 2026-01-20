"use client";

import { X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MobileWizardItem } from "../stock-movements-create.types";

interface ItemCardProps {
  item: MobileWizardItem;
  onEdit: () => void;
  onRemove: () => void;
}

export const ItemCard = ({ item, onEdit, onRemove }: ItemCardProps) => {
  return (
    <div className="relative rounded-[4px] border border-neutral-800 bg-neutral-900 overflow-hidden">
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />

      <div className="py-3 pl-4 pr-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {item.productName}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Lote: {item.batchCode}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-blue-500">
                QTD: {item.quantity}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onEdit}
                className="h-6 w-6 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-blue-500"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8 rounded-[4px] text-neutral-600 hover:bg-rose-950/20 hover:text-rose-500"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
