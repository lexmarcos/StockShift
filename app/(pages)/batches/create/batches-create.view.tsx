"use client";

import Link from "next/link";
import { ArrowLeft, PackagePlus } from "lucide-react";
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
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Produto *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-9 rounded-sm border-border/40 text-xs">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="rounded-sm">
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id} className="text-xs">
                              {product.name} {product.sku ? `(${product.sku})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="warehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Warehouse *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-9 rounded-sm border-border/40 text-xs">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="rounded-sm">
                          {warehouses.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id} className="text-xs">
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
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
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Quantidade *</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="h-9 rounded-sm border-border/40 text-xs" />
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
                    const costPrice = form.watch("costPrice") || 0;
                    const sellingPrice = value || 0;
                    const profit = sellingPrice - costPrice;
                    const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
                    const isProfitable = profit > 0;

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
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">Lucro:</span>
                          <span className={cn("font-bold font-mono", isProfitable ? "text-emerald-500" : "text-rose-500")}>
                            {profit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} ({margin.toFixed(1)}%)
                          </span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
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
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">
                        Validade{selectedProduct?.hasExpiration ? " *" : ""}
                      </FormLabel>
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
              <Button type="submit" className="rounded-sm bg-foreground text-background">
                <PackagePlus className="mr-2 h-3.5 w-3.5" />
                Salvar
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
};
