"use client";

import type { ReactNode } from "react";
import {
  AlertCircle,
  CalendarDays,
  Check,
  Loader2,
  Minus,
  PackageCheck,
  Plus,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { NumberInput } from "@/components/ui/number-input";
import { cn } from "@/lib/utils";
import type {
  TransferBatchDrawerState,
  TransferBatchOption,
} from "./new-transfer.types";

interface NewTransferBatchDrawerProps {
  form: TransferBatchDrawerState;
  batches: TransferBatchOption[];
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onBatchChange: (batchId: string) => void;
  onQuantityChange: (quantity: string) => void;
  onQuantityIncrement: () => void;
  onQuantityDecrement: () => void;
  onConfirm: () => void;
}

const transferBatchDateFormatter = new Intl.DateTimeFormat("pt-BR");

export function NewTransferBatchDrawer({
  form,
  batches,
  isLoading,
  onOpenChange,
  onBatchChange,
  onQuantityChange,
  onQuantityIncrement,
  onQuantityDecrement,
  onConfirm,
}: NewTransferBatchDrawerProps) {
  const selectedBatch = batches.find((batch) => batch.id === form.selectedBatchId);

  return (
    <Drawer open={form.isOpen} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="max-h-[88vh] rounded-t-[4px] border-neutral-800 bg-[#171717]">
        <TransferBatchDrawerHeader onOpenChange={onOpenChange} />
        <div className="min-h-0 overflow-y-auto px-4 pb-4">
          <TransferBatchProductSummary form={form} />
          <TransferBatchOptions
            batches={batches}
            isLoading={isLoading}
            quantity={form.quantity}
            selectedBatchId={form.selectedBatchId}
            onBatchChange={onBatchChange}
          />
          <TransferBatchQuantitySection
            quantity={form.quantity}
            selectedBatch={selectedBatch}
            onQuantityChange={onQuantityChange}
            onQuantityIncrement={onQuantityIncrement}
            onQuantityDecrement={onQuantityDecrement}
          />
          <TransferBatchDrawerError error={form.error} />
        </div>
        <DrawerFooter className="flex-row gap-3 border-t border-neutral-800 px-4 pb-5 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 flex-1 rounded-[4px] border-neutral-800 text-xs font-bold uppercase tracking-wide"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={isLoading || batches.length === 0}
            onClick={onConfirm}
            className="h-10 flex-1 rounded-[4px] bg-emerald-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-emerald-700 disabled:opacity-40"
          >
            Adicionar
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function TransferBatchDrawerHeader({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <DrawerHeader className="border-b border-neutral-800 px-4 py-3 text-left">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <PackageCheck className="size-4 text-emerald-400" strokeWidth={2.5} />
          <div className="min-w-0">
            <DrawerTitle className="text-sm font-bold uppercase tracking-wide text-white">
              Qual lote será utilizado?
            </DrawerTitle>
            <DrawerDescription className="text-[10px] text-neutral-500">
              Escolha o lote e a quantidade que será transferida
            </DrawerDescription>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="size-8 rounded-[4px] text-neutral-400 hover:bg-neutral-800 hover:text-white"
        >
          <X className="size-4" strokeWidth={2} />
        </Button>
      </div>
    </DrawerHeader>
  );
}

function TransferBatchProductSummary({
  form,
}: {
  form: TransferBatchDrawerState;
}) {
  return (
    <div className="mt-4 rounded-[4px] border border-neutral-800 bg-neutral-900 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
        Produto
      </p>
      <p className="mt-1 truncate text-sm font-bold text-white">
        {form.productName || "Produto"}
      </p>
    </div>
  );
}

function TransferBatchOptions({
  batches,
  isLoading,
  quantity,
  selectedBatchId,
  onBatchChange,
}: {
  batches: TransferBatchOption[];
  isLoading: boolean;
  quantity: string;
  selectedBatchId: string;
  onBatchChange: (batchId: string) => void;
}) {
  if (isLoading) return <TransferBatchLoading />;
  if (batches.length === 0) return <TransferBatchEmpty />;

  return (
    <div className="mt-4 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
        Lotes disponíveis
      </p>
      {batches.map((batch) => (
        <TransferBatchOptionCard
          key={batch.id}
          batch={batch}
          isSelected={batch.id === selectedBatchId}
          quantity={quantity}
          onBatchChange={onBatchChange}
        />
      ))}
    </div>
  );
}

function TransferBatchOptionCard({
  batch,
  isSelected,
  quantity,
  onBatchChange,
}: {
  batch: TransferBatchOption;
  isSelected: boolean;
  quantity: string;
  onBatchChange: (batchId: string) => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => onBatchChange(batch.id)}
      className={cn(
        "h-auto w-full rounded-[4px] border p-0 text-left hover:bg-neutral-800 hover:text-white",
        isSelected
          ? "border-emerald-600 bg-emerald-950/20"
          : "border-neutral-800 bg-[#0A0A0A]",
      )}
    >
      <div className="flex w-full items-start gap-3 p-3">
        <TransferBatchSelectionIcon isSelected={isSelected} />
        <TransferBatchOptionDetails batch={batch} />
        <TransferBatchQuantityBadge
          isSelected={isSelected}
          quantity={quantity}
        />
      </div>
    </Button>
  );
}

function TransferBatchSelectionIcon({ isSelected }: { isSelected: boolean }) {
  return (
    <span
      className={cn(
        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[4px] border",
        isSelected
          ? "border-emerald-500 bg-emerald-600 text-white"
          : "border-neutral-700 bg-neutral-900 text-transparent",
      )}
    >
      <Check className="size-3.5" strokeWidth={2.5} />
    </span>
  );
}

function TransferBatchOptionDetails({
  batch,
}: {
  batch: TransferBatchOption;
}) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block font-mono text-xs font-bold tracking-tighter text-white">
        {batch.batchCode}
      </span>
      <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] uppercase tracking-wide text-neutral-500">
        <span>{batch.quantity} un. disponíveis</span>
        <span className="flex items-center gap-1">
          <CalendarDays className="size-3" />
          Validade: {formatTransferBatchDate(batch.expirationDate, "Sem validade")}
        </span>
      </span>
      {batch.manufacturedDate ? (
        <span className="mt-1 block text-[10px] uppercase tracking-wide text-neutral-600">
          Fabricação: {formatTransferBatchDate(batch.manufacturedDate, "-")}
        </span>
      ) : null}
    </span>
  );
}

function TransferBatchQuantityBadge({
  isSelected,
  quantity,
}: {
  isSelected: boolean;
  quantity: string;
}) {
  if (!isSelected) return null;

  return (
    <span className="shrink-0 rounded-[4px] border border-emerald-900/50 bg-emerald-950/30 px-2 py-1 font-mono text-[10px] font-bold text-emerald-400">
      {quantity || "0"} un.
    </span>
  );
}

function TransferBatchQuantitySection({
  quantity,
  selectedBatch,
  onQuantityChange,
  onQuantityIncrement,
  onQuantityDecrement,
}: {
  quantity: string;
  selectedBatch?: TransferBatchOption;
  onQuantityChange: (quantity: string) => void;
  onQuantityIncrement: () => void;
  onQuantityDecrement: () => void;
}) {
  const numericQuantity = Number(quantity);
  const canDecrement = Number.isFinite(numericQuantity) && numericQuantity > 1;
  const canIncrement = selectedBatch
    ? Number.isFinite(numericQuantity) && numericQuantity < selectedBatch.quantity
    : true;

  return (
    <div className="mt-4 space-y-2">
      <label
        htmlFor="transfer-batch-quantity"
        className="text-[10px] font-bold uppercase tracking-wider text-neutral-400"
      >
        Quantidade a transferir
      </label>
      <div className="flex">
        <TransferBatchQuantityButton
          disabled={!canDecrement}
          onClick={onQuantityDecrement}
          label="Diminuir"
        >
          <Minus className="size-4" />
        </TransferBatchQuantityButton>
        <NumberInput
          id="transfer-batch-quantity"
          value={quantity ? Number(quantity) : undefined}
          onValueChange={(value) =>
            onQuantityChange(value !== undefined ? String(value) : "")
          }
          className="h-10 min-w-0 flex-1 rounded-none border-x-0 border-neutral-800 bg-neutral-900 text-center font-mono text-sm text-white focus:border-blue-600"
          placeholder="1"
        />
        <TransferBatchQuantityButton
          disabled={!canIncrement}
          onClick={onQuantityIncrement}
          label="Aumentar"
        >
          <Plus className="size-4" />
        </TransferBatchQuantityButton>
      </div>
      {selectedBatch ? (
        <p className="text-[10px] text-neutral-500">
          Lote selecionado com {selectedBatch.quantity} un. disponíveis.
        </p>
      ) : null}
    </div>
  );
}

function TransferBatchQuantityButton({
  children,
  disabled,
  label,
  onClick,
}: {
  children: ReactNode;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      className="size-10 rounded-[4px] border-neutral-800 bg-neutral-900 p-0 text-neutral-400 hover:bg-neutral-800 hover:text-white"
      aria-label={label}
    >
      {children}
    </Button>
  );
}

function TransferBatchDrawerError({ error }: { error: string | null }) {
  if (!error) return null;

  return (
    <div className="mt-4 flex items-center gap-2 rounded-[4px] border border-rose-900/30 bg-rose-950/10 px-4 py-3">
      <AlertCircle className="size-4 shrink-0 text-rose-500" strokeWidth={2} />
      <p className="text-xs font-medium text-rose-400">{error}</p>
    </div>
  );
}

function TransferBatchLoading() {
  return (
    <div className="mt-4 flex h-16 items-center gap-2 rounded-[4px] border border-neutral-800 bg-[#0A0A0A] px-4 text-xs text-neutral-500">
      <Loader2 className="size-4 animate-spin" />
      Carregando lotes disponíveis…
    </div>
  );
}

function TransferBatchEmpty() {
  return (
    <div className="mt-4 rounded-[4px] border border-amber-900/30 bg-amber-950/10 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-amber-400">
        Nenhum lote disponível
      </p>
      <p className="mt-1 text-xs text-amber-200/70">
        Este produto não possui quantidade disponível no depósito atual.
      </p>
    </div>
  );
}

function formatTransferBatchDate(value: string | null, fallback: string): string {
  if (!value) return fallback;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return value;
  return transferBatchDateFormatter.format(new Date(timestamp));
}
