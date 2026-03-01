"use client";

import {
  Plus,
  Trash2,
  Package,
  AlertCircle,
  FileText,
  Save,
  Hash,
  TrendingDown,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NumberInput } from "@/components/ui/number-input";
import { Textarea } from "@/components/ui/textarea";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { FormSection } from "@/components/ui/form-section";
import { FixedBottomBar } from "@/components/ui/fixed-bottom-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionLabel } from "@/components/ui/section-label";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { PermissionGate } from "@/components/permission-gate";
import { CreateStockMovementViewProps } from "./create-stock-movement.types";
import { MANUAL_MOVEMENT_TYPES } from "./create-stock-movement.schema";

type ManualType = (typeof MANUAL_MOVEMENT_TYPES)[number];

const MOVEMENT_TYPE_LABELS: Record<ManualType, string> = {
  USAGE: "Uso",
  GIFT: "Presente",
  LOSS: "Perda",
  DAMAGE: "Dano",
  ADJUSTMENT_OUT: "Ajuste Saída",
  PURCHASE_IN: "Compra",
  ADJUSTMENT_IN: "Ajuste Entrada",
};

const OUT_TYPES: ManualType[] = [
  "USAGE",
  "GIFT",
  "LOSS",
  "DAMAGE",
  "ADJUSTMENT_OUT",
];
const IN_TYPES: ManualType[] = ["PURCHASE_IN", "ADJUSTMENT_IN"];

export function CreateStockMovementView({
  form,
  onSubmit,
  products,
  isLoadingProducts,
  isSubmitting,
  selectedProductId,
  itemQuantity,
  addItemError,
  onProductChange,
  onQuantityChange,
  onAddItem,
  onRemoveItem,
  items,
}: CreateStockMovementViewProps) {
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  const selectedType = form.watch("type");
  const notesValue = form.watch("notes");
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <PageContainer bottomPadding="fixed-bar">
      <PageHeader
        title="Nova Movimentação"
        subtitle="Registrar Movimentação de Estoque"
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* ── Type Selection Card ── */}
          <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-5">
            <div className="mb-5 flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <TrendingDown
                  className="h-5 w-5 text-blue-400"
                  strokeWidth={2}
                />
                <div>
                  <p className="text-sm font-bold text-white">
                    Tipo de Movimentação
                  </p>
                  <p className="text-xs text-neutral-500">
                    Define a direção e o motivo do lançamento
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsNotesOpen(true)}
                className={`h-8 gap-2 rounded-[4px] border text-[10px] font-bold uppercase tracking-wide ${
                  notesValue
                    ? "border-blue-900/30 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 hover:text-blue-300"
                    : "border-neutral-800 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                {notesValue ? "Editar Obs." : "Observações"}
              </Button>
            </div>

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  {/* OUT group */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight
                        className="h-3.5 w-3.5 text-rose-500"
                        strokeWidth={2.5}
                      />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500">
                        Saída
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                      {OUT_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => field.onChange(type)}
                          className={`flex flex-col items-start rounded-[4px] border-2 px-3 py-2.5 text-left transition-none ${
                            field.value === type
                              ? "border-rose-600 bg-rose-600/10 text-rose-400"
                              : "border-neutral-800 bg-neutral-900 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300"
                          }`}
                        >
                          <span className="text-[11px] font-bold uppercase tracking-wide leading-tight">
                            {MOVEMENT_TYPE_LABELS[type]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* IN group */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <ArrowDownRight
                        className="h-3.5 w-3.5 text-emerald-500"
                        strokeWidth={2.5}
                      />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                        Entrada
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                      {IN_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => field.onChange(type)}
                          className={`flex flex-col items-start rounded-[4px] border-2 px-3 py-2.5 text-left transition-none ${
                            field.value === type
                              ? "border-emerald-600 bg-emerald-600/10 text-emerald-400"
                              : "border-neutral-800 bg-neutral-900 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300"
                          }`}
                        >
                          <span className="text-[11px] font-bold uppercase tracking-wide leading-tight">
                            {MOVEMENT_TYPE_LABELS[type]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <FormMessage className="mt-2 text-xs text-rose-500" />
                </FormItem>
              )}
            />
          </div>

          {/* ── Notes Modal ── */}
          <ResponsiveModal
            open={isNotesOpen}
            onOpenChange={setIsNotesOpen}
            title="Observações"
            description="Adicione informações adicionais ou o motivo desta movimentação."
            footer={
              <Button
                type="button"
                onClick={() => setIsNotesOpen(false)}
                className="w-full rounded-[4px] bg-neutral-800 font-bold uppercase tracking-wide text-white hover:bg-neutral-700 md:w-auto"
              >
                Confirmar
              </Button>
            }
          >
            <div className="pb-4 pt-2">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Consumo na produção do dia, ajuste de inventário..."
                        className="min-h-[150px] w-full rounded-[4px] border-2 border-neutral-800 bg-neutral-900 text-sm text-white focus:border-blue-600"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-rose-500" />
                  </FormItem>
                )}
              />
            </div>
          </ResponsiveModal>

          {/* ── Item Builder ── */}
          <FormSection
            icon={Package}
            iconColor="text-blue-400"
            title="Adicionar Produto"
            description="Selecione o produto e informe a quantidade"
          >
            <div className="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="min-w-0 flex-1 space-y-2">
                  <label className="text-xs font-bold text-neutral-400">
                    PRODUTO
                  </label>
                  <Select
                    value={selectedProductId}
                    onValueChange={onProductChange}
                    disabled={isLoadingProducts}
                  >
                    <SelectTrigger className="h-10 w-full rounded-[4px] border-2 border-neutral-800 bg-neutral-900 text-sm text-white focus:border-blue-600 disabled:opacity-40">
                      <SelectValue
                        placeholder={
                          isLoadingProducts
                            ? "Carregando produtos..."
                            : "Selecione um produto..."
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="rounded-[4px] border-neutral-800 bg-neutral-900">
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:w-48">
                  <label className="text-xs font-bold text-neutral-400">
                    QUANTIDADE
                  </label>
                  <div className="flex items-center gap-3">
                    <NumberInput
                      value={itemQuantity ? Number(itemQuantity) : undefined}
                      onValueChange={(val) =>
                        onQuantityChange(val !== undefined ? String(val) : "")
                      }
                      className="h-10 w-full rounded-[4px] border-2 border-neutral-800 bg-neutral-900 font-mono text-sm tracking-tighter text-white focus:border-blue-600"
                      placeholder="0"
                    />
                    <Button
                      type="button"
                      onClick={onAddItem}
                      className="h-10 flex-shrink-0 rounded-[4px] bg-blue-600 px-5 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
                    >
                      <Plus className="mr-2 h-4 w-4" strokeWidth={2.5} />
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              {addItemError && (
                <div className="flex items-center gap-2 rounded-[4px] border border-rose-900/30 bg-rose-950/10 px-4 py-3">
                  <AlertCircle
                    className="h-4 w-4 flex-shrink-0 text-rose-500"
                    strokeWidth={2}
                  />
                  <p className="text-xs font-medium text-rose-400">
                    {addItemError}
                  </p>
                </div>
              )}
            </div>
          </FormSection>

          {/* ── Items List ── */}
          <div>
            <SectionLabel icon={Hash} className="mb-4">
              Itens da Movimentação ({items.length})
            </SectionLabel>

            {items.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Nenhum item adicionado"
                description="Selecione um produto e informe a quantidade para adicioná-lo."
              />
            ) : (
              <>
                {/* Mobile cards */}
                <div className="flex flex-col gap-3 md:hidden">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-[4px] border border-neutral-800 bg-[#171717] p-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white">
                          {item.productName || "Produto"}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          Qtd:{" "}
                          <span className="font-mono font-bold tracking-tighter text-white">
                            {item.quantity}
                          </span>
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveItem(index)}
                        className="h-9 w-9 rounded-[4px] text-neutral-500 hover:bg-rose-500/10 hover:text-rose-500"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block">
                  <div className="rounded-[4px] border border-neutral-800 bg-[#171717]">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-neutral-800">
                          <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                            Produto
                          </th>
                          <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                            Quantidade
                          </th>
                          <th className="w-12 px-3 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr
                            key={item.id}
                            className="border-b border-neutral-800 last:border-0"
                          >
                            <td className="px-5 py-3.5 text-sm font-medium text-white">
                              {item.productName || "Produto"}
                            </td>
                            <td className="px-5 py-3.5 text-right font-mono text-sm font-bold tracking-tighter text-white">
                              {item.quantity}
                            </td>
                            <td className="px-3 py-3.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => onRemoveItem(index)}
                                className="h-8 w-8 rounded-[4px] text-neutral-500 hover:bg-rose-500/10 hover:text-rose-500"
                              >
                                <Trash2
                                  className="h-3.5 w-3.5"
                                  strokeWidth={2}
                                />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-neutral-700">
                          <td className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                            Total
                          </td>
                          <td className="px-5 py-3 text-right font-mono text-sm font-bold tracking-tighter text-white">
                            {totalQuantity}
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </>
            )}

            {form.formState.errors.items && (
              <p className="mt-2 text-xs font-medium text-rose-500">
                {form.formState.errors.items.message}
              </p>
            )}
          </div>

          {/* ── Selected type indicator ── */}
          {selectedType && (
            <div
              className={`flex items-center gap-3 rounded-[4px] border px-4 py-3 ${
                OUT_TYPES.includes(selectedType as (typeof OUT_TYPES)[number])
                  ? "border-rose-900/30 bg-rose-950/10"
                  : "border-emerald-900/30 bg-emerald-950/10"
              }`}
            >
              {OUT_TYPES.includes(
                selectedType as (typeof OUT_TYPES)[number],
              ) ? (
                <TrendingDown
                  className="h-4 w-4 flex-shrink-0 text-rose-500"
                  strokeWidth={2}
                />
              ) : (
                <TrendingUp
                  className="h-4 w-4 flex-shrink-0 text-emerald-500"
                  strokeWidth={2}
                />
              )}
              <p
                className={`text-xs font-medium ${
                  OUT_TYPES.includes(selectedType as (typeof OUT_TYPES)[number])
                    ? "text-rose-400"
                    : "text-emerald-400"
                }`}
              >
                <span className="font-bold uppercase">
                  {MOVEMENT_TYPE_LABELS[selectedType]}
                </span>{" "}
                —{" "}
                {OUT_TYPES.includes(selectedType as (typeof OUT_TYPES)[number])
                  ? "As quantidades serão deduzidas do estoque usando FIFO (lote mais antigo primeiro)."
                  : "Um novo lote será criado ou adicionado para o produto no warehouse atual."}
              </p>
            </div>
          )}

          {/* ── Fixed Bottom Bar ── */}
          <FixedBottomBar>
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
              <div className="hidden items-center gap-4 text-xs text-neutral-500 sm:flex">
                <span>
                  <span className="font-mono font-bold tracking-tighter text-neutral-300">
                    {items.length}
                  </span>{" "}
                  {items.length === 1 ? "produto" : "produtos"}
                </span>
                {items.length > 0 && (
                  <span>
                    Total:{" "}
                    <span className="font-mono font-bold tracking-tighter text-neutral-300">
                      {totalQuantity}
                    </span>{" "}
                    un.
                  </span>
                )}
                {selectedType && (
                  <span className="font-bold uppercase tracking-widest text-neutral-400">
                    {MOVEMENT_TYPE_LABELS[selectedType]}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.history.back()}
                  className="h-10 rounded-[4px] border-neutral-800 text-xs font-bold uppercase tracking-wide"
                >
                  CANCELAR
                </Button>
                <PermissionGate permission="stock_movements:create">
                  <Button
                    type="submit"
                    disabled={isSubmitting || isLoadingProducts}
                    className="h-10 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
                  >
                    <Save className="mr-2 h-4 w-4" strokeWidth={2} />
                    {isSubmitting ? "REGISTRANDO..." : "REGISTRAR MOVIMENTAÇÃO"}
                  </Button>
                </PermissionGate>
              </div>
            </div>
          </FixedBottomBar>
        </form>
      </Form>
    </PageContainer>
  );
}
