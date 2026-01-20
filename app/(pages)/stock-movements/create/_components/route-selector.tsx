"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight } from "lucide-react";

interface WarehouseOption {
  id: string;
  name: string;
}

interface RouteSelectorProps {
  sourceWarehouseId: string | null;
  destinationWarehouseId: string | null;
  onSourceChange: (id: string) => void;
  onDestinationChange: (id: string) => void;
  warehouses: WarehouseOption[];
  showSource: boolean;
  showDestination: boolean;
}

export function RouteSelector({
  sourceWarehouseId,
  destinationWarehouseId,
  onSourceChange,
  onDestinationChange,
  warehouses,
  showSource,
  showDestination,
}: RouteSelectorProps) {
  if (!showSource && !showDestination) {
    return null;
  }

  return (
    <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-blue-500" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          Rota
        </span>
      </div>

      <div className="flex items-center gap-4">
        {showSource && (
          <div className="flex-1">
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Origem <span className="text-rose-500">*</span>
            </label>
            <Select value={sourceWarehouseId || ""} onValueChange={onSourceChange}>
              <SelectTrigger className="h-10 w-full rounded-[4px] border-neutral-800 bg-neutral-900 text-sm">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717]">
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id} className="text-xs">
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showSource && showDestination && (
          <div className="flex h-10 items-center pt-5">
            <ArrowRight className="h-5 w-5 text-neutral-600" />
          </div>
        )}

        {showDestination && (
          <div className="flex-1">
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Destino <span className="text-rose-500">*</span>
            </label>
            <Select value={destinationWarehouseId || ""} onValueChange={onDestinationChange}>
              <SelectTrigger className="h-10 w-full rounded-[4px] border-neutral-800 bg-neutral-900 text-sm">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717]">
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id} className="text-xs">
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}
