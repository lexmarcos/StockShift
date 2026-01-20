"use client";

import { useState } from "react";
import { Search, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ItemCard } from "./item-card";
import type { MobileWizardItem, ProductSearchResult } from "../stock-movements-create.types";

interface AdditionPhaseProps {
  items: MobileWizardItem[];
  products: ProductSearchResult[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onProductSelect: (product: ProductSearchResult) => void;
  onEditItem: (index: number) => void;
  onRemoveItem: (index: number) => void;
}

export const AdditionPhase = ({
  items,
  products,
  searchQuery,
  onSearchChange,
  onProductSelect,
  onEditItem,
  onRemoveItem,
}: AdditionPhaseProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const showResults = isFocused && searchQuery.length >= 2;
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Search Input */}
      <div className="px-4 py-3 border-b border-neutral-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input
            placeholder="Buscar produto..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            className="h-12 pl-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
          />

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-[4px] border border-neutral-800 bg-[#171717] shadow-xl max-h-[240px] overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <p className="text-center text-sm text-neutral-500 py-4">
                  Nenhum produto encontrado
                </p>
              ) : (
                filteredProducts.slice(0, 10).map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onMouseDown={() => onProductSelect(product)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-neutral-800 border-b border-neutral-800 last:border-b-0"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-neutral-900">
                      <Package className="h-5 w-5 text-neutral-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {product.name}
                      </p>
                      {product.sku && (
                        <p className="text-xs text-neutral-500">
                          SKU: {product.sku}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-16 w-16 text-neutral-700 mb-4" />
            <p className="text-sm font-medium text-neutral-400">
              Nenhum item adicionado
            </p>
            <p className="text-xs text-neutral-600 mt-1">
              Escaneie ou busque produtos para adicionar
            </p>
          </div>
        ) : (
          <>
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-3">
              Itens Adicionados ({items.length})
            </p>
            <div className="space-y-2">
              {items.map((item, index) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onEdit={() => onEditItem(index)}
                  onRemove={() => onRemoveItem(index)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
