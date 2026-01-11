"use client";

import Link from "next/link";
import { 
  ArrowLeft, 
  PackagePlus, 
  Box, 
  Warehouse, 
  Calendar, 
  FileText, 
  DollarSign, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  Barcode,
  Info
} from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { BatchCreateFormData } from "./batches-create.schema";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BatchCreateViewProps {
  form: UseFormReturn<BatchCreateFormData>;
  onSubmit: (data: BatchCreateFormData) => void;
  products: Array<{ id: string; name: string; sku?: string | null; hasExpiration: boolean }>;
  warehouses: Array<{ id: string; name: string }>;
  selectedProduct?: { hasExpiration: boolean } | undefined;
}

export const BatchCreateView = ({
  form,
  onSubmit,
  products,
  warehouses,
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
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-[4px] border-neutral-800 bg-[#171717] hover:bg-neutral-800 text-neutral-400 hover:text-white"
            asChild
          >
            <Link href="/batches">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tight text-white">
              Novo Lote
            </h1>
            <p className="text-xs text-neutral-500">
              Registre a entrada de um novo lote de produtos no estoque
            </p>
          </div>
        </div>

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
                    <div className="grid gap-5 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="productId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              Produto <span className="text-rose-500">*</span>
                            </FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="w-full h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:ring-0">
                                  <SelectValue placeholder="Selecione o produto..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
                                {products.map((product) => (
                                  <SelectItem 
                                    key={product.id} 
                                    value={product.id} 
                                    className="text-xs focus:bg-neutral-800 focus:text-white"
                                  >
                                    {product.name} {product.sku ? `(${product.sku})` : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs text-rose-500" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="warehouseId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              Armazém de Destino <span className="text-rose-500">*</span>
                            </FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="w-full h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:ring-0">
                                  <SelectValue placeholder="Selecione o armazém..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
                                {warehouses.map((warehouse) => (
                                  <SelectItem 
                                    key={warehouse.id} 
                                    value={warehouse.id}
                                    className="text-xs focus:bg-neutral-800 focus:text-white"
                                  >
                                    {warehouse.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs text-rose-500" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="batchCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                             <Barcode className="h-3 w-3" /> Código do Lote (Batch Code)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="EX: LT-2024-001"
                              className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0 font-mono"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="text-[10px] text-neutral-500">
                            Opcional. Se vazio, será gerado automaticamente.
                          </FormDescription>
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
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              Quantidade <span className="text-rose-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
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
                    <div className={cn(
                      "mt-4 rounded-[4px] border px-4 py-3 flex items-center justify-between",
                      isProfitable ? "border-emerald-900/30 bg-emerald-950/10" : "border-rose-900/30 bg-rose-950/10"
                    )}>
                      <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                        Margem Estimada
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={cn(
                            "text-sm font-bold font-mono",
                            isProfitable ? "text-emerald-500" : "text-rose-500"
                          )}>
                            {(profit).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </p>
                          <p className="text-[10px] text-neutral-500">Lucro por unidade</p>
                        </div>
                        <div className={cn(
                          "text-xs font-bold px-2 py-1 rounded border",
                          isProfitable ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500" : "border-rose-500/30 bg-rose-500/10 text-rose-500"
                        )}>
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
                            {selectedProduct?.hasExpiration && <span className="text-rose-500 ml-1">*</span>}
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
                <Button
                  type="submit"
                  className="h-10 w-full md:w-[160px] rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)]"
                  disabled={isSubmitting}
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
              </div>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
};
