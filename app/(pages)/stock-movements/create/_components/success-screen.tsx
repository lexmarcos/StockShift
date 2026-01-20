"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface SuccessScreenProps {
  movementId: string;
  movementCode: string;
  totalQuantity: number;
  sourceWarehouse: string;
  destinationWarehouse: string;
  status: "PENDING" | "COMPLETED";
  onNewMovement: () => void;
}

export const SuccessScreen = ({
  movementId,
  movementCode,
  totalQuantity,
  sourceWarehouse,
  destinationWarehouse,
  status,
  onNewMovement,
}: SuccessScreenProps) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center space-y-4">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold uppercase tracking-wide text-white">
          Transferência Criada
        </h1>

        {/* Details */}
        <div className="space-y-1">
          <p className="text-lg font-mono text-neutral-300">
            {movementCode}
          </p>
          <p className="text-sm text-neutral-500">
            {totalQuantity} unidades
          </p>
          <p className="text-sm text-neutral-500">
            {sourceWarehouse} → {destinationWarehouse}
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center pt-2">
          <Badge
            variant="outline"
            className={
              status === "COMPLETED"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                : "border-amber-500/30 bg-amber-500/10 text-amber-500"
            }
          >
            {status === "COMPLETED" ? "EXECUTADA" : "PENDENTE"}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-xs mt-12 space-y-3">
        <Button
          type="button"
          onClick={onNewMovement}
          className="h-14 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
        >
          Nova Transferência
        </Button>
        <Link
          href={`/stock-movements/${movementId}`}
          className="block text-center text-sm text-neutral-400 hover:text-white py-2"
        >
          Ver detalhes
        </Link>
      </div>
    </div>
  );
};
