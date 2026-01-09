"use client";

import { useState } from "react";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ArrowLeft, Check, ChevronDown, Plus, Trash2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { filterBatchesByProduct } from "./stock-movements-create.model";
import type { StockMovementCreateFormData } from "./stock-movements-create.schema";
import type { BatchSummary } from "./stock-movements-create.types";

interface StockMovementCreateViewProps {
  form: UseFormReturn<StockMovementCreateFormData>;
  onSubmit: (data: StockMovementCreateFormData) => void;
  items: Array<{ id: string }>;
  addItem: () => void;
  removeItem: (index: number) => void;
  warehouses: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string; sku?: string | null }>;
  batches: BatchSummary[];
  currentStep: number;
  totalSteps: number;
  onNextStep: () => void;
  onPrevStep: () => void;
}

interface SearchOption {
  value: string;
  label: string;
  description?: string;
  searchValue?: string;
}

interface SearchSelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  options: SearchOption[];
  disabled?: boolean;
}

const SearchSelect = ({
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  options,
  disabled,
}: SearchSelectProps) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          className="h-9 w-full justify-between rounded-sm border-border/40 bg-background/50 text-left text-xs"
        >
          <span
            className={cn(
              "truncate",
              !selected && "text-muted-foreground"
            )}
          >
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] rounded-sm border-border/50 p-0"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="text-xs" />
          <CommandList>
            <CommandEmpty className="text-xs">{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.searchValue || option.label}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className="text-xs"
                >
                  <Check
                    className={cn(
                      "h-3.5 w-3.5",
                      option.value === value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">{option.label}</span>
                    {option.description ? (
                      <span className="text-[11px] text-muted-foreground">
                        {option.description}
                      </span>
                    ) : null}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export const StockMovementCreateView = ({
  form,
  onSubmit,
  items,
  addItem,
  removeItem,
  warehouses,
  products,
  batches,
  currentStep,
  totalSteps,
  onNextStep,
  onPrevStep,
}: StockMovementCreateViewProps) => {
  const movementType = form.watch("movementType");
  const requiresSource =
    movementType === "EXIT" ||
    movementType === "TRANSFER" ||
    movementType === "ADJUSTMENT";
  const requiresDestination =
    movementType === "ENTRY" || movementType === "TRANSFER";
  const requiresBatch = movementType === "EXIT" || movementType === "TRANSFER";
  const watchedItems = form.watch("items");

  const productOptions: SearchOption[] = products.map((product) => ({
    value: product.id,
    label: product.name,
    description: product.sku ? `SKU ${product.sku}` : undefined,
    searchValue: `${product.name} ${product.sku ?? ""}`.trim(),
  }));

  const steps = [
    {
      step: 1,
      title: "Configuração",
      description: "Tipo e execução",
    },
    {
      step: 2,
      title: "Warehouses",
      description: "Origem e destino",
    },
    {
      step: 3,
      title: "Itens",
      description: "Produtos, batch e quantidade",
    },
  ];

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
            <section className="rounded-sm border border-border/50 bg-card/80 px-4 py-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                {steps.map((item) => {
                  const isActive = item.step === currentStep;

                  return (
                    <div key={item.step} className="flex items-start gap-3 md:flex-1">
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-sm border text-xs font-semibold",
                          isActive
                            ? "border-foreground bg-foreground text-background"
                            : "border-border/60 bg-background/60 text-muted-foreground"
                        )}
                      >
                        {item.step}
                      </div>
                      <div className="space-y-1">
                        <p
                          className={cn(
                            "text-[11px] font-semibold uppercase tracking-[0.2em]",
                            isActive ? "text-foreground" : "text-muted-foreground"
                          )}
                        >
                          Etapa {item.step}
                        </p>
                        <p className="text-sm font-semibold uppercase tracking-wide">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {currentStep === 1 && (
              <Card className="rounded-sm border border-border/50 bg-card/80">
                <CardHeader>
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Etapa 1 de {totalSteps}
                    </p>
                    <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                      Configuração
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex w-full flex-col gap-4 md:flex-row">
                    <FormField
                      control={form.control}
                      name="movementType"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel className="text-xs font-semibold uppercase tracking-wide">
                            Tipo *
                          </FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-9 w-full rounded-sm border-border/40 text-xs">
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
                        <FormItem className="flex w-full items-center justify-between rounded-sm border border-border/40 bg-background/50 px-3 py-2">
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
                  </div>
                  <div className="flex justify-end">
                    <Button type="button" className="rounded-sm" onClick={onNextStep}>
                      Próximo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card className="rounded-sm border border-border/50 bg-card/80">
                <CardHeader>
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Etapa 2 de {totalSteps}
                    </p>
                    <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                      Warehouses
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex w-full flex-col gap-4 md:flex-row">
                    {requiresSource && (
                      <FormField
                        control={form.control}
                        name="sourceWarehouseId"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel className="text-xs font-semibold uppercase tracking-wide">
                              Origem *
                            </FormLabel>
                            <Select value={field.value || ""} onValueChange={field.onChange}>
                              <SelectTrigger className="h-9 w-full rounded-sm border-border/40 text-xs">
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
                          <FormItem className="w-full">
                            <FormLabel className="text-xs font-semibold uppercase tracking-wide">
                              Destino *
                            </FormLabel>
                            <Select value={field.value || ""} onValueChange={field.onChange}>
                              <SelectTrigger className="h-9 w-full rounded-sm border-border/40 text-xs">
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
                  </div>
                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-sm"
                      onClick={onPrevStep}
                    >
                      Voltar
                    </Button>
                    <Button type="button" className="rounded-sm" onClick={onNextStep}>
                      Próximo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <Card className="rounded-sm border border-border/50 bg-card/80">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Etapa 3 de {totalSteps}
                    </p>
                    <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                      Itens
                    </CardTitle>
                  </div>
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
                  {items.map((item, index) => {
                    const itemProductId = watchedItems?.[index]?.productId ?? "";
                    const filteredBatches = filterBatchesByProduct(
                      batches,
                      itemProductId
                    );
                    const itemBatchOptions: SearchOption[] = filteredBatches.map(
                      (batch) => {
                        const code = batch.batchCode || batch.batchNumber || batch.id;
                        return {
                          value: batch.id,
                          label: code,
                          description: `Qtd ${batch.quantity}`,
                          searchValue: `${code} ${batch.batchNumber ?? ""}`.trim(),
                        };
                      }
                    );
                    const batchEmptyText = itemProductId
                      ? "Nenhum batch encontrado"
                      : "Selecione um produto";
                    const batchDisabled = !requiresBatch || !itemProductId;

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col gap-3 rounded-sm border border-border/40 bg-background/40 p-3 md:flex-row md:items-end"
                      >
                        <FormField
                          control={form.control}
                          name={`items.${index}.productId` as const}
                          render={({ field }) => (
                            <FormItem className="w-full md:flex-1">
                              <FormLabel className="text-xs font-semibold uppercase tracking-wide">
                                Produto *
                              </FormLabel>
                              <FormControl>
                                <SearchSelect
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="Buscar produto"
                                  searchPlaceholder="Buscar produto"
                                  emptyText="Nenhum produto encontrado"
                                  options={productOptions}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.batchId` as const}
                          render={({ field }) => (
                            <FormItem className="w-full md:flex-1">
                              <FormLabel className="text-xs font-semibold uppercase tracking-wide">
                                Batch{requiresBatch ? " *" : ""}
                              </FormLabel>
                              <FormControl>
                                <SearchSelect
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  placeholder="Buscar batch"
                                  searchPlaceholder="Buscar batch"
                                  emptyText={batchEmptyText}
                                  options={itemBatchOptions}
                                  disabled={batchDisabled}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity` as const}
                          render={({ field }) => (
                            <FormItem className="w-full md:flex-1">
                              <FormLabel className="text-xs font-semibold uppercase tracking-wide">
                                Quantidade *
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  className="h-9 w-full rounded-sm border-border/40 text-xs"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.reason` as const}
                          render={({ field }) => (
                            <FormItem className="w-full md:flex-1">
                              <FormLabel className="text-xs font-semibold uppercase tracking-wide">
                                Motivo
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="h-9 w-full rounded-sm border-border/40 text-xs"
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
                            className="h-9 w-full rounded-sm border-border/40 md:w-auto"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    );
                  })}

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-sm"
                      onClick={onPrevStep}
                    >
                      Voltar
                    </Button>
                    <Button
                      type="submit"
                      className="rounded-sm bg-foreground text-background"
                    >
                      Salvar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        </Form>
      </main>
    </div>
  );
};
