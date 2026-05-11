"use client";

import { Package, Boxes, Archive, Loader2 } from "lucide-react";
import type { WarehouseStockSummary } from "./warehouses.types";

interface WarehouseStockInfoProps {
  summary?: WarehouseStockSummary;
  isLoading?: boolean;
}

export const WarehouseStockInfo = ({
  summary,
  isLoading = false,
}: WarehouseStockInfoProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="size-4 text-neutral-600 animate-spin" />
      </div>
    );
  }

  const productCount = summary?.productCount ?? 0;
  const batchCount = summary?.batchCount ?? 0;
  const totalQuantity = summary?.totalQuantity ?? 0;
  const hasStock = totalQuantity > 0;

  return (
    <div className="grid grid-cols-3 divide-x divide-neutral-800">
      <div className="flex flex-col items-center justify-center py-3 px-2">
        <div className="flex items-center gap-1.5 mb-1">
          <Package className="size-3 text-neutral-500" />
        </div>
        <span className="text-lg font-bold tracking-tighter text-white tabular-nums">
          {productCount}
        </span>
        <span className="text-[9px] font-medium uppercase tracking-wider text-neutral-500">
          Produtos
        </span>
      </div>

      <div className="flex flex-col items-center justify-center py-3 px-2">
        <div className="flex items-center gap-1.5 mb-1">
          <Boxes className="size-3 text-neutral-500" />
        </div>
        <span className="text-lg font-bold tracking-tighter text-white tabular-nums">
          {batchCount}
        </span>
        <span className="text-[9px] font-medium uppercase tracking-wider text-neutral-500">
          Lotes
        </span>
      </div>

      <div className="flex flex-col items-center justify-center py-3 px-2">
        <div className="flex items-center gap-1.5 mb-1">
          <Archive className="size-3 text-neutral-500" />
        </div>
        <span className={`text-lg font-bold tracking-tighter tabular-nums ${hasStock ? "text-emerald-500" : "text-neutral-500"}`}>
          {totalQuantity.toLocaleString("pt-BR")}
        </span>
        <span className="text-[9px] font-medium uppercase tracking-wider text-neutral-500">
          Unidades
        </span>
      </div>
    </div>
  );
};
