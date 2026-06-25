"use client";

import { Loader2, Package, ScanLine, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveThumbnailUrl } from "@/lib/thumbnails";
import type { NewTransferViewProps } from "./new-transfer.types";

interface NewTransferProductSearchProps {
  viewState: NewTransferViewProps;
}

export function TransferProductSearch({
  viewState,
}: NewTransferProductSearchProps) {
  const {
    isLoading,
    isProductOptionsOpen,
    isProductSearchLoading,
    onProductClear,
    onProductSearchBlur,
    onProductSearchChange,
    onProductSearchFocus,
    onProductSelect,
    onScannerOpenChange,
    productOptions,
    productSearchQuery,
  } = viewState;

  return (
    <div className="space-y-2">
      <label
        htmlFor="transfer-product-search"
        className="text-xs font-bold text-neutral-400"
      >
        PRODUTO
      </label>
      <div className="relative">
        <div className="flex gap-2">
          <TransferProductSearchInput
            isLoading={isLoading}
            productSearchQuery={productSearchQuery}
            onProductClear={onProductClear}
            onProductSearchBlur={onProductSearchBlur}
            onProductSearchChange={onProductSearchChange}
            onProductSearchFocus={onProductSearchFocus}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => onScannerOpenChange(true)}
            className="size-10 shrink-0 rounded-[4px] border-neutral-800 bg-neutral-900 p-0 hover:bg-neutral-800 hover:text-white"
            aria-label="Ler código de barras"
          >
            <ScanLine className="size-4" strokeWidth={2.5} />
          </Button>
        </div>
        <TransferProductOptions
          isOpen={isProductOptionsOpen}
          isLoading={isProductSearchLoading}
          products={productOptions}
          onProductSelect={onProductSelect}
        />
      </div>
    </div>
  );
}

function TransferProductSearchInput({
  isLoading,
  productSearchQuery,
  onProductClear,
  onProductSearchBlur,
  onProductSearchChange,
  onProductSearchFocus,
}: {
  isLoading: boolean;
  productSearchQuery: string;
  onProductClear: () => void;
  onProductSearchBlur: () => void;
  onProductSearchChange: (query: string) => void;
  onProductSearchFocus: () => void;
}) {
  return (
    <div className="relative flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
      <Input
        id="transfer-product-search"
        value={productSearchQuery}
        onChange={(event) => onProductSearchChange(event.target.value)}
        onFocus={onProductSearchFocus}
        onBlur={onProductSearchBlur}
        disabled={isLoading}
        placeholder={
          isLoading
            ? "Carregando produtos…"
            : "Pesquisar produto por nome, SKU ou código"
        }
        className="h-10 w-full rounded-[4px] border-2 border-neutral-800 bg-neutral-900 pl-9 pr-9 text-sm text-white focus:border-blue-600 disabled:opacity-40"
      />
      {productSearchQuery ? (
        <Button
          type="button"
          variant="ghost"
          onClick={onProductClear}
          className="absolute right-1 top-1 size-8 rounded-[4px] p-0 text-neutral-500 hover:bg-neutral-800 hover:text-white"
          aria-label="Limpar produto"
        >
          <X className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}

function TransferProductOptions({
  isOpen,
  isLoading,
  products,
  onProductSelect,
}: {
  isOpen: boolean;
  isLoading: boolean;
  products: NewTransferViewProps["productOptions"];
  onProductSelect: NewTransferViewProps["onProductSelect"];
}) {
  if (!isOpen || (!isLoading && products.length === 0)) return null;

  const handleProductOptionSelect = (
    product: NewTransferViewProps["productOptions"][number],
  ): void => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    onProductSelect(product);
  };

  return (
    <div className="absolute left-0 right-12 top-12 z-30 overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717]">
      {isLoading ? (
        <div className="flex h-10 items-center gap-2 px-3 text-xs text-neutral-500">
          <Loader2 className="size-3.5 animate-spin" />
          Buscando produtos…
        </div>
      ) : (
        products.map((product) => (
          <Button
            key={product.id}
            type="button"
            variant="ghost"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => handleProductOptionSelect(product)}
            className="flex h-auto w-full items-center justify-start gap-3 rounded-none border-b border-neutral-800 px-3 py-2 text-left hover:bg-neutral-800 hover:text-white last:border-b-0"
          >
            <TransferProductOptionImage product={product} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-white">
                {product.name}
              </span>
              <span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-wide text-neutral-500">
                {product.stockQuantityLabel || "Quantidade: 0 un."}
              </span>
            </span>
          </Button>
        ))
      )}
    </div>
  );
}

function TransferProductOptionImage({
  product,
}: {
  product: NewTransferViewProps["productOptions"][number];
}) {
  const imageUrl = resolveThumbnailUrl(product, "sm");
  if (imageUrl) {
    return (
      <span
        role="img"
        aria-label={`Foto de ${product.name}`}
        className="size-10 shrink-0 rounded-[4px] border border-neutral-800 bg-neutral-900 bg-cover bg-center"
        style={{ backgroundImage: `url("${imageUrl}")` }}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label="Produto sem foto"
      className="flex size-10 shrink-0 items-center justify-center rounded-[4px] border border-neutral-800 bg-neutral-900 text-neutral-500"
    >
      <Package className="size-4" />
    </span>
  );
}
