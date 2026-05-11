"use client";

import {
  CalendarDays,
  DollarSign,
  History,
  Minus,
  PackageCheck,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { cn } from "@/lib/utils";
import type {
  ExistingProductBatchFormState,
  ExistingProductProfitSummary,
  ExistingProductProfitSummaryKind,
  ExistingProductPriceSuggestion,
} from "./create-stock-movement.types";

interface StockMovementBatchDataModalProps {
  form: ExistingProductBatchFormState;
  onOpenChange: (open: boolean) => void;
  onQuantityChange: (quantity: string) => void;
  onQuantityIncrement: () => void;
  onQuantityDecrement: () => void;
  onManufacturedDateChange: (date: string) => void;
  onExpirationDateChange: (date: string) => void;
  onCostPriceChange: (price?: number) => void;
  onSellingPriceChange: (price?: number) => void;
  onApplyCostPriceSuggestion: () => void;
  onApplySalePriceSuggestion: () => void;
  onConfirm: () => void;
  costPriceSuggestion: ExistingProductPriceSuggestion | null;
  salePriceSuggestion: ExistingProductPriceSuggestion | null;
  isPriceSuggestionLoading: boolean;
  shouldShowMissingCostPriceSuggestion: boolean;
  shouldShowMissingSalePriceSuggestion: boolean;
  profitSummary: ExistingProductProfitSummary;
}

export function StockMovementBatchDataModal({
  form,
  onOpenChange,
  onQuantityChange,
  onQuantityIncrement,
  onQuantityDecrement,
  onManufacturedDateChange,
  onExpirationDateChange,
  onCostPriceChange,
  onSellingPriceChange,
  onApplyCostPriceSuggestion,
  onApplySalePriceSuggestion,
  onConfirm,
  costPriceSuggestion,
  salePriceSuggestion,
  isPriceSuggestionLoading,
  shouldShowMissingCostPriceSuggestion,
  shouldShowMissingSalePriceSuggestion,
  profitSummary,
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
            Adicionar lote à movimentação
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
            <div className="flex">
              <Button
                type="button"
                variant="outline"
                onClick={onQuantityDecrement}
                className="h-10 w-10 rounded-l-[4px] rounded-r-none border-neutral-800 bg-neutral-900 p-0 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                aria-label="Diminuir quantidade"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <NumberInput
                id="stock-movement-batch-quantity"
                value={form.quantity ? Number(form.quantity) : undefined}
                onValueChange={(value) =>
                  onQuantityChange(value !== undefined ? String(value) : "")
                }
                className="h-10 min-w-0 flex-1 rounded-none border-x-0 border-neutral-800 bg-neutral-900 text-center font-mono text-sm text-white focus:border-blue-600"
                placeholder="0"
              />
              <Button
                type="button"
                variant="outline"
                onClick={onQuantityIncrement}
                className="h-10 w-10 rounded-l-none rounded-r-[4px] border-neutral-800 bg-neutral-900 p-0 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                aria-label="Aumentar quantidade"
              >
                <Plus className="size-4" />
              </Button>
            </div>
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
            <PriceSuggestionArea
              title="Último preço de custo"
              suggestion={costPriceSuggestion}
              isLoading={isPriceSuggestionLoading}
              shouldShowMissingSuggestion={shouldShowMissingCostPriceSuggestion}
              onApply={onApplyCostPriceSuggestion}
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
            <div className="relative">
              <CurrencyInput
                id="stock-movement-batch-selling-price"
                value={form.sellingPrice}
                onValueChange={onSellingPriceChange}
                placeholder="0,00"
                className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 pr-[140px] text-sm font-bold text-emerald-500 focus:border-emerald-600"
              />
              <ProfitTags summary={profitSummary} />
            </div>
            <PriceSuggestionArea
              title="Último preço de venda"
              suggestion={salePriceSuggestion}
              isLoading={isPriceSuggestionLoading}
              shouldShowMissingSuggestion={shouldShowMissingSalePriceSuggestion}
              onApply={onApplySalePriceSuggestion}
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

function PriceSuggestionArea({
  title,
  suggestion,
  isLoading,
  shouldShowMissingSuggestion,
  onApply,
}: {
  title: string;
  suggestion: ExistingProductPriceSuggestion | null;
  isLoading: boolean;
  shouldShowMissingSuggestion: boolean;
  onApply: () => void;
}) {
  if (isLoading) {
    return <PriceSuggestionLoading />;
  }

  if (!suggestion) {
    return shouldShowMissingSuggestion ? <MissingPriceSuggestion /> : null;
  }

  return (
    <PriceSuggestionCard title={title} suggestion={suggestion} onApply={onApply} />
  );
}

function PriceSuggestionLoading() {
  return (
    <div className="flex items-center gap-2 rounded-[4px] border border-neutral-800 bg-neutral-950 px-3 py-2">
      <History className="h-3.5 w-3.5 shrink-0 animate-pulse text-blue-500/50" />
      <span className="text-[11px] font-medium text-neutral-500">
        Buscando último preço...
      </span>
    </div>
  );
}

function MissingPriceSuggestion() {
  return null;
}

function PriceSuggestionCard({
  title,
  suggestion,
  onApply,
}: {
  title: string;
  suggestion: ExistingProductPriceSuggestion;
  onApply: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[4px] border border-neutral-800 bg-neutral-950 px-3 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <History className="h-3.5 w-3.5 shrink-0 text-blue-500" />
        <p className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="truncate text-[11px] font-medium text-neutral-400">
            {title}
          </span>
          <span className="shrink-0 font-mono text-[11px] font-bold text-white">
            {suggestion.priceLabel}
          </span>
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={onApply}
        className="h-6 shrink-0 rounded-[4px] border-blue-900/40 bg-blue-600/10 px-2.5 text-[10px] font-bold uppercase tracking-wide text-blue-400 hover:bg-blue-600/20 hover:text-blue-300"
      >
        Usar preço
      </Button>
    </div>
  );
}

function ProfitTags({
  summary,
}: {
  summary: ExistingProductProfitSummary;
}) {
  if (summary.kind === "incomplete") return null;

  const Icon = profitSummaryIconByKind[summary.kind];
  const style = profitSummaryStyleByKind[summary.kind];

  return (
    <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
      <div className={cn("flex h-7 items-center gap-1.5 rounded-[4px] border px-2", style.card)}>
        <Icon className={cn("h-3.5 w-3.5 shrink-0", style.icon)} />
        <span className={cn("text-[11px] font-bold tracking-wide", style.value)}>
          {summary.unitResultLabel}
        </span>
      </div>
      <div className={cn("flex h-7 items-center rounded-[4px] border px-2", style.card)}>
        <span className={cn("text-[11px] font-bold tracking-wide", style.value)}>
          {summary.marginLabel}
        </span>
      </div>
    </div>
  );
}

const profitSummaryStyleByKind: Record<
  ExistingProductProfitSummaryKind,
  { card: string; icon: string; value: string }
> = {
  incomplete: {
    card: "border-neutral-800 bg-neutral-950",
    icon: "text-neutral-500",
    value: "text-neutral-300",
  },
  loss: {
    card: "border-rose-900/40 bg-rose-950/10",
    icon: "text-rose-500",
    value: "text-rose-400",
  },
  profit: {
    card: "border-emerald-900/40 bg-emerald-950/10",
    icon: "text-emerald-500",
    value: "text-emerald-400",
  },
  zero: {
    card: "border-neutral-800 bg-neutral-950",
    icon: "text-neutral-500",
    value: "text-neutral-300",
  },
};

const profitSummaryIconByKind = {
  incomplete: Minus,
  loss: TrendingDown,
  profit: TrendingUp,
  zero: Minus,
} satisfies Record<ExistingProductProfitSummaryKind, typeof Minus>;
