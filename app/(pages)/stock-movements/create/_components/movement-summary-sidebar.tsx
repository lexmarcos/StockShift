"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowDown, Package, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MovementSummarySidebarProps {
  movementType: "ENTRY" | "EXIT" | "TRANSFER" | "ADJUSTMENT" | null;
  sourceWarehouseName: string | null;
  destinationWarehouseName: string | null;
  itemCount: number;
  totalQuantity: number;
  notes: string;
  onNotesChange: (notes: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
}

const typeConfig = {
  ENTRY: { label: "Entrada", color: "bg-emerald-500", textColor: "text-emerald-500" },
  EXIT: { label: "Saída", color: "bg-rose-500", textColor: "text-rose-500" },
  TRANSFER: { label: "Transferência", color: "bg-blue-500", textColor: "text-blue-500" },
  ADJUSTMENT: { label: "Ajuste", color: "bg-amber-500", textColor: "text-amber-500" },
};

export function MovementSummarySidebar({
  movementType,
  sourceWarehouseName,
  destinationWarehouseName,
  itemCount,
  totalQuantity,
  notes,
  onNotesChange,
  onSubmit,
  isSubmitting,
  canSubmit,
}: MovementSummarySidebarProps) {
  const config = movementType ? typeConfig[movementType] : null;
  const showSource = movementType === "EXIT" || movementType === "TRANSFER" || movementType === "ADJUSTMENT";
  const showDestination = movementType === "ENTRY" || movementType === "TRANSFER";

  return (
    <div className="sticky top-8 rounded-[4px] border border-neutral-800 bg-[#171717]">
      {/* Header */}
      <div className="border-b border-neutral-800 p-4">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          Resumo da Operação
        </h3>
      </div>

      {/* Type Badge */}
      <div className="border-b border-neutral-800 p-4">
        {config ? (
          <div className={cn("inline-flex items-center gap-2 rounded-[4px] px-3 py-1.5", config.color + "/10")}>
            <div className={cn("h-2 w-2 rounded-full", config.color)} />
            <span className={cn("text-xs font-bold uppercase", config.textColor)}>
              {config.label}
            </span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-[4px] bg-neutral-800/50 px-3 py-1.5">
            <div className="h-2 w-2 rounded-full bg-neutral-600" />
            <span className="text-xs text-neutral-500">Selecione o tipo</span>
          </div>
        )}
      </div>

      {/* Route */}
      {(showSource || showDestination) && (
        <div className="border-b border-neutral-800 p-4">
          <div className="flex flex-col items-center gap-1.5">
            {showSource && (
              sourceWarehouseName ? (
                <div className="flex w-full items-center gap-2 rounded-[4px] bg-neutral-800/50 px-3 py-2">
                  <Package className="h-4 w-4 text-neutral-500" />
                  <span className="text-xs text-white">{sourceWarehouseName}</span>
                </div>
              ) : (
                <div className="flex w-full items-center gap-2 rounded-[4px] bg-neutral-800/30 px-3 py-2">
                  <Package className="h-4 w-4 text-neutral-600" />
                  <span className="text-xs text-neutral-600">Origem não definida</span>
                </div>
              )
            )}

            {movementType === "TRANSFER" && (
              <ArrowDown className="h-4 w-4 text-neutral-600" />
            )}

            {showDestination && (
              destinationWarehouseName ? (
                <div className="flex w-full items-center gap-2 rounded-[4px] bg-neutral-800/50 px-3 py-2">
                  <Package className="h-4 w-4 text-neutral-500" />
                  <span className="text-xs text-white">{destinationWarehouseName}</span>
                </div>
              ) : (
                <div className="flex w-full items-center gap-2 rounded-[4px] bg-neutral-800/30 px-3 py-2">
                  <Package className="h-4 w-4 text-neutral-600" />
                  <span className="text-xs text-neutral-600">Destino não definido</span>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="border-b border-neutral-800 p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Itens
            </span>
            <p className="mt-0.5 text-lg font-bold tracking-tight text-white">
              {itemCount} <span className="text-xs font-normal text-neutral-500">produtos</span>
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Quantidade
            </span>
            <p className="mt-0.5 text-lg font-bold tracking-tight text-white">
              {totalQuantity} <span className="text-xs font-normal text-neutral-500">unidades</span>
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="border-b border-neutral-800 p-4">
        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
          Observações
        </label>
        <Textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Notas opcionais..."
          className="min-h-[80px] rounded-[4px] border-neutral-800 bg-neutral-900 text-xs resize-none"
        />
      </div>

      {/* Submit Button */}
      <div className="p-4">
        <Button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
          className="h-12 w-full rounded-[4px] bg-emerald-600 text-xs font-bold uppercase tracking-wide hover:bg-emerald-700 disabled:opacity-30"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando...
            </>
          ) : (
            "Criar Movimentação"
          )}
        </Button>
      </div>
    </div>
  );
}
