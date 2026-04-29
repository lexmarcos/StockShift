"use client";

import Link from "next/link";
import {
  PackagePlus,
  Box,
  Calendar,
  FileText,
  DollarSign,
  AlertCircle,
  Loader2,
  Scan,
  Search,
  X,
  Minus,
  Plus,
} from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { BatchCreateFormData } from "./batches-create.schema";
import type { ProductSearchOption } from "./batches-create.types";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { CurrencyInput } from "@/components/ui/currency-input";
import { NumberInput } from "@/components/ui/number-input";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionGate } from "@/components/permission-gate";
import { BarcodeScannerModal } from "@/components/product/barcode-scanner-modal";

interface BatchCreateViewProps {
  form: UseFormReturn<BatchCreateFormData>;
  onSubmit: (data: BatchCreateFormData) => void;
  productSearchQuery: string;
  productOptions: ProductSearchOption[];
  isProductSearchLoading: boolean;
  isProductOptionsOpen: boolean;
  onProductSearchChange: (query: string) => void;
  onProductSearchFocus: () => void;
  onProductSearchBlur: () => void;
  onProductSelect: (product: ProductSearchOption) => void;
  onProductClear: () => void;
  openScanner: () => void;
  closeScanner: () => void;
  isScannerOpen: boolean;
  handleBarcodeScan: (barcode: string) => void;
  selectedWarehouseId: string | null;
  onQuantityIncrement: () => void;
  onQuantityDecrement: () => void;
  selectedProduct?: { hasExpiration: boolean } | null;
}

export const BatchCreateView = ({
  form,
  onSubmit,
  productSearchQuery,
  productOptions,
  isProductSearchLoading,
  isProductOptionsOpen,
  onProductSearchChange,
  onProductSearchFocus,
  onProductSearchBlur,
  onProductSelect,
  onProductClear,
  openScanner,
  closeScanner,
  isScannerOpen,
  handleBarcodeScan,
  selectedWarehouseId,
  onQuantityIncrement,
  onQuantityDecrement,
  selectedProduct,
}: BatchCreateViewProps) => {
  const { isSubmitting } = form.formState;

  // Watch for profit calculations
  const costPrice = form.watch("costPrice") || 0;
  const sellingPrice = form.watch("sellingPrice") || 0;
  const profit = sellingPrice - costPrice;
  const margin = costPrice > 0 ? (profit / costPrice) * 100 : 0;
  const isProfitable = profit > 0;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24 md:pb-20 font-sans text-neutral-200">
      <BarcodeScannerModal
        open={isScannerOpen}
        onClose={closeScanner}
        onScan={handleBarcodeScan}
      />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left Column - Main Info */}
              <div className="space-y-6 lg:col-span-2">
                {/* Identification Card */}
                <Card className="rounded-[4px] border border-neutral-800 bg-[#171717]">
                  <CardHeader className="border-b border-neutral-800 pb-4">
                    <div className="flex items-center gap-2">
                      <Box className="h-4 w-4 text-blue-500" />
                      <CardTitle className="text-sm font-bold uppercase tracking-wide text-white">
                        Identificação e Origem
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-5">
                    <FormField
                      control={form.control}
                      name="productId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                            Produto <span className="text-rose-500">*</span>
                          </FormLabel>
                          <input type="hidden" {...field} />
                          <div className="relative">
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                                <FormControl>
                                  <Input
                                    value={productSearchQuery}
                                    onChange={(event) =>
                                      onProductSearchChange(event.target.value)
                                    }
                                    onFocus={onProductSearchFocus}
                                    onBlur={() => {
                                      field.onBlur();
                                      onProductSearchBlur();
                                    }}
                                    placeholder="Pesquisar por nome, SKU ou código de barras"
                                    className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 pl-9 pr-9 text-sm focus:border-blue-600 focus:ring-0"
                                  />
                                </FormControl>
                                {productSearchQuery && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={onProductClear}
                                    className="absolute right-1 top-1 h-8 w-8 rounded-[4px] p-0 text-neutral-500 hover:bg-neutral-800 hover:text-white"
                                    aria-label="Limpar produto"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={openScanner}
                                className="h-10 w-10 shrink-0 rounded-[4px] border-neutral-800 bg-neutral-900 p-0 hover:bg-neutral-800 hover:text-white"
                                aria-label="Ler código de barras"
                              >
                                <Scan className="h-4 w-4" />
                              </Button>
                            </div>

                            {isProductOptionsOpen &&
                              (isProductSearchLoading ||
                                productOptions.length > 0) && (
                                <div className="absolute left-0 right-12 top-12 z-30 overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717]">
                                  {isProductSearchLoading && (
                                    <div className="flex h-10 items-center gap-2 px-3 text-xs text-neutral-500">
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      Buscando produtos...
                                    </div>
                                  )}
                                  {!isProductSearchLoading &&
                                    productOptions.map((product) => (
                                      <Button
                                        key={product.id}
                                        type="button"
                                        variant="ghost"
                                        onMouseDown={(event) =>
                                          event.preventDefault()
                                        }
                                        onClick={() => onProductSelect(product)}
                                        className="flex h-auto w-full items-center justify-start gap-3 rounded-none border-b border-neutral-800 px-3 py-2 text-left hover:bg-neutral-800 hover:text-white last:border-b-0"
                                      >
                                        {product.imageUrl ? (
                                          <span
                                            role="img"
                                            aria-label={`Foto de ${product.name}`}
                                            className="h-10 w-10 shrink-0 rounded-[4px] border border-neutral-800 bg-neutral-900 bg-cover bg-center"
                                            style={{
                                              backgroundImage: `url("${product.imageUrl}")`,
                                            }}
                                          />
                                        ) : (
                                          <span
                                            role="img"
                                            aria-label="Produto sem foto"
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] border border-neutral-800 bg-neutral-900 text-neutral-500"
                                          >
                                            <Box className="h-4 w-4" />
                                          </span>
                                        )}
                                        <span className="min-w-0">
                                          <span className="block truncate text-sm font-semibold text-white">
                                            {product.name}
                                          </span>
                                          <span className="mt-0.5 block truncate text-[10px] font-mono uppercase tracking-wide text-neutral-500">
                                            {product.sku || "SEM SKU"}
                                            {product.barcode
                                              ? ` - ${product.barcode}`
                                              : ""}
                                          </span>
                                        </span>
                                      </Button>
                                    ))}
                                </div>
                              )}
                          </div>
                          <FormMessage className="text-xs text-rose-500" />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Financials Card */}
                <Card className="rounded-[4px] border border-neutral-800 bg-[#171717]">
                  <CardHeader className="border-b border-neutral-800 pb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                      <CardTitle className="text-sm font-bold uppercase tracking-wide text-white">
                        Financeiro e Estoque
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="grid gap-5 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => {
                          const { onChange, value, ...rest } = field;
                          return (
                            <FormItem>
                              <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                Quantidade{" "}
                                <span className="text-rose-500">*</span>
                              </FormLabel>
                              <div className="flex">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={onQuantityDecrement}
                                  className="h-10 w-10 rounded-r-none rounded-l-[4px] border-neutral-800 bg-neutral-900 p-0 hover:bg-neutral-800 hover:text-white"
                                  aria-label="Diminuir quantidade"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <FormControl>
                                  <NumberInput
                                    {...rest}
                                    value={value}
                                    onValueChange={onChange}
                                    mode="integer"
                                    className="h-10 min-w-0 flex-1 rounded-none border-x-0 border-neutral-800 bg-neutral-900 text-center text-sm focus:border-blue-600 focus:ring-0"
                                  />
                                </FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={onQuantityIncrement}
                                  className="h-10 w-10 rounded-l-none rounded-r-[4px] border-neutral-800 bg-neutral-900 p-0 hover:bg-neutral-800 hover:text-white"
                                  aria-label="Aumentar quantidade"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              <FormMessage className="text-xs text-rose-500" />
                            </FormItem>
                          );
                        }}
                      />
                      <FormField
                        control={form.control}
                        name="costPrice"
                        render={({ field }) => {
                          const { onChange, value, ...rest } = field;
                          return (
                            <FormItem>
                              <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                Custo Unitário
                              </FormLabel>
                              <FormControl>
                                <CurrencyInput
                                  {...rest}
                                  value={value}
                                  onValueChange={onChange}
                                  placeholder="0,00"
                                  className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
                                />
                              </FormControl>
                              <FormMessage className="text-xs text-rose-500" />
                            </FormItem>
                          );
                        }}
                      />
                      <FormField
                        control={form.control}
                        name="sellingPrice"
                        render={({ field }) => {
                          const { onChange, value, ...rest } = field;
                          return (
                            <FormItem>
                              <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                Preço de Venda
                              </FormLabel>
                              <FormControl>
                                <CurrencyInput
                                  {...rest}
                                  value={value}
                                  onValueChange={onChange}
                                  placeholder="0,00"
                                  className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-emerald-600 focus:ring-0 text-emerald-500 font-bold"
                                />
                              </FormControl>
                              <FormMessage className="text-xs text-rose-500" />
                            </FormItem>
                          );
                        }}
                      />
                    </div>

                    {/* Profitability Indicator */}
                    <div
                      className={cn(
                        "mt-4 rounded-[4px] border px-4 py-3 flex items-center justify-between",
                        isProfitable
                          ? "border-emerald-900/30 bg-emerald-950/10"
                          : "border-rose-900/30 bg-rose-950/10",
                      )}
                    >
                      <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                        Lucro Estimado
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-bold font-mono",
                            isProfitable ? "text-emerald-500" : "text-rose-500",
                          )}
                        >
                          {(profit / 100).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                        <div
                          className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded border ml-1",
                            isProfitable
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                              : "border-rose-500/30 bg-rose-500/10 text-rose-500",
                          )}
                        >
                          {margin.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Secondary Info */}
              <div className="space-y-6">
                {/* Dates Card */}
                <Card className="rounded-[4px] border border-neutral-800 bg-[#171717]">
                  <CardHeader className="border-b border-neutral-800 pb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber-500" />
                      <CardTitle className="text-sm font-bold uppercase tracking-wide text-white">
                        Vigência
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-5">
                    <FormField
                      control={form.control}
                      name="manufacturedDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                            Data de Fabricação
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs text-rose-500" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="expirationDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                            Data de Validade
                            {selectedProduct?.hasExpiration && (
                              <span className="text-rose-500 ml-1">*</span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
                              {...field}
                            />
                          </FormControl>
                          {selectedProduct?.hasExpiration && (
                            <FormDescription className="text-[10px] text-amber-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Obrigatório para este produto
                            </FormDescription>
                          )}
                          <FormMessage className="text-xs text-rose-500" />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Notes Card */}
                <Card className="rounded-[4px] border border-neutral-800 bg-[#171717]">
                  <CardHeader className="border-b border-neutral-800 pb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-neutral-500" />
                      <CardTitle className="text-sm font-bold uppercase tracking-wide text-white">
                        Observações
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Detalhes adicionais sobre o lote..."
                              className="min-h-[120px] resize-none rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs text-rose-500" />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-800 bg-[#0A0A0A]/95 backdrop-blur-sm p-4 md:ml-[var(--sidebar-width)]">
              <div className="mx-auto flex w-full max-w-7xl flex-col md:flex-row items-center md:justify-end gap-3 px-4 md:px-6 lg:px-8">
                <Button
                  variant="outline"
                  type="button"
                  className="h-10 w-full md:w-auto rounded-[4px] border-neutral-700 bg-transparent text-xs font-bold uppercase tracking-wide text-neutral-300 hover:bg-neutral-800 hover:text-white"
                  asChild
                >
                  <Link href="/batches">Cancelar</Link>
                </Button>
                <PermissionGate permission="batches:create">
                  <Button
                    type="submit"
                    className="h-10 w-full md:w-[160px] rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)]"
                    disabled={isSubmitting || !selectedWarehouseId}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <PackagePlus className="mr-2 h-3.5 w-3.5" />
                        Criar Lote
                      </>
                    )}
                  </Button>
                </PermissionGate>
              </div>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
};
