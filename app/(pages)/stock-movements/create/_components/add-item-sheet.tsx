"use client";

import { useState, useEffect } from "react";
import { Package, Check, AlertCircle } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "./quantity-stepper";
import { cn } from "@/lib/utils";
import type { ProductSearchResult, BatchOption } from "../stock-movements-create.types";

interface AddItemSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductSearchResult | null;
  batches: BatchOption[];
  isLoadingBatches: boolean;
  onAddItem: (batchId: string, quantity: number) => void;
  onAddAndFinish: (batchId: string, quantity: number) => void;
}

export const AddItemSheet = ({
  open,
  onOpenChange,
  product,
  batches,
  isLoadingBatches,
  onAddItem,
  onAddAndFinish,
}: AddItemSheetProps) => {
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);
  const maxQuantity = selectedBatch?.quantity || 1;
  const canAdd = selectedBatchId && quantity > 0 && quantity <= maxQuantity;

  useEffect(() => {
    if (open) {
      setSelectedBatchId(null);
      setQuantity(1);
    }
  }, [open, product?.id]);

  useEffect(() => {
    if (batches.length === 1 && !selectedBatchId) {
      setSelectedBatchId(batches[0].id);
    }
  }, [batches, selectedBatchId]);

  useEffect(() => {
    if (selectedBatch && quantity > selectedBatch.quantity) {
      setQuantity(selectedBatch.quantity);
    }
  }, [selectedBatch, quantity]);

  const handleAddAndNext = () => {
    if (canAdd && selectedBatchId) {
      onAddItem(selectedBatchId, quantity);
    }
  };

  const handleAddAndFinish = () => {
    if (canAdd && selectedBatchId) {
      onAddAndFinish(selectedBatchId, quantity);
    }
  };

  const formatExpirationDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-neutral-800 bg-[#171717] max-h-[85vh]">
        <DrawerHeader className="border-b border-neutral-800 pb-4">
          <DrawerTitle className="text-sm font-bold uppercase tracking-wide text-white">
            Adicionar Item
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {product && (
            <div className="flex items-center gap-4 rounded-[4px] border border-neutral-800 bg-neutral-900 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[4px] bg-neutral-800">
                <Package className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{product.name}</p>
                {product.sku && (
                  <p className="text-xs text-neutral-500 mt-0.5">
                    SKU: {product.sku}
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-3">
              Selecionar Lote
            </p>

            {isLoadingBatches ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-700 border-t-blue-500" />
              </div>
            ) : batches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-8 w-8 text-neutral-600 mb-2" />
                <p className="text-sm text-neutral-500">
                  Nenhum lote disponível
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {batches.map((batch) => {
                  const isSelected = batch.id === selectedBatchId;
                  const hasStock = batch.quantity > 0;

                  return (
                    <button
                      key={batch.id}
                      type="button"
                      onClick={() => hasStock && setSelectedBatchId(batch.id)}
                      disabled={!hasStock}
                      className={cn(
                        "w-full flex items-center justify-between rounded-[4px] border p-4 text-left transition-colors",
                        isSelected
                          ? "border-blue-600 bg-blue-500/5"
                          : "border-neutral-800 bg-neutral-900",
                        hasStock ? "hover:bg-neutral-800" : "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full border-2",
                          isSelected
                            ? "border-blue-500 bg-blue-500"
                            : "border-neutral-600"
                        )}>
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {batch.batchCode}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-neutral-400">
                              Disp: {batch.quantity}
                            </span>
                            {batch.expirationDate && (
                              <>
                                <span className="text-neutral-600">•</span>
                                <span className="text-xs text-neutral-400">
                                  Val: {formatExpirationDate(batch.expirationDate)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedBatchId && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-4 text-center">
                Quantidade
              </p>
              <QuantityStepper
                value={quantity}
                onChange={setQuantity}
                max={maxQuantity}
              />
            </div>
          )}
        </div>

        <DrawerFooter className="border-t border-neutral-800 pt-4">
          <Button
            type="button"
            onClick={handleAddAndNext}
            disabled={!canAdd}
            className="h-14 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Adicionar e Próximo
          </Button>
          <button
            type="button"
            onClick={handleAddAndFinish}
            disabled={!canAdd}
            className="text-sm text-neutral-400 hover:text-white disabled:opacity-50 py-2"
          >
            Adicionar e finalizar
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
