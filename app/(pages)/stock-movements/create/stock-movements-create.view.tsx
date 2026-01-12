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
  FormDescription,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Plus,
  Trash2,
  Truck,
  Package,
  Layers,
  ArrowRight,
  Settings,
  Warehouse,
} from "lucide-react";
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
          className="h-10 w-full justify-between rounded-[4px] border-neutral-800 bg-neutral-900 text-left text-sm hover:bg-neutral-800"
        >
          <span className={cn("truncate", !selected && "text-neutral-500")}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] rounded-[4px] border-neutral-800 bg-[#171717] p-0 text-neutral-200"
      >
        <Command className="bg-transparent">
          <CommandInput
            placeholder={searchPlaceholder}
            className="text-xs text-neutral-200"
          />
          <CommandList className="max-h-[200px]">
            <CommandEmpty className="py-2 text-center text-xs text-neutral-500">
              {emptyText}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.searchValue || option.label}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className="text-xs data-[selected=true]:bg-neutral-800 data-[selected=true]:text-white"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3.5 w-3.5",
                      option.value === value
                        ? "opacity-100 text-blue-500"
                        : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{option.label}</span>
                    {option.description ? (
                      <span className="text-[10px] text-neutral-500">
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
      description: "Tipo e Parâmetros",
      icon: Settings,
    },
    {
      step: 2,
      title: "Logística",
      description: "Origem e Destino",
      icon: Warehouse,
    },
    {
      step: 3,
      title: "Itens",
      description: "Produtos e Lotes",
      icon: Package,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 font-sans text-neutral-200">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Steps Indicator */}
            <div className="relative flex justify-between">
              {/* Connector Line */}
              <div className="absolute top-5 left-0 right-0 h-[2px] bg-neutral-800 -z-10" />

              {steps.map((item) => {
                const isActive = item.step === currentStep;
                const isCompleted = item.step < currentStep;
                const Icon = item.icon;

                return (
                  <div
                    key={item.step}
                    className="flex flex-col items-center gap-2 bg-[#0A0A0A] px-2"
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-[4px] border transition-all duration-300",
                        isActive
                          ? "border-blue-500 bg-blue-500/10 text-blue-500 shadow-[0_0_15px_-3px_rgba(37,99,235,0.4)]"
                          : isCompleted
                          ? "border-emerald-500 bg-emerald-500 text-black"
                          : "border-neutral-800 bg-[#171717] text-neutral-600"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="hidden md:flex flex-col items-center text-center space-y-0.5">
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          isActive
                            ? "text-blue-500"
                            : isCompleted
                            ? "text-emerald-500"
                            : "text-neutral-600"
                        )}
                      >
                        {item.title}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
              {currentStep === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                  <div className="text-center md:text-left">
                    <h2 className="text-xl font-bold uppercase text-white">
                      Configuração Inicial
                    </h2>
                    <p className="text-sm text-neutral-500">
                      Defina o tipo de operação e o modo de execução.
                    </p>
                  </div>

                  <Card className="rounded-[4px] border border-neutral-800 bg-[#171717]">
                    <CardContent className="pt-6 space-y-6">
                      <FormField
                        control={form.control}
                        name="movementType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              Tipo de Movimentação{" "}
                              <span className="text-rose-500">*</span>
                            </FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="h-12 w-full rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:ring-0">
                                <SelectValue placeholder="Selecione o tipo..." />
                              </SelectTrigger>
                              <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-200">
                                <SelectItem
                                  value="ENTRY"
                                  className="py-3 text-xs uppercase font-medium focus:bg-neutral-800"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                    Entrada (Compra/Retorno)
                                  </div>
                                </SelectItem>
                                <SelectItem
                                  value="EXIT"
                                  className="py-3 text-xs uppercase font-medium focus:bg-neutral-800"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-rose-500" />
                                    Saída (Venda/Perda)
                                  </div>
                                </SelectItem>
                                <SelectItem
                                  value="TRANSFER"
                                  className="py-3 text-xs uppercase font-medium focus:bg-neutral-800"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                                    Transferência Interna
                                  </div>
                                </SelectItem>
                                <SelectItem
                                  value="ADJUSTMENT"
                                  className="py-3 text-xs uppercase font-medium focus:bg-neutral-800"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                                    Ajuste de Estoque
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs text-rose-500" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="executeNow"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-[4px] border border-neutral-800 bg-neutral-900 p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-xs font-bold uppercase text-white">
                                Executar Imediatamente
                              </FormLabel>
                              <FormDescription className="text-[10px] text-neutral-500">
                                Se ativo, o estoque será atualizado ao salvar.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-blue-600"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}

              {currentStep === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                  <div className="text-center md:text-left">
                    <h2 className="text-xl font-bold uppercase text-white">
                      Definição Logística
                    </h2>
                    <p className="text-sm text-neutral-500">
                      Selecione os armazéns envolvidos na operação.
                    </p>
                  </div>

                  <Card className="rounded-[4px] border border-neutral-800 bg-[#171717]">
                    <CardContent className="pt-6 space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        {requiresSource && (
                          <FormField
                            control={form.control}
                            name="sourceWarehouseId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                  Armazém de Origem{" "}
                                  <span className="text-rose-500">*</span>
                                </FormLabel>
                                <Select
                                  value={field.value || ""}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger className="h-10 w-full rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:ring-0">
                                    <SelectValue placeholder="Selecione a origem..." />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-200">
                                    {warehouses.map((warehouse) => (
                                      <SelectItem
                                        key={warehouse.id}
                                        value={warehouse.id}
                                        className="text-xs focus:bg-neutral-800"
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
                        )}

                        {requiresDestination && (
                          <FormField
                            control={form.control}
                            name="destinationWarehouseId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                  Armazém de Destino{" "}
                                  <span className="text-rose-500">*</span>
                                </FormLabel>
                                <Select
                                  value={field.value || ""}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger className="h-10 w-full rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:ring-0">
                                    <SelectValue placeholder="Selecione o destino..." />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-200">
                                    {warehouses.map((warehouse) => (
                                      <SelectItem
                                        key={warehouse.id}
                                        value={warehouse.id}
                                        className="text-xs focus:bg-neutral-800"
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
                        )}
                      </div>

                      {/* Visual Path Indicator */}
                      {requiresSource && requiresDestination && (
                        <div className="flex items-center justify-center gap-4 py-4 opacity-50">
                          <div className="h-2 w-2 rounded-full bg-neutral-600" />
                          <div className="h-[2px] flex-1 bg-neutral-800 bg-dashed" />
                          <Truck className="h-5 w-5 text-neutral-500" />
                          <div className="h-[2px] flex-1 bg-neutral-800 bg-dashed" />
                          <div className="h-2 w-2 rounded-full bg-neutral-600" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {currentStep === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold uppercase text-white">
                        Detalhamento dos Itens
                      </h2>
                      <p className="text-sm text-neutral-500">
                        Adicione os produtos e quantidades.
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={addItem}
                      className="h-9 rounded-[4px] bg-neutral-800 text-xs font-bold uppercase tracking-wide text-white hover:bg-neutral-700"
                    >
                      <Plus className="mr-2 h-3.5 w-3.5" />
                      Adicionar Item
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {items.map((item, index) => {
                      const itemProductId =
                        watchedItems?.[index]?.productId ?? "";
                      const filteredBatches = filterBatchesByProduct(
                        batches,
                        itemProductId
                      );
                      const itemBatchOptions: SearchOption[] =
                        filteredBatches.map((batch) => {
                          const code =
                            batch.batchCode || batch.batchNumber || batch.id;
                          return {
                            value: batch.id,
                            label: code,
                            description: `Disp: ${batch.quantity}`,
                            searchValue: `${code} ${
                              batch.batchNumber ?? ""
                            }`.trim(),
                          };
                        });
                      const batchEmptyText = itemProductId
                        ? "Nenhum lote disponível"
                        : "Selecione o produto primeiro";
                      const batchDisabled = !requiresBatch || !itemProductId;

                      return (
                        <Card
                          key={item.id}
                          className="relative rounded-[4px] border border-neutral-800 bg-[#171717] overflow-hidden"
                        >
                          {/* Item Number Stripe */}
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />

                          <CardContent className="pt-6 pl-6">
                            <div className="grid gap-4 md:grid-cols-12 items-start">
                              <div className="md:col-span-5">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.productId` as const}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                        Produto{" "}
                                        <span className="text-rose-500">*</span>
                                      </FormLabel>
                                      <FormControl>
                                        <SearchSelect
                                          value={field.value}
                                          onChange={field.onChange}
                                          placeholder="Buscar produto..."
                                          searchPlaceholder="Filtrar produtos..."
                                          emptyText="Nenhum produto encontrado"
                                          options={productOptions}
                                        />
                                      </FormControl>
                                      <FormMessage className="text-xs text-rose-500" />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="md:col-span-3">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.batchId` as const}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                                        Lote{" "}
                                        {requiresBatch && (
                                          <span className="text-rose-500">
                                            *
                                          </span>
                                        )}
                                      </FormLabel>
                                      <FormControl>
                                        <SearchSelect
                                          value={field.value || ""}
                                          onChange={field.onChange}
                                          placeholder="Selecione o lote..."
                                          searchPlaceholder="Filtrar lotes..."
                                          emptyText={batchEmptyText}
                                          options={itemBatchOptions}
                                          disabled={batchDisabled}
                                        />
                                      </FormControl>
                                      <FormMessage className="text-xs text-rose-500" />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="md:col-span-2">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.quantity` as const}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                        Qtd{" "}
                                        <span className="text-rose-500">*</span>
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          {...field}
                                          className="h-10 w-full rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
                                        />
                                      </FormControl>
                                      <FormMessage className="text-xs text-rose-500" />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="md:col-span-2 flex justify-end pt-6 md:pt-0">
                                {items.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 rounded-[4px] text-neutral-500 hover:bg-rose-950/20 hover:text-rose-500 self-end"
                                    onClick={() => removeItem(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>

                              <div className="md:col-span-12">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.reason` as const}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          placeholder="Motivo ou observação (opcional)"
                                          className="h-9 w-full rounded-[4px] border-neutral-800 bg-transparent text-xs focus:border-neutral-700 focus:ring-0 placeholder:text-neutral-600"
                                        />
                                      </FormControl>
                                      <FormMessage className="text-xs text-rose-500" />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Footer */}
            <div className="fixed bottom-0 left-0 right-0 border-t border-neutral-800 bg-[#0A0A0A]/95 backdrop-blur-sm p-4 z-50 md:ml-[var(--sidebar-width)]">
              <div className="mx-auto w-full max-w-7xl flex items-center justify-between px-4 md:px-6 lg:px-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onPrevStep}
                  disabled={currentStep === 1}
                  className="h-10 w-[120px] rounded-[4px] border-neutral-700 bg-transparent text-xs font-bold uppercase tracking-wide text-neutral-300 hover:bg-neutral-800 hover:text-white disabled:opacity-30"
                >
                  <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                  Voltar
                </Button>

                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={onNextStep}
                    className="h-10 w-[120px] rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)]"
                  >
                    Próximo
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="h-10 w-[140px] rounded-[4px] bg-emerald-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-emerald-700 shadow-[0_0_20px_-5px_rgba(5,150,105,0.3)]"
                  >
                    Finalizar
                    <Check className="ml-2 h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
};
