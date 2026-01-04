"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { Package, Loader2 } from "lucide-react";

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
  // Fetch batches for this warehouse
  const { data, isLoading } = useSWR<BatchesResponse>(
    `warehouse-stock-${warehouseId}`,
    async () => {
      const response = await api.get(`batches/warehouse/${warehouseId}`).json<BatchesResponse>();
      return response;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // Cache por 1 minuto
    }
  );

  // Calcular estatísticas
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
      <div className="flex items-center gap-2 px-3 py-2 rounded-sm bg-foreground/5 border border-border/20">
        <Loader2 className="h-3.5 w-3.5 text-muted-foreground/50 animate-spin" />
        <span className="text-xs text-muted-foreground/60">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="bg-foreground/3 border border-border/25 rounded-sm p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-foreground/60" />
        <span className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wide">
          Estoque
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* Produtos Únicos */}
        <div className="space-y-1">
          <div className="text-2xl font-bold text-foreground/90">
            {stats.uniqueProducts}
          </div>
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">
            Produtos
          </p>
        </div>

        {/* Total de Batches */}
        <div className="space-y-1">
          <div className="text-2xl font-bold text-foreground/90">
            {stats.totalBatches}
          </div>
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">
            Lotes
          </p>
        </div>

        {/* Total de Quantidade */}
        <div className="space-y-1">
          <div className="text-2xl font-bold text-foreground/90">
            {stats.totalQuantity}
          </div>
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">
            Unidades
          </p>
        </div>
      </div>
    </div>
  );
};
