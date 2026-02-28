"use client";

import { Save } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { BatchEditFormData } from "./batches-edit.schema";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PermissionGate } from "@/components/permission-gate";

interface BatchEditViewProps {
  form: UseFormReturn<BatchEditFormData>;
  onSubmit: (data: BatchEditFormData) => void;
  isLoading: boolean;
}

export const BatchEditView = ({ form, onSubmit, isLoading }: BatchEditViewProps) => {
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-4 py-10 text-xs text-muted-foreground">
        Carregando...
      </div>
    );
  }

  const costPrice = form.watch("costPrice") || 0;
  const sellingPrice = form.watch("sellingPrice") || 0;
  const profit = sellingPrice - costPrice;
  const margin = costPrice > 0 ? (profit / costPrice) * 100 : 0;
  const isProfitable = profit > 0;

  return (
    <div className="min-h-screen bg-background pb-10">
      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="border border-border/50 bg-card/80 rounded-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">Identificação</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Produto</FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="h-9 rounded-sm border-border/40 text-xs" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="warehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Warehouse</FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="h-9 rounded-sm border-border/40 text-xs" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="batchCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Código do Batch</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-9 rounded-sm border-border/40 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border border-border/50 bg-card/80 rounded-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">Estoque</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Quantidade</FormLabel>
                      <FormControl>
                        <NumberInput
                          {...field}
                          mode="integer"
                          className="h-9 rounded-sm border-border/40 text-xs"
                        />
                      </FormControl>
                      <FormMessage />
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
                        <FormLabel className="text-xs font-semibold uppercase tracking-wide">Custo</FormLabel>
                        <FormControl>
                          <CurrencyInput
                            {...rest}
                            value={value}
                            onValueChange={onChange}
                            placeholder="0,00"
                            className="h-9 rounded-sm border-border/40 text-xs"
                          />
                        </FormControl>
                        <FormMessage />
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
                        <FormLabel className="text-xs font-semibold uppercase tracking-wide">Venda</FormLabel>
                        <FormControl>
                          <CurrencyInput
                            {...rest}
                            value={value}
                            onValueChange={onChange}
                            placeholder="0,00"
                            className="h-9 rounded-sm border-border/40 text-xs"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <div
                  className={cn(
                    "md:col-span-3 mt-4 rounded-[4px] border px-4 py-3 flex items-center justify-between",
                    isProfitable
                      ? "border-emerald-900/30 bg-emerald-950/10"
                      : "border-rose-900/30 bg-rose-950/10"
                  )}
                >
                  <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                    Lucro Estimado
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-bold font-mono",
                        isProfitable ? "text-emerald-500" : "text-rose-500"
                      )}
                    >
                      {(profit / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                    <div
                      className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded border ml-1",
                        isProfitable
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                          : "border-rose-500/30 bg-rose-500/10 text-rose-500"
                      )}
                    >
                      {margin.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/50 bg-card/80 rounded-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">Datas</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="manufacturedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Fabricação</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="h-9 rounded-sm border-border/40 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expirationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Validade</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="h-9 rounded-sm border-border/40 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border border-border/50 bg-card/80 rounded-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea {...field} className="min-h-[80px] rounded-sm border-border/40 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <PermissionGate permission="batches:update">
                <Button type="submit" className="rounded-sm bg-foreground text-background">
                  <Save className="mr-2 h-3.5 w-3.5" />
                  Salvar alterações
                </Button>
              </PermissionGate>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
};
