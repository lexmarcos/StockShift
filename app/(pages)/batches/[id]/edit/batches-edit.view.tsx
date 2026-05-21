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
import type { ReactNode } from "react";
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

interface BatchEditViewState extends BatchEditViewProps {
  batchCode: string | undefined;
  handleQuantityDecrement: () => void;
  handleQuantityIncrement: () => void;
  isProfitable: boolean;
  isSubmitting: boolean;
  margin: number;
  productLabel: string;
  profit: number;
  warehouseLabel: string;
}

export const BatchEditView = (props: BatchEditViewProps) => {
  const { form, onSubmit, isLoading, batch } = props;
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
  const viewState: BatchEditViewState = {
    ...props,
    batchCode,
    handleQuantityDecrement,
    handleQuantityIncrement,
    isProfitable,
    isSubmitting,
    margin,
    productLabel,
    profit,
    warehouseLabel,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] px-4 py-10 text-xs text-neutral-500">
        Carregando…
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
                <BatchEditIdentityCard viewState={viewState} />
                <BatchEditFinanceCard viewState={viewState} />
              </div>

              <div className="space-y-6">
                <BatchEditDateCard form={form} />
                <BatchEditNotesCard form={form} />
              </div>
            </div>

            <BatchEditFooter viewState={viewState} />
          </form>
        </Form>
      </main>
    </div>
  );
};

function BatchEditIdentityCard({
  viewState,
}: {
  viewState: BatchEditViewState;
}) {
  const { batchCode, form, productLabel, warehouseLabel } = viewState;

  return (
    <Card className="rounded-[4px] border border-neutral-800 bg-[#171717]">
      <CardHeader className="border-b border-neutral-800 pb-4">
        <BatchEditCardTitle icon={<Box className="size-4 text-blue-500" />} title="Identificação e Origem" />
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div className="grid gap-5 md:grid-cols-2">
          <BatchEditReadonlyField form={form} name="productId" label="Produto" value={productLabel} />
          <BatchEditReadonlyField form={form} name="warehouseId" label="Warehouse" value={warehouseLabel} />
        </div>
        {batchCode ? (
          <div className="rounded-[4px] border border-neutral-800 bg-neutral-900 px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Código gerado
            </div>
            <div className="mt-1 font-mono text-sm font-bold text-white">
              {batchCode}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function BatchEditReadonlyField({
  form,
  label,
  name,
  value,
}: {
  form: UseFormReturn<BatchEditFormData>;
  label: string;
  name: "productId" | "warehouseId";
  value: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            {label}
          </FormLabel>
          <FormControl>
            <Input
              {...field}
              value={value}
              disabled
              className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm text-neutral-300 focus:ring-0 disabled:opacity-100"
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

function BatchEditFinanceCard({
  viewState,
}: {
  viewState: BatchEditViewState;
}) {
  const { form, handleQuantityDecrement, handleQuantityIncrement } = viewState;

  return (
    <Card className="rounded-[4px] border border-neutral-800 bg-[#171717]">
      <CardHeader className="border-b border-neutral-800 pb-4">
        <BatchEditCardTitle icon={<DollarSign className="size-4 text-emerald-500" />} title="Financeiro e Estoque" />
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-5 md:grid-cols-3">
          <BatchEditQuantityField
            form={form}
            onDecrement={handleQuantityDecrement}
            onIncrement={handleQuantityIncrement}
          />
          <BatchEditCurrencyField form={form} name="costPrice" label="Custo Unitário" />
          <BatchEditCurrencyField form={form} name="sellingPrice" label="Preço de Venda" isSellingPrice />
        </div>
        <BatchEditProfitSummary viewState={viewState} />
      </CardContent>
    </Card>
  );
}

function BatchEditQuantityField({
  form,
  onDecrement,
  onIncrement,
}: {
  form: UseFormReturn<BatchEditFormData>;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
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
              <BatchEditQuantityButton label="Diminuir quantidade" onClick={onDecrement} side="left" />
              <FormControl>
                <NumberInput
                  {...rest}
                  value={value}
                  onValueChange={onChange}
                  mode="integer"
                  className="h-10 min-w-0 flex-1 rounded-none border-x-0 border-neutral-800 bg-neutral-900 text-center text-sm focus:border-blue-600 focus:ring-0"
                />
              </FormControl>
              <BatchEditQuantityButton label="Aumentar quantidade" onClick={onIncrement} side="right" />
            </div>
            <FormMessage className="text-xs text-rose-500" />
          </FormItem>
        );
      }}
    />
  );
}

function BatchEditQuantityButton({
  label,
  onClick,
  side,
}: {
  label: string;
  onClick: () => void;
  side: "left" | "right";
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={cn(
        "size-10 border-neutral-800 bg-neutral-900 p-0 hover:bg-neutral-800 hover:text-white",
        side === "left" ? "rounded-l-[4px] rounded-r-none" : "rounded-l-none rounded-r-[4px]",
      )}
      aria-label={label}
    >
      {side === "left" ? <Minus className="size-4" /> : <Plus className="size-4" />}
    </Button>
  );
}

function BatchEditCurrencyField({
  form,
  isSellingPrice = false,
  label,
  name,
}: {
  form: UseFormReturn<BatchEditFormData>;
  isSellingPrice?: boolean;
  label: string;
  name: "costPrice" | "sellingPrice";
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const { onChange, value, ...rest } = field;
        return (
          <FormItem>
            <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              {label}
            </FormLabel>
            <FormControl>
              <CurrencyInput
                {...rest}
                value={value}
                onValueChange={onChange}
                placeholder="0,00"
                className={cn(
                  "h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:ring-0",
                  isSellingPrice
                    ? "font-bold text-emerald-500 focus:border-emerald-600"
                    : "focus:border-blue-600",
                )}
              />
            </FormControl>
            <FormMessage className="text-xs text-rose-500" />
          </FormItem>
        );
      }}
    />
  );
}

function BatchEditProfitSummary({
  viewState,
}: {
  viewState: BatchEditViewState;
}) {
  const { isProfitable, margin, profit } = viewState;

  return (
    <div
      className={cn(
        "mt-4 flex items-center justify-between rounded-[4px] border px-4 py-3",
        isProfitable
          ? "border-emerald-900/30 bg-emerald-950/10"
          : "border-rose-900/30 bg-rose-950/10",
      )}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">
        Lucro Estimado
      </span>
      <div className="flex items-center gap-2">
        <span className={cn("font-mono text-sm font-bold", isProfitable ? "text-emerald-500" : "text-rose-500")}>
          {(profit / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </span>
        <div className={cn("ml-1 rounded border px-1.5 py-0.5 text-[10px] font-bold", isProfitable ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500" : "border-rose-500/30 bg-rose-500/10 text-rose-500")}>
          {margin.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

function BatchEditDateCard({ form }: { form: UseFormReturn<BatchEditFormData> }) {
  return (
    <Card className="rounded-[4px] border border-neutral-800 bg-[#171717]">
      <CardHeader className="border-b border-neutral-800 pb-4">
        <BatchEditCardTitle icon={<Calendar className="size-4 text-amber-500" />} title="Vigência" />
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <BatchEditDateField form={form} name="manufacturedDate" label="Data de Fabricação" />
        <BatchEditDateField
          form={form}
          name="expirationDate"
          label="Data de Validade"
          description="Mantenha vazio quando o produto não tiver validade."
        />
      </CardContent>
    </Card>
  );
}

function BatchEditDateField({
  description,
  form,
  label,
  name,
}: {
  description?: string;
  form: UseFormReturn<BatchEditFormData>;
  label: string;
  name: "expirationDate" | "manufacturedDate";
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            {label}
          </FormLabel>
          <FormControl>
            <Input
              type="date"
              className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
              {...field}
            />
          </FormControl>
          {description ? (
            <FormDescription className="flex items-center gap-1 text-[10px] text-neutral-500">
              <AlertCircle className="size-3" />
              {description}
            </FormDescription>
          ) : null}
          <FormMessage className="text-xs text-rose-500" />
        </FormItem>
      )}
    />
  );
}

function BatchEditNotesCard({ form }: { form: UseFormReturn<BatchEditFormData> }) {
  return (
    <Card className="rounded-[4px] border border-neutral-800 bg-[#171717]">
      <CardHeader className="border-b border-neutral-800 pb-4">
        <BatchEditCardTitle icon={<FileText className="size-4 text-neutral-500" />} title="Observações" />
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

function BatchEditFooter({
  viewState,
}: {
  viewState: BatchEditViewState;
}) {
  const { batch, isSubmitting } = viewState;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-800 bg-[#0A0A0A]/95 p-4 backdrop-blur-sm md:ml-[var(--sidebar-width)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3 px-4 md:flex-row md:justify-end md:px-6 lg:px-8">
        <Button
          variant="outline"
          type="button"
          className="h-10 w-full rounded-[4px] border-neutral-700 bg-transparent text-xs font-bold uppercase tracking-wide text-neutral-300 hover:bg-neutral-800 hover:text-white md:w-auto"
          asChild
        >
          <Link href={batch?.id ? `/batches/${batch.id}` : "/batches"}>
            Cancelar
          </Link>
        </Button>
        <PermissionGate permission="batches:update">
          <Button
            type="submit"
            className="h-10 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)] hover:bg-blue-700 md:w-[180px]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-3.5 animate-spin" />
                Salvando…
              </>
            ) : (
              <>
                <Save className="mr-2 size-3.5" />
                Salvar Lote
              </>
            )}
          </Button>
        </PermissionGate>
      </div>
    </div>
  );
}

function BatchEditCardTitle({
  icon,
  title,
}: {
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <CardTitle className="text-sm font-bold uppercase tracking-wide text-white">
        {title}
      </CardTitle>
    </div>
  );
}
