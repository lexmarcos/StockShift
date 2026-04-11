"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Search, ShoppingCart, Trash2, Package, Save, ArrowLeftRight } from "lucide-react";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { PAYMENT_METHOD_LABELS, formatCents } from "../sales.types";
import { PdvViewProps } from "./pdv.types";
import { METHODS_WITH_INSTALLMENTS, paymentMethods } from "./pdv.schema";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Link from "next/link";

export const PdvView = ({
  form, cart, searchQuery, onSearchChange, searchResults, isSearching,
  onAddProduct, onRemoveItem, onUpdateQuantity, onChangeBatch,
  subtotal, discountAmount, total, isSubmitting, onSubmit,
  warehouses, isLoadingWarehouses,
}: PdvViewProps) => {
  const selectedPayment = form.watch("paymentMethod");
  const selectedWarehouseId = form.watch("warehouseId");
  const showInstallments = selectedPayment && METHODS_WITH_INSTALLMENTS.includes(selectedPayment);
  const [batchPopoverOpen, setBatchPopoverOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0A0A0A] font-sans text-neutral-200">
      {/* Back button */}
      <div className="border-b border-neutral-800 px-4 py-2">
        <Link href="/sales">
          <Button variant="ghost" size="sm" className="h-8 rounded-[4px] text-neutral-500 hover:text-white text-xs">
            Voltar para Vendas
          </Button>
        </Link>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row" style={{ height: "calc(100vh - 49px)" }}>
          {/* Left Column - Product Catalog */}
          <div className="flex-1 flex flex-col border-r border-neutral-800 overflow-hidden">
            {/* Top Bar */}
            <div className="flex items-center gap-3 p-4 border-b border-neutral-800">
              <FormField
                control={form.control}
                name="warehouseId"
                render={({ field }) => (
                  <FormItem className="w-56">
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-xs font-bold text-white focus:border-blue-600">
                        <SelectValue placeholder={isLoadingWarehouses ? "Carregando..." : "Armazém"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-[4px] border-neutral-800 bg-neutral-900">
                        {warehouses.map((w) => (
                          <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs text-rose-500" />
                  </FormItem>
                )}
              />
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Buscar produto (nome, SKU, código de barras)..."
                  disabled={!selectedWarehouseId}
                  className="h-10 pl-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm text-white placeholder:text-neutral-600 focus:border-blue-600"
                  autoFocus
                />
              </div>
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {!selectedWarehouseId ? (
                <div className="flex flex-col items-center justify-center h-full text-neutral-600">
                  <Package className="h-12 w-12 mb-3" />
                  <p className="text-sm font-bold uppercase tracking-widest">Selecione um armazém</p>
                </div>
              ) : isSearching ? (
                <div className="flex items-center justify-center h-full">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-500 border-t-blue-500" />
                </div>
              ) : searchQuery && searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-neutral-600">
                  <p className="text-sm">Nenhum produto encontrado</p>
                </div>
              ) : searchQuery ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => onAddProduct(product)}
                      className="flex flex-col items-start rounded-[4px] border border-neutral-800 bg-[#171717] p-4 text-left hover:border-blue-600 hover:bg-blue-600/5 transition-colors"
                    >
                      <p className="text-sm font-bold text-white truncate w-full">{product.name}</p>
                      {product.sku && <p className="text-[10px] text-neutral-600 mt-0.5">{product.sku}</p>}
                      <p className="text-xs text-neutral-500 mt-2">
                        Estoque: <span className="font-mono font-bold text-neutral-300">{product.totalQuantity}</span>
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-neutral-600">
                  <Search className="h-12 w-12 mb-3" />
                  <p className="text-sm font-bold uppercase tracking-widest">Busque um produto para adicionar</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Cart */}
          <div className="w-full md:w-96 flex flex-col bg-[#111] border-l border-neutral-800">
            {/* Cart Header */}
            <div className="flex items-center gap-2 p-4 border-b border-neutral-800">
              <ShoppingCart className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-bold text-white uppercase tracking-widest">Carrinho ({cart.length})</span>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-neutral-600">
                  <ShoppingCart className="h-8 w-8 mb-2" />
                  <p className="text-xs uppercase tracking-widest">Carrinho vazio</p>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={item.id} className="rounded-[4px] border border-neutral-800 bg-[#171717] p-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white truncate">{item.productName}</p>
                        <p className="text-[10px] text-neutral-600 mt-0.5">Lote: {item.batchCode}</p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Popover open={batchPopoverOpen === index} onOpenChange={(open) => setBatchPopoverOpen(open ? index : null)}>
                          <PopoverTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-[4px] text-neutral-500 hover:text-blue-400">
                              <ArrowLeftRight className="h-3.5 w-3.5" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 rounded-[4px] border-neutral-800 bg-[#171717] p-2" align="end">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 px-2 pb-2">Selecionar Lote</p>
                            {item.availableBatches.map((batch) => (
                              <button
                                key={batch.batchId}
                                type="button"
                                onClick={() => { onChangeBatch(index, batch.batchId); setBatchPopoverOpen(null); }}
                                className={`w-full text-left px-2 py-1.5 rounded-[4px] text-xs hover:bg-neutral-800 ${batch.batchId === item.batchId ? "bg-blue-600/10 text-blue-400" : "text-neutral-300"}`}
                              >
                                <span className="font-bold">{batch.batchCode}</span>
                                <span className="text-neutral-500 ml-2">Qtd: {batch.quantity} | {batch.sellingPrice ? formatCents(batch.sellingPrice) : "S/ preço"}</span>
                              </button>
                            ))}
                          </PopoverContent>
                        </Popover>
                        <Button type="button" variant="ghost" size="icon" onClick={() => onRemoveItem(index)} className="h-7 w-7 rounded-[4px] text-neutral-500 hover:text-rose-400">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <NumberInput
                          value={item.quantity}
                          onValueChange={(val) => onUpdateQuantity(index, val || 0)}
                          className="h-7 w-16 rounded-[4px] border border-neutral-800 bg-neutral-900 text-xs font-mono text-white text-center"
                          min={0}
                        />
                        <span className="text-[10px] text-neutral-600">x {formatCents(item.unitPrice)}</span>
                      </div>
                      <span className="font-mono text-sm font-bold text-white">{formatCents(item.totalPrice)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            <div className="border-t border-neutral-800 p-4 space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatCents(subtotal)}</span>
                </div>
                <FormField
                  control={form.control}
                  name="discountPercentage"
                  render={({ field }) => (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500">Desconto</span>
                        <NumberInput
                          value={field.value || undefined}
                          onValueChange={(val) => field.onChange(val || null)}
                          className="h-6 w-14 rounded-[4px] border border-neutral-800 bg-neutral-900 text-xs font-mono text-white text-center"
                          min={0} max={100}
                        />
                      </div>
                      <span className="text-xs text-rose-400 font-mono">-{formatCents(discountAmount)}</span>
                    </div>
                  )}
                />
                <div className="flex justify-between pt-2 border-t border-neutral-800">
                  <span className="text-sm font-bold text-white">Total</span>
                  <span className="text-lg font-bold text-white font-mono">{formatCents(total)}</span>
                </div>
              </div>

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-xs font-bold text-white focus:border-blue-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-[4px] border-neutral-800 bg-neutral-900">
                        {paymentMethods.map((method) => (
                          <SelectItem key={method} value={method}>{PAYMENT_METHOD_LABELS[method]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs text-rose-500" />
                  </FormItem>
                )}
              />

              {showInstallments && (
                <FormField
                  control={form.control}
                  name="installments"
                  render={({ field }) => (
                    <FormItem>
                      <NumberInput
                        value={field.value || undefined}
                        onValueChange={(val) => field.onChange(val || null)}
                        className="h-10 w-full rounded-[4px] border border-neutral-800 bg-neutral-900 text-sm text-white focus:border-blue-600"
                        placeholder="Número de parcelas"
                        min={1}
                      />
                      <FormMessage className="text-xs text-rose-500" />
                    </FormItem>
                  )}
                />
              )}

              <Button
                type="submit"
                disabled={isSubmitting || cart.length === 0}
                className="w-full h-12 rounded-[4px] bg-blue-600 text-sm font-bold uppercase tracking-wide text-white hover:bg-blue-700 disabled:opacity-50 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)]"
              >
                <Save className="mr-2 h-4 w-4" strokeWidth={2} />
                {isSubmitting ? "REGISTRANDO..." : "FINALIZAR VENDA"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};
