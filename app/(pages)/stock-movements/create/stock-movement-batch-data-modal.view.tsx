"use client";

import { CalendarDays, DollarSign, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import type { ExistingProductBatchFormState } from "./create-stock-movement.types";

interface StockMovementBatchDataModalProps {
  form: ExistingProductBatchFormState;
  onOpenChange: (open: boolean) => void;
  onQuantityChange: (quantity: string) => void;
  onManufacturedDateChange: (date: string) => void;
  onExpirationDateChange: (date: string) => void;
  onCostPriceChange: (price?: number) => void;
  onSellingPriceChange: (price?: number) => void;
  onConfirm: () => void;
}

export function StockMovementBatchDataModal({
  form,
  onOpenChange,
  onQuantityChange,
  onManufacturedDateChange,
  onExpirationDateChange,
  onCostPriceChange,
  onSellingPriceChange,
  onConfirm,
}: StockMovementBatchDataModalProps) {
  return (
    <ResponsiveModal
      open={form.isOpen}
      onOpenChange={onOpenChange}
      title="Dados do lote"
      description="Informe quantidade, datas e preços deste lote."
      maxWidth="sm:max-w-[640px]"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 w-full rounded-[4px] border-neutral-800 text-xs font-bold uppercase tracking-wide md:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="h-10 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 md:w-auto"
          >
            Confirmar
          </Button>
        </>
      }
    >
      <div className="space-y-5 pb-2 pt-2">
        <div className="rounded-[4px] border border-neutral-800 bg-neutral-900 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <PackageCheck className="size-4 shrink-0 text-emerald-500" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">
                {form.productName || "Produto"}
              </p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-neutral-500">
                {form.editingIndex === null ? "Novo item" : "Editando item"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="stock-movement-batch-quantity"
              className="text-[10px] font-bold uppercase tracking-wider text-neutral-400"
            >
              Quantidade
            </label>
            <NumberInput
              id="stock-movement-batch-quantity"
              value={form.quantity ? Number(form.quantity) : undefined}
              onValueChange={(value) =>
                onQuantityChange(value !== undefined ? String(value) : "")
              }
              className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 font-mono text-sm text-white focus:border-blue-600"
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="stock-movement-batch-manufactured-date"
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400"
            >
              <CalendarDays className="size-3" />
              Fabricação
            </label>
            <Input
              id="stock-movement-batch-manufactured-date"
              type="date"
              value={form.manufacturedDate}
              onChange={(event) => onManufacturedDateChange(event.target.value)}
              className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm text-white focus:border-blue-600"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="stock-movement-batch-expiration-date"
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400"
            >
              <CalendarDays className="size-3" />
              Validade
            </label>
            <Input
              id="stock-movement-batch-expiration-date"
              type="date"
              value={form.expirationDate}
              onChange={(event) => onExpirationDateChange(event.target.value)}
              className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm text-white focus:border-blue-600"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="stock-movement-batch-cost-price"
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400"
            >
              <DollarSign className="size-3" />
              Preço de custo
            </label>
            <CurrencyInput
              id="stock-movement-batch-cost-price"
              value={form.costPrice}
              onValueChange={onCostPriceChange}
              placeholder="0,00"
              className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm text-white focus:border-blue-600"
            />
          </div>
          <div className="space-y-2 md:col-start-2">
            <label
              htmlFor="stock-movement-batch-selling-price"
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400"
            >
              <DollarSign className="size-3" />
              Preço de venda
            </label>
            <CurrencyInput
              id="stock-movement-batch-selling-price"
              value={form.sellingPrice}
              onValueChange={onSellingPriceChange}
              placeholder="0,00"
              className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm font-bold text-emerald-500 focus:border-emerald-600"
            />
          </div>
        </div>

        {form.error && (
          <div className="rounded-[4px] border border-rose-900/30 bg-rose-950/10 px-4 py-3 text-xs font-medium text-rose-400">
            {form.error}
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
}
