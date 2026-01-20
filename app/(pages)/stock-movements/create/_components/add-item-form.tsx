"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  sku?: string | null;
}

interface Batch {
  id: string;
  batchCode: string;
  quantity: number;
  productId?: string;
}

interface AddItemFormProps {
  products: Product[];
  batches: Batch[];
  onAdd: (productId: string, batchId: string, quantity: number) => void;
  requiresBatch: boolean;
  disabled?: boolean;
}

export function AddItemForm({
  products,
  batches,
  onAdd,
  requiresBatch,
  disabled = false,
}: AddItemFormProps) {
  const [productOpen, setProductOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const filteredBatches = batches.filter((b) => b.productId === selectedProductId);
  const selectedBatch = filteredBatches.find((b) => b.id === selectedBatchId);

  const canAdd =
    selectedProductId &&
    quantity > 0 &&
    (!requiresBatch || selectedBatchId);

  const handleAdd = () => {
    if (!canAdd) return;
    onAdd(selectedProductId, selectedBatchId, quantity);
    setSelectedProductId("");
    setSelectedBatchId("");
    setQuantity(1);
  };

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    setSelectedBatchId("");
    setProductOpen(false);
  };

  return (
    <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          Adicionar Item
        </span>
      </div>

      <div className="flex items-end gap-3">
        {/* Product Search */}
        <div className="flex-[3]">
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            Produto <span className="text-rose-500">*</span>
          </label>
          <Popover open={productOpen} onOpenChange={setProductOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                disabled={disabled}
                className="h-10 w-full justify-between rounded-[4px] border-neutral-800 bg-neutral-900 text-sm hover:bg-neutral-800"
              >
                <span className={cn("truncate", !selectedProduct && "text-neutral-500")}>
                  {selectedProduct ? selectedProduct.name : "Buscar produto..."}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-[--radix-popover-trigger-width] rounded-[4px] border-neutral-800 bg-[#171717] p-0"
            >
              <Command className="bg-transparent">
                <CommandInput placeholder="Filtrar produtos..." className="text-xs" />
                <CommandList className="max-h-[200px]">
                  <CommandEmpty className="py-3 text-center text-xs text-neutral-500">
                    Nenhum produto encontrado
                  </CommandEmpty>
                  <CommandGroup>
                    {products.map((product) => (
                      <CommandItem
                        key={product.id}
                        value={`${product.name} ${product.sku || ""}`}
                        onSelect={() => handleProductChange(product.id)}
                        className="text-xs"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-3.5 w-3.5",
                            product.id === selectedProductId ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{product.name}</span>
                          {product.sku && (
                            <span className="text-[10px] text-neutral-500">SKU: {product.sku}</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Batch Select */}
        <div className="flex-[2]">
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            Lote {requiresBatch && <span className="text-rose-500">*</span>}
          </label>
          <Select
            value={selectedBatchId}
            onValueChange={setSelectedBatchId}
            disabled={disabled || !selectedProductId || !requiresBatch}
          >
            <SelectTrigger className="h-10 w-full rounded-[4px] border-neutral-800 bg-neutral-900 text-sm">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717]">
              {filteredBatches.length === 0 ? (
                <div className="py-2 text-center text-xs text-neutral-500">
                  Nenhum lote disponível
                </div>
              ) : (
                filteredBatches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id} className="text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span>{batch.batchCode}</span>
                      <span className="text-neutral-500">Disp: {batch.quantity}</span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Quantity */}
        <div className="w-24">
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            Qtd <span className="text-rose-500">*</span>
          </label>
          <Input
            type="number"
            min={1}
            max={selectedBatch?.quantity || 9999}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            disabled={disabled}
            className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm text-center"
          />
        </div>

        {/* Add Button */}
        <Button
          type="button"
          onClick={handleAdd}
          disabled={disabled || !canAdd}
          className="h-10 w-10 rounded-[4px] bg-blue-600 p-0 hover:bg-blue-700 disabled:opacity-30"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
