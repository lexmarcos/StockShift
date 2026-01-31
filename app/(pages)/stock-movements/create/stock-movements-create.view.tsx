"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Package } from "lucide-react";
import { RouteSelector } from "./_components/route-selector";
import { AddItemForm } from "./_components/add-item-form";
import { MovementItemCard } from "./_components/movement-item-card";
import { MovementSummarySidebar } from "./_components/movement-summary-sidebar";
import type { UseFormReturn } from "react-hook-form";
import type { StockMovementCreateFormData } from "./stock-movements-create.schema";
import type { BatchSummary } from "./stock-movements-create.types";

interface StockMovementCreateViewProps {
  form: UseFormReturn<StockMovementCreateFormData>;
  items: Array<{ id: string }>;
  watchedItems: StockMovementCreateFormData["items"];
  warehouses: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string; sku?: string | null }>;
  batches: BatchSummary[];
  movementType: StockMovementCreateFormData["movementType"];
  sourceWarehouseId: string | undefined;
  destinationWarehouseId: string | undefined;
  sourceWarehouse: { id: string; name: string } | undefined;
  destinationWarehouse: { id: string; name: string } | undefined;
  notes: string;
  setNotes: (notes: string) => void;
  requiresSource: boolean;
  requiresDestination: boolean;
  requiresBatch: boolean;
  totalQuantity: number;
  canSubmit: boolean;
  isSubmitting: boolean;
  addItem: (productId: string, batchId: string, quantity: number) => void;
  removeItem: (index: number) => void;
  updateItemQuantity: (index: number, quantity: number) => void;
  handleSubmit: () => void;
  getBatchesForProduct: (productId: string) => Array<{ id: string; batchCode: string; quantity: number; productId?: string | null }>;
}

export const StockMovementCreateView = ({
  form,
  items,
  watchedItems,
  warehouses,
  products,
  batches,
  movementType,
  sourceWarehouseId,
  destinationWarehouseId,
  sourceWarehouse,
  destinationWarehouse,
  notes,
  setNotes,
  requiresSource,
  requiresDestination,
  requiresBatch,
  totalQuantity,
  canSubmit,
  isSubmitting,
  addItem,
  removeItem,
  updateItemQuantity,
  handleSubmit,
}: StockMovementCreateViewProps) => {
  // Build batches with productId for AddItemForm filtering
  const availableBatches = batches.map((b) => ({
    id: b.id,
    batchCode: b.batchCode || b.batchNumber || b.id.slice(0, 8),
    quantity: b.quantity,
    productId: b.productId || undefined,
  }));

  const MOVEMENT_TYPE_OPTIONS = [
    {
      value: "ENTRY",
      label: "Entrada",
      description: "Compra, produção, devolução de cliente",
      color: "bg-emerald-500"
    },
    {
      value: "EXIT",
      label: "Saída",
      description: "Venda, consumo, descarte",
      color: "bg-rose-500"
    },
    {
      value: "TRANSFER",
      label: "Transferência",
      description: "Entre armazéns",
      color: "bg-blue-500"
    },
    {
      value: "ADJUSTMENT",
      label: "Ajuste",
      description: "Correção, inventário físico",
      color: "bg-amber-500"
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] font-sans text-neutral-200">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link href="/stock-movements">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-[4px] text-neutral-400 hover:bg-neutral-800 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold uppercase tracking-wide text-white">
            Nova Movimentação
          </h1>
        </div>

        {/* Two Column Layout */}
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-4">
            {/* Configuration Card */}
            <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-4">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Configuração
                </span>
              </div>

              <div className="flex items-start gap-6">
                <div className="flex-1">
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Tipo de Movimentação <span className="text-rose-500">*</span>
                  </label>
                  <Select
                    value={movementType}
                    onValueChange={(value) => form.setValue("movementType", value as StockMovementCreateFormData["movementType"])}
                  >
                    <SelectTrigger className="h-10 w-full rounded-[4px] border-neutral-800 bg-neutral-900 text-sm">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717]">
                      {MOVEMENT_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-xs">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${option.color}`} />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Route Card */}
            <RouteSelector
              sourceWarehouseId={sourceWarehouseId || null}
              destinationWarehouseId={destinationWarehouseId || null}
              onSourceChange={(id) => form.setValue("sourceWarehouseId", id)}
              onDestinationChange={(id) => form.setValue("destinationWarehouseId", id)}
              warehouses={warehouses}
              showSource={requiresSource}
              showDestination={requiresDestination}
            />

            {/* Add Item Form */}
            <AddItemForm
              products={products}
              batches={availableBatches}
              onAdd={addItem}
              requiresBatch={requiresBatch}
              disabled={requiresSource && !sourceWarehouseId}
            />

            {/* Items List */}
            <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Itens
                  </span>
                  {items.length > 0 && (
                    <span className="text-[10px] text-neutral-500">({items.length})</span>
                  )}
                </div>
              </div>

              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-3 rounded-full bg-neutral-800 p-4">
                    <Package className="h-8 w-8 text-neutral-600" />
                  </div>
                  <p className="text-sm text-neutral-500">Nenhum item adicionado</p>
                  <p className="text-xs text-neutral-600">Use o formulário acima para adicionar produtos</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item, index) => {
                    const watchedItem = watchedItems[index];
                    if (!watchedItem) return null;

                    const product = products.find((p) => p.id === watchedItem.productId);
                    const batch = batches.find((b) => b.id === watchedItem.batchId);
                    const batchCode = batch?.batchCode || batch?.batchNumber || batch?.id.slice(0, 8) || "—";

                    return (
                      <MovementItemCard
                        key={item.id}
                        productName={product?.name || "Produto"}
                        productSku={product?.sku || undefined}
                        batchCode={batchCode}
                        quantity={watchedItem.quantity}
                        maxQuantity={batch?.quantity || 9999}
                        movementType={movementType}
                        onQuantityChange={(qty) => updateItemQuantity(index, qty)}
                        onRemove={() => removeItem(index)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden w-[340px] shrink-0 lg:block">
            <MovementSummarySidebar
              movementType={movementType}
              sourceWarehouseName={sourceWarehouse?.name || null}
              destinationWarehouseName={destinationWarehouse?.name || null}
              itemCount={items.length}
              totalQuantity={totalQuantity}
              notes={notes}
              onNotesChange={setNotes}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              canSubmit={canSubmit}
            />
          </div>
        </div>

        {/* Mobile Submit Button (shown when sidebar is hidden) */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-neutral-800 bg-[#0A0A0A] p-4 lg:hidden md:ml-[240px]">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="h-12 w-full rounded-[4px] bg-emerald-600 text-xs font-bold uppercase tracking-wide hover:bg-emerald-700 disabled:opacity-30"
          >
            Criar Movimentação
          </Button>
        </div>
      </main>
    </div>
  );
};
