"use client";

import Link from "next/link";
import {
  Box,
  Calendar,
  DollarSign,
  FileText,
  History,
  Loader2,
  Minus,
  PackagePlus,
  Plus,
  Scan,
  Search,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import { PermissionGate } from "@/components/permission-gate";
import { BarcodeScannerModal } from "@/components/product/barcode-scanner-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { BatchCreateFormData } from "./batches-create.schema";
import type {
  LatestBatchPriceSuggestion,
  ProductSearchOption,
} from "./batches-create.types";

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
  selectedProduct: ProductSearchOption | null;
  latestBatchPriceSuggestion: LatestBatchPriceSuggestion | null;
  isLatestBatchPriceLoading: boolean;
  onApplyLatestCostPrice: () => void;
  onApplyLatestSellingPrice: () => void;
}

interface BatchCreateViewState extends BatchCreateViewProps {
  isProfitable: boolean;
  isSubmitting: boolean;
  margin: number;
  profit: number;
}

export const BatchCreateView = (props: BatchCreateViewProps) => {
  const costPrice = props.form.watch("costPrice") || 0;
  const sellingPrice = props.form.watch("sellingPrice") || 0;
  const profit = sellingPrice - costPrice;
  const margin = costPrice > 0 ? (profit / costPrice) * 100 : 0;
  const viewState: BatchCreateViewState = {
    ...props,
    isSubmitting: props.form.formState.isSubmitting,
    isProfitable: profit > 0,
    margin,
    profit,
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24 font-sans text-neutral-200 md:pb-20">
      <BarcodeScannerModal
        open={props.isScannerOpen}
        onClose={props.closeScanner}
        onScan={props.handleBarcodeScan}
      />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <Form {...props.form}>
          <form onSubmit={props.form.handleSubmit(props.onSubmit)}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <BatchCreateMainColumn viewState={viewState} />
              <BatchCreateSidebar viewState={viewState} />
            </div>
            <BatchCreateFooter viewState={viewState} />
          </form>
        </Form>
      </main>
    </div>
  );
};

function BatchCreateMainColumn({
  viewState,
}: {
  viewState: BatchCreateViewState;
}) {
  return (
    <div className="space-y-6 lg:col-span-2">
      <BatchProductCard viewState={viewState} />
      <BatchFinancialCard viewState={viewState} />
    </div>
  );
}

function BatchProductCard({
  viewState,
}: {
  viewState: BatchCreateViewState;
}) {
  return (
    <Card className="rounded-[4px] border border-neutral-800 bg-[#171717]">
      <CardHeader className="border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-2">
          <Box className="size-4 text-blue-500" />
          <CardTitle className="text-sm font-bold uppercase tracking-wide text-white">
            Identificação e Origem
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <BatchProductField viewState={viewState} />
      </CardContent>
    </Card>
  );
}

function BatchProductField({
  viewState,
}: {
  viewState: BatchCreateViewState;
}) {
  const { form } = viewState;

  return (
    <FormField
      control={form.control}
      name="productId"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Produto <span className="text-rose-500">*</span>
          </FormLabel>
          <input type="hidden" {...field} />
          <BatchProductSearchControl fieldOnBlur={field.onBlur} viewState={viewState} />
          <FormMessage className="text-xs text-rose-500" />
        </FormItem>
      )}
    />
  );
}

function BatchProductSearchControl({
  fieldOnBlur,
  viewState,
}: {
  fieldOnBlur: () => void;
  viewState: BatchCreateViewState;
}) {
  return (
    <div className="relative">
      <div className="flex gap-2">
        <BatchProductSearchInput
          fieldOnBlur={fieldOnBlur}
          viewState={viewState}
        />
        <Button
          type="button"
          variant="outline"
          onClick={viewState.openScanner}
          className="size-10 shrink-0 rounded-[4px] border-neutral-800 bg-neutral-900 p-0 hover:bg-neutral-800 hover:text-white"
          aria-label="Ler código de barras"
        >
          <Scan className="size-4" />
        </Button>
      </div>
      <BatchProductOptions viewState={viewState} />
    </div>
  );
}

function BatchProductSearchInput({
  fieldOnBlur,
  viewState,
}: {
  fieldOnBlur: () => void;
  viewState: BatchCreateViewState;
}) {
  return (
    <div className="relative flex-1">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-500" />
      <FormControl>
        <Input
          value={viewState.productSearchQuery}
          onChange={(event) => viewState.onProductSearchChange(event.target.value)}
          onFocus={viewState.onProductSearchFocus}
          onBlur={() => {
            fieldOnBlur();
            viewState.onProductSearchBlur();
          }}
          placeholder="Pesquisar por nome, SKU ou código de barras"
          className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 pr-9 pl-9 text-sm focus:border-blue-600 focus:ring-0"
        />
      </FormControl>
      {viewState.productSearchQuery && (
        <Button
          type="button"
          variant="ghost"
          onClick={viewState.onProductClear}
          className="absolute top-1 right-1 size-8 rounded-[4px] p-0 text-neutral-500 hover:bg-neutral-800 hover:text-white"
          aria-label="Limpar produto"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}

function BatchProductOptions({
  viewState,
}: {
  viewState: BatchCreateViewState;
}) {
  const {
    isProductOptionsOpen,
    isProductSearchLoading,
    productOptions,
  } = viewState;

  if (!isProductOptionsOpen) return null;
  if (!isProductSearchLoading && productOptions.length === 0) return null;

  return (
    <div className="absolute top-12 right-12 left-0 z-30 overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717]">
      {isProductSearchLoading && (
        <div className="flex h-10 items-center gap-2 px-3 text-xs text-neutral-500">
          <Loader2 className="size-3.5 animate-spin" />
          Buscando produtos…
        </div>
      )}
      {!isProductSearchLoading &&
        productOptions.map((product) => (
          <BatchProductOption
            key={product.id}
            product={product}
            onProductSelect={viewState.onProductSelect}
          />
        ))}
    </div>
  );
}

function BatchProductOption({
  onProductSelect,
  product,
}: {
  onProductSelect: (product: ProductSearchOption) => void;
  product: ProductSearchOption;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => onProductSelect(product)}
      className="flex h-auto w-full items-center justify-start gap-3 rounded-none border-b border-neutral-800 px-3 py-2 text-left hover:bg-neutral-800 hover:text-white last:border-b-0"
    >
      <BatchProductOptionImage product={product} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-white">
          {product.name}
        </span>
        <span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-wide text-neutral-500">
          {product.sku || "SEM SKU"}
          {product.barcode ? ` - ${product.barcode}` : ""}
        </span>
      </span>
    </Button>
  );
}

function BatchProductOptionImage({
  product,
}: {
  product: ProductSearchOption;
}) {
  if (product.imageUrl) {
    return (
      <span
        role="img"
        aria-label={`Foto de ${product.name}`}
        className="size-10 shrink-0 rounded-[4px] border border-neutral-800 bg-neutral-900 bg-cover bg-center"
        style={{ backgroundImage: `url("${product.imageUrl}")` }}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label="Produto sem foto"
      className="flex size-10 shrink-0 items-center justify-center rounded-[4px] border border-neutral-800 bg-neutral-900 text-neutral-500"
    >
      <Box className="size-4" />
    </span>
  );
}

function BatchFinancialCard({
  viewState,
}: {
  viewState: BatchCreateViewState;
}) {
  return (
    <Card className="overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717]">
      <CardHeader className="border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="size-4 text-emerald-500" />
          <CardTitle className="text-sm font-bold uppercase tracking-wide text-white">
            Financeiro e Estoque
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid items-start gap-5 md:grid-cols-3">
          <BatchQuantityField viewState={viewState} />
          <BatchCostPriceField viewState={viewState} />
          <BatchSellingPriceField viewState={viewState} />
        </div>
        <BatchProfitIndicator viewState={viewState} />
      </CardContent>
    </Card>
  );
}

function BatchQuantityField({
  viewState,
}: {
  viewState: BatchCreateViewState;
}) {
  const { form, onQuantityDecrement, onQuantityIncrement } = viewState;

  return (
    <FormField
      control={form.control}
      name="quantity"
      render={({ field }) => {
        const { onChange, value, ...rest } = field;

        return (
          <FormItem className="self-start">
            <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Quantidade <span className="text-rose-500">*</span>
            </FormLabel>
            <div className="flex">
              <Button
                type="button"
                variant="outline"
                onClick={onQuantityDecrement}
                className="size-10 rounded-l-[4px] rounded-r-none border-neutral-800 bg-neutral-900 p-0 hover:bg-neutral-800 hover:text-white"
                aria-label="Diminuir quantidade"
              >
                <Minus className="size-4" />
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
                className="size-10 rounded-l-none rounded-r-[4px] border-neutral-800 bg-neutral-900 p-0 hover:bg-neutral-800 hover:text-white"
                aria-label="Aumentar quantidade"
              >
                <Plus className="size-4" />
              </Button>
            </div>
            <FormMessage className="text-xs text-rose-500" />
          </FormItem>
        );
      }}
    />
  );
}

function BatchCostPriceField({
  viewState,
}: {
  viewState: BatchCreateViewState;
}) {
  return (
    <BatchCurrencyField
      form={viewState.form}
      name="costPrice"
      label="Custo Unitário"
      inputClassName="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
      priceButton={
        <LatestBatchPriceButton
          fieldLabel="Último custo"
          selectedProduct={viewState.selectedProduct}
          suggestion={viewState.latestBatchPriceSuggestion}
          priceLabel={viewState.latestBatchPriceSuggestion?.costPriceLabel ?? null}
          isPriceAvailable={
            viewState.latestBatchPriceSuggestion?.costPriceCents !== null &&
            viewState.latestBatchPriceSuggestion?.costPriceCents !== undefined
          }
          isLoading={viewState.isLatestBatchPriceLoading}
          onApply={viewState.onApplyLatestCostPrice}
        />
      }
    />
  );
}

function BatchSellingPriceField({
  viewState,
}: {
  viewState: BatchCreateViewState;
}) {
  return (
    <BatchCurrencyField
      form={viewState.form}
      name="sellingPrice"
      label="Preço de Venda"
      inputClassName="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm font-bold text-emerald-500 focus:border-emerald-600 focus:ring-0"
      priceButton={
        <LatestBatchPriceButton
          fieldLabel="Última venda"
          selectedProduct={viewState.selectedProduct}
          suggestion={viewState.latestBatchPriceSuggestion}
          priceLabel={
            viewState.latestBatchPriceSuggestion?.sellingPriceLabel ?? null
          }
          isPriceAvailable={
            viewState.latestBatchPriceSuggestion?.sellingPriceCents !== null &&
            viewState.latestBatchPriceSuggestion?.sellingPriceCents !== undefined
          }
          isLoading={viewState.isLatestBatchPriceLoading}
          onApply={viewState.onApplyLatestSellingPrice}
        />
      }
    />
  );
}

function BatchCurrencyField({
  form,
  inputClassName,
  label,
  name,
  priceButton,
}: {
  form: UseFormReturn<BatchCreateFormData>;
  inputClassName: string;
  label: string;
  name: "costPrice" | "sellingPrice";
  priceButton: ReactNode;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const { onChange, value, ...rest } = field;

        return (
          <FormItem className="self-start">
            <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              {label}
            </FormLabel>
            <FormControl>
              <CurrencyInput
                {...rest}
                value={value}
                onValueChange={onChange}
                placeholder="0,00"
                className={inputClassName}
              />
            </FormControl>
            {priceButton}
            <FormMessage className="text-xs text-rose-500" />
          </FormItem>
        );
      }}
    />
  );
}

function BatchProfitIndicator({
  viewState,
}: {
  viewState: BatchCreateViewState;
}) {
  return (
    <div
      className={cn(
        "mt-4 flex items-center justify-between rounded-[4px] border px-4 py-3",
        viewState.isProfitable
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
            "font-mono text-sm font-bold",
            viewState.isProfitable ? "text-emerald-500" : "text-rose-500",
          )}
        >
          {(viewState.profit / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </span>
        <div
          className={cn(
            "ml-1 rounded-[4px] border px-1.5 py-0.5 text-[10px] font-bold",
            viewState.isProfitable
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
              : "border-rose-500/30 bg-rose-500/10 text-rose-500",
          )}
        >
          {viewState.margin.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

function BatchCreateSidebar({
  viewState,
}: {
  viewState: BatchCreateViewState;
}) {
  return (
    <div className="min-w-0 space-y-6">
      <BatchDatesCard form={viewState.form} />
      <BatchNotesCard form={viewState.form} />
    </div>
  );
}

function BatchDatesCard({ form }: { form: UseFormReturn<BatchCreateFormData> }) {
  return (
    <Card className="w-full min-w-0 overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717]">
      <CardHeader className="border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-amber-500" />
          <CardTitle className="text-sm font-bold uppercase tracking-wide text-white">
            Vigência
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 space-y-5 overflow-hidden pt-6">
        <BatchDateField form={form} name="manufacturedDate" label="Data de Fabricação" />
        <BatchDateField form={form} name="expirationDate" label="Data de Validade" />
      </CardContent>
    </Card>
  );
}

function BatchDateField({
  form,
  label,
  name,
}: {
  form: UseFormReturn<BatchCreateFormData>;
  label: string;
  name: "manufacturedDate" | "expirationDate";
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="min-w-0">
          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            {label}
          </FormLabel>
          <FormControl>
            <Input
              type="date"
              className="block h-10 w-full min-w-0 max-w-full appearance-none rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
              {...field}
            />
          </FormControl>
          <FormMessage className="text-xs text-rose-500" />
        </FormItem>
      )}
    />
  );
}

function BatchNotesCard({ form }: { form: UseFormReturn<BatchCreateFormData> }) {
  return (
    <Card className="rounded-[4px] border border-neutral-800 bg-[#171717]">
      <CardHeader className="border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-neutral-500" />
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
                  placeholder="Detalhes adicionais sobre o lote…"
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
  );
}

function BatchCreateFooter({
  viewState,
}: {
  viewState: BatchCreateViewState;
}) {
  return (
    <div className="fixed right-0 bottom-0 left-0 z-40 border-t border-neutral-800 bg-[#0A0A0A]/95 p-4 backdrop-blur-sm md:ml-[var(--sidebar-width)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3 px-4 md:flex-row md:justify-end md:px-6 lg:px-8">
        <Button
          variant="outline"
          type="button"
          className="h-10 w-full rounded-[4px] border-neutral-700 bg-transparent text-xs font-bold uppercase tracking-wide text-neutral-300 hover:bg-neutral-800 hover:text-white md:w-auto"
          asChild
        >
          <Link href="/batches">Cancelar</Link>
        </Button>
        <PermissionGate permission="batches:create">
          <Button
            type="submit"
            className="h-10 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)] hover:bg-blue-700 md:w-[160px]"
            disabled={viewState.isSubmitting || !viewState.selectedWarehouseId}
          >
            {viewState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-3.5 animate-spin" />
                Salvando…
              </>
            ) : (
              <>
                <PackagePlus className="mr-2 size-3.5" />
                Criar Lote
              </>
            )}
          </Button>
        </PermissionGate>
      </div>
    </div>
  );
}

function LatestBatchPriceButton({
  fieldLabel,
  selectedProduct,
  suggestion,
  priceLabel,
  isPriceAvailable,
  isLoading,
  onApply,
}: {
  fieldLabel: string;
  selectedProduct: ProductSearchOption | null;
  suggestion: LatestBatchPriceSuggestion | null;
  priceLabel: string | null;
  isPriceAvailable: boolean;
  isLoading: boolean;
  onApply: () => void;
}) {
  if (!selectedProduct) return null;

  if (isLoading) {
    return (
      <div className="mt-2 flex h-8 items-center gap-2 rounded-[4px] border border-neutral-800 bg-neutral-950 px-2 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
        <Loader2 className="size-3 animate-spin" />
        Buscando último lote
      </div>
    );
  }

  if (!suggestion) {
    return (
      <div className="mt-2 rounded-[4px] border border-neutral-800 bg-neutral-950 p-2 text-[10px] font-bold uppercase tracking-wide text-neutral-600">
        Sem lote anterior
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={!isPriceAvailable}
      onClick={onApply}
      className="mt-2 block w-full rounded-[4px] border border-neutral-800 bg-neutral-950 px-2.5 py-2 text-left transition-none hover:border-blue-600 hover:bg-blue-950/20 disabled:pointer-events-none disabled:opacity-50"
    >
      <span className="flex min-w-0 items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <History className="size-3.5 shrink-0 text-blue-500" />
          <span className="truncate text-[10px] font-bold uppercase tracking-wide text-neutral-500">
            {fieldLabel}
          </span>
        </span>
        <span className="shrink-0 rounded-[4px] border border-neutral-800 bg-neutral-900 px-2 py-1 font-mono text-xs leading-none font-black text-white">
          {priceLabel}
        </span>
      </span>
      <span className="mt-1.5 block truncate font-mono text-[10px] text-neutral-600">
        {suggestion.batchCode} - {suggestion.createdAtLabel}
      </span>
    </button>
  );
}
