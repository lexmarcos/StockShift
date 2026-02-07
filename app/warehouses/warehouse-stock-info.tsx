"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { Package, Boxes, Archive, Loader2 } from "lucide-react";

interface Batch {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  [key: string]: string | number;
}

interface BatchesResponse {
  success: boolean;
  data: Batch[];
}

interface WarehouseStockInfoProps {
  warehouseId: string;
}

export const WarehouseStockInfo = ({ warehouseId }: WarehouseStockInfoProps) => {
  const { data, isLoading } = useSWR<BatchesResponse>(
    `warehouse-stock-${warehouseId}`,
    async () => {
      const response = await api.get(`batches/warehouse/${warehouseId}`).json<BatchesResponse>();
      return response;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );

  const stats = useMemo(() => {
    const batches = data?.data || [];
    const uniqueProducts = new Set(batches.map((b) => b.productId)).size;
    const totalBatches = batches.length;
    const totalQuantity = batches.reduce((sum, b) => sum + (b.quantity || 0), 0);

    return {
      uniqueProducts,
      totalBatches,
      totalQuantity,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 text-neutral-600 animate-spin" />
      </div>
    );
  }

  const hasStock = stats.totalQuantity > 0;

  return (
    <div className="grid grid-cols-3 divide-x divide-neutral-800">
      <div className="flex flex-col items-center justify-center py-3 px-2">
        <div className="flex items-center gap-1.5 mb-1">
          <Package className="h-3 w-3 text-neutral-500" />
        </div>
        <span className="text-lg font-bold tracking-tighter text-white tabular-nums">
          {stats.uniqueProducts}
        </span>
        <span className="text-[9px] font-medium uppercase tracking-wider text-neutral-500">
          Produtos
        </span>
      </div>

      <div className="flex flex-col items-center justify-center py-3 px-2">
        <div className="flex items-center gap-1.5 mb-1">
          <Boxes className="h-3 w-3 text-neutral-500" />
        </div>
        <span className="text-lg font-bold tracking-tighter text-white tabular-nums">
          {stats.totalBatches}
        </span>
        <span className="text-[9px] font-medium uppercase tracking-wider text-neutral-500">
          Lotes
        </span>
      </div>

      <div className="flex flex-col items-center justify-center py-3 px-2">
        <div className="flex items-center gap-1.5 mb-1">
          <Archive className="h-3 w-3 text-neutral-500" />
        </div>
        <span className={`text-lg font-bold tracking-tighter tabular-nums ${hasStock ? "text-emerald-500" : "text-neutral-500"}`}>
          {stats.totalQuantity.toLocaleString("pt-BR")}
        </span>
        <span className="text-[9px] font-medium uppercase tracking-wider text-neutral-500">
          Unidades
        </span>
      </div>
    </div>
  );
};
