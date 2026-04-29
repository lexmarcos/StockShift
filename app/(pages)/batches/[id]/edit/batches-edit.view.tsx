"use client";

import Link from "next/link";
import {
  AlertCircle,
  Box,
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  Minus,
  Plus,
  Save,
} from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { BatchEditFormData } from "./batches-edit.schema";
import type { Batch } from "../../batches.types";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CurrencyInput } from "@/components/ui/currency-input";
import { NumberInput } from "@/components/ui/number-input";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionGate } from "@/components/permission-gate";

interface BatchEditViewProps {
  form: UseFormReturn<BatchEditFormData>;
  onSubmit: (data: BatchEditFormData) => void;
  isLoading: boolean;
  batch?: Batch | null;
}

export const BatchEditView = ({
  form,
  onSubmit,
  isLoading,
  batch,
}: BatchEditViewProps) => {
  const { isSubmitting } = form.formState;

  const costPrice = form.watch("costPrice") || 0;
  const sellingPrice = form.watch("sellingPrice") || 0;
  const profit = sellingPrice - costPrice;
  const margin = costPrice > 0 ? (profit / costPrice) * 100 : 0;
  const isProfitable = profit > 0;

  const productLabel = batch?.productSku
    ? `${batch.productName} (${batch.productSku})`
    : batch?.productName || form.watch("productId");
  const warehouseLabel = batch?.warehouseCode
    ? `${batch.warehouseName} (${batch.warehouseCode})`
    : batch?.warehouseName || form.watch("warehouseId");
  const batchCode = batch?.batchNumber || batch?.batchCode || form.watch("batchCode");

  const updateQuantity = (quantity: number) => {
    form.setValue("quantity", Math.max(1, quantity), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleQuantityIncrement = () => {
    updateQuantity((form.getValues("quantity") || 0) + 1);
  };

  const handleQuantityDecrement = () => {
    updateQuantity((form.getValues("quantity") || 1) - 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] px-4 py-10 text-xs text-neutral-500">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24 md:pb-20 font-sans text-neutral-200">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
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
                              Produto
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={productLabel}
                                disabled
                                className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm text-neutral-300 focus:ring-0 disabled:opacity-100"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="warehouseId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              Warehouse
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={warehouseLabel}
                                disabled
                                className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm text-neutral-300 focus:ring-0 disabled:opacity-100"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {batchCode && (
                      <div className="rounded-[4px] border border-neutral-800 bg-neutral-900 px-3 py-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                          Código gerado
                        </div>
                        <div className="mt-1 font-mono text-sm font-bold text-white">
                          {batchCode}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

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
                                Quantidade
                              </FormLabel>
                              <div className="flex">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={handleQuantityDecrement}
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
                                  onClick={handleQuantityIncrement}
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

              <div className="space-y-6">
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
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-[10px] text-neutral-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Mantenha vazio quando o produto não tiver validade.
                          </FormDescription>
                          <FormMessage className="text-xs text-rose-500" />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

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

            <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-800 bg-[#0A0A0A]/95 backdrop-blur-sm p-4 md:ml-[var(--sidebar-width)]">
              <div className="mx-auto flex w-full max-w-7xl flex-col md:flex-row items-center md:justify-end gap-3 px-4 md:px-6 lg:px-8">
                <Button
                  variant="outline"
                  type="button"
                  className="h-10 w-full md:w-auto rounded-[4px] border-neutral-700 bg-transparent text-xs font-bold uppercase tracking-wide text-neutral-300 hover:bg-neutral-800 hover:text-white"
                  asChild
                >
                  <Link href={batch?.id ? `/batches/${batch.id}` : "/batches"}>
                    Cancelar
                  </Link>
                </Button>
                <PermissionGate permission="batches:update">
                  <Button
                    type="submit"
                    className="h-10 w-full md:w-[180px] rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-3.5 w-3.5" />
                        Salvar Lote
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
