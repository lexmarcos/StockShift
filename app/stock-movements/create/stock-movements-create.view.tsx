"use client";

import Link from "next/link";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { StockMovementCreateFormData } from "./stock-movements-create.schema";

interface StockMovementCreateViewProps {
  form: UseFormReturn<StockMovementCreateFormData>;
  onSubmit: (data: StockMovementCreateFormData) => void;
  items: Array<{ id: string }>;
  addItem: () => void;
  removeItem: (index: number) => void;
  warehouses: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string; sku?: string | null }>;
  batches: Array<{ id: string; batchNumber?: string | null; quantity: number }>;
}

export const StockMovementCreateView = ({
  form,
  onSubmit,
  items,
  addItem,
  removeItem,
  warehouses,
  products,
  batches,
}: StockMovementCreateViewProps) => {
  const movementType = form.watch("movementType");
  const requiresSource =
    movementType === "EXIT" ||
    movementType === "TRANSFER" ||
    movementType === "ADJUSTMENT";
  const requiresDestination =
    movementType === "ENTRY" || movementType === "TRANSFER";
  const requiresBatch = movementType === "EXIT" || movementType === "TRANSFER";

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-20 border-b border-border/40 bg-card">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 md:px-6 lg:px-8">
          <Link
            href="/stock-movements"
            className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-muted/50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
          <div className="border-l border-border/40 pl-3">
            <h1 className="text-base font-semibold uppercase tracking-wide">
              Nova Movimentação
            </h1>
            <p className="text-xs text-muted-foreground hidden md:block">
              Entrada, saída ou transferência
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="border border-border/50 bg-card/80 rounded-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                  Tipo
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="movementType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">
                        Tipo *
                      </FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-9 rounded-sm border-border/40 text-xs">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="rounded-sm">
                          <SelectItem value="ENTRY" className="text-xs">
                            Entrada
                          </SelectItem>
                          <SelectItem value="EXIT" className="text-xs">
                            Saída
                          </SelectItem>
                          <SelectItem value="TRANSFER" className="text-xs">
                            Transferência
                          </SelectItem>
                          <SelectItem value="ADJUSTMENT" className="text-xs">
                            Ajuste
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="executeNow"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-sm border border-border/40 bg-background/50 px-3 py-2">
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">
                        Executar agora
                      </FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border border-border/50 bg-card/80 rounded-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                  Warehouses
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {requiresSource && (
                  <FormField
                    control={form.control}
                    name="sourceWarehouseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-wide">
                          Origem *
                        </FormLabel>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <SelectTrigger className="h-9 rounded-sm border-border/40 text-xs">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent className="rounded-sm">
                            {warehouses.map((warehouse) => (
                              <SelectItem
                                key={warehouse.id}
                                value={warehouse.id}
                                className="text-xs"
                              >
                                {warehouse.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {requiresDestination && (
                  <FormField
                    control={form.control}
                    name="destinationWarehouseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-wide">
                          Destino *
                        </FormLabel>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <SelectTrigger className="h-9 rounded-sm border-border/40 text-xs">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent className="rounded-sm">
                            {warehouses.map((warehouse) => (
                              <SelectItem
                                key={warehouse.id}
                                value={warehouse.id}
                                className="text-xs"
                              >
                                {warehouse.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            <Card className="border border-border/50 bg-card/80 rounded-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                  Itens
                </CardTitle>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-sm border-border/40 text-xs"
                  onClick={addItem}
                >
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  Adicionar item
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="grid gap-3 md:grid-cols-4">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase tracking-wide">
                            Produto *
                          </FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-9 rounded-sm border-border/40 text-xs">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="rounded-sm">
                              {products.map((product) => (
                                <SelectItem
                                  key={product.id}
                                  value={product.id}
                                  className="text-xs"
                                >
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
                      name={`items.${index}.batchId` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase tracking-wide">
                            Batch{requiresBatch ? " *" : ""}
                          </FormLabel>
                          <Select
                            value={field.value || ""}
                            onValueChange={field.onChange}
                            disabled={!requiresBatch}
                          >
                            <SelectTrigger className="h-9 rounded-sm border-border/40 text-xs">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="rounded-sm">
                              {batches.map((batch) => (
                                <SelectItem
                                  key={batch.id}
                                  value={batch.id}
                                  className="text-xs"
                                >
                                  {batch.batchNumber || batch.id} ({batch.quantity})
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
                      name={`items.${index}.quantity` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase tracking-wide">
                            Quantidade *
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              className="h-9 rounded-sm border-border/40 text-xs"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-end gap-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.reason` as const}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="text-xs font-semibold uppercase tracking-wide">
                              Motivo
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="h-9 rounded-sm border-border/40 text-xs"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-sm border-border/40"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" className="rounded-sm bg-foreground text-background">
                Salvar
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
};
