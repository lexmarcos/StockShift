"use client";

import {
  Plus,
  Package,
  AlertCircle,
  FileText,
  Save,
  TrendingDown,
  TrendingUp,
  ScanLine,
  Search,
  X,
  Loader2,
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
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Textarea } from "@/components/ui/textarea";
import { PageContainer } from "@/components/ui/page-container";
import { FormSection } from "@/components/ui/form-section";
import { FixedBottomBar } from "@/components/ui/fixed-bottom-bar";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { PermissionGate } from "@/components/permission-gate";
import { cn } from "@/lib/utils";
import { CreateStockMovementViewProps } from "./create-stock-movement.types";
import { StockMovementScanner } from "./stock-movement-scanner.view";
import { StockMovementBatchDataModal } from "./stock-movement-batch-data-modal.view";
import { StockMovementItemsList } from "./stock-movement-items-list.view";
import {
  MANUAL_MOVEMENT_TYPE_LABELS,
  MANUAL_OUT_MOVEMENT_TYPES,
} from "../stock-movements.constants";

export function CreateStockMovementView({
  form,
  onSubmit,
  isLoadingProducts,
  isSubmitting,
  isFooterVisible,
  itemQuantity,
  productSearchQuery,
  productOptions,
  isProductOptionsOpen,
  isProductSearchLoading,
  addItemError,
  isScannerOpen,
  onProductSearchChange,
  onProductSearchFocus,
  onProductSearchBlur,
  onProductSelect,
  onProductClear,
  onQuantityChange,
  onAddItem,
  onCreateNewProduct,
  onEditNewProductItem,
  onEditExistingProductBatchData,
  onScannerOpenChange,
  onBarcodeScan,
  onRemoveItem,
  existingProductBatchForm,
  onExistingProductBatchOpenChange,
  onExistingProductBatchQuantityChange,
  onExistingProductBatchManufacturedDateChange,
  onExistingProductBatchExpirationDateChange,
  onExistingProductBatchCostPriceChange,
  onExistingProductBatchSellingPriceChange,
  onConfirmExistingProductBatchData,
  items,
}: CreateStockMovementViewProps) {
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  const selectedType = form.watch("type");
  const notesValue = form.watch("notes");
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
  const isOutMovement = selectedType
    ? MANUAL_OUT_MOVEMENT_TYPES.includes(
        selectedType as (typeof MANUAL_OUT_MOVEMENT_TYPES)[number],
      )
    : false;
  const isInMovement = Boolean(selectedType) && !isOutMovement;

  return (
    <PageContainer bottomPadding="fixed-bar" className="pb-40 md:pb-28">
      <StockMovementScanner
        open={isScannerOpen}
        onOpenChange={onScannerOpenChange}
        onScan={onBarcodeScan}
      />
      <StockMovementBatchDataModal
        form={existingProductBatchForm}
        onOpenChange={onExistingProductBatchOpenChange}
        onQuantityChange={onExistingProductBatchQuantityChange}
        onManufacturedDateChange={onExistingProductBatchManufacturedDateChange}
        onExpirationDateChange={onExistingProductBatchExpirationDateChange}
        onCostPriceChange={onExistingProductBatchCostPriceChange}
        onSellingPriceChange={onExistingProductBatchSellingPriceChange}
        onConfirm={onConfirmExistingProductBatchData}
      />

      <div className="mb-6 flex justify-end">
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

          {/* ── Selected type indicator ── */}
          {selectedType && (
            <div
              className={`flex items-center gap-3 rounded-[4px] border px-4 py-3 ${
                isOutMovement
                  ? "border-rose-900/30 bg-rose-950/10"
                  : "border-emerald-900/30 bg-emerald-950/10"
              }`}
            >
              {isOutMovement ? (
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
                  isOutMovement
                    ? "text-rose-400"
                    : "text-emerald-400"
                }`}
              >
                <span className="font-bold uppercase">
                  {MANUAL_MOVEMENT_TYPE_LABELS[selectedType]}
                </span>{" "}
                -{" "}
                {isOutMovement
                  ? "As quantidades serão deduzidas do estoque usando FIFO (lote mais antigo primeiro)."
                  : "Um novo lote será criado ou adicionado para o produto no warehouse atual."}
              </p>
            </div>
          )}

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
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                        <Input
                          value={productSearchQuery}
                          onChange={(event) =>
                            onProductSearchChange(event.target.value)
                          }
                          onFocus={onProductSearchFocus}
                          onBlur={onProductSearchBlur}
                          disabled={isLoadingProducts}
                          placeholder={
                            isLoadingProducts
                              ? "Carregando produtos..."
                              : "Pesquisar produto por nome, SKU ou código"
                          }
                          className="h-10 w-full rounded-[4px] border-2 border-neutral-800 bg-neutral-900 pl-9 pr-9 text-sm text-white focus:border-blue-600 disabled:opacity-40"
                        />
                        {productSearchQuery && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={onProductClear}
                            className="absolute right-1 top-1 h-8 w-8 rounded-[4px] p-0 text-neutral-500 hover:bg-neutral-800 hover:text-white"
                            aria-label="Limpar produto"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onScannerOpenChange(true)}
                        className="h-10 w-10 shrink-0 rounded-[4px] border-neutral-800 bg-neutral-900 p-0 hover:bg-neutral-800 hover:text-white"
                        aria-label="Ler código de barras"
                      >
                        <ScanLine className="h-4 w-4" strokeWidth={2.5} />
                      </Button>
                    </div>

                    {isProductOptionsOpen &&
                      (isProductSearchLoading || productOptions.length > 0) && (
                        <div className="absolute left-0 right-12 top-12 z-30 overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717]">
                          {isProductSearchLoading && (
                            <div className="flex h-10 items-center gap-2 px-3 text-xs text-neutral-500">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Buscando produtos...
                            </div>
                          )}
                          {!isProductSearchLoading &&
                            productOptions.map((product) => (
                              <Button
                                key={product.id}
                                type="button"
                                variant="ghost"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => onProductSelect(product)}
                                className="flex h-auto w-full items-center justify-start gap-3 rounded-none border-b border-neutral-800 px-3 py-2 text-left hover:bg-neutral-800 hover:text-white last:border-b-0"
                              >
                                {product.imageUrl ? (
                                  <span
                                    role="img"
                                    aria-label={`Foto de ${product.name}`}
                                    className="h-10 w-10 shrink-0 rounded-[4px] border border-neutral-800 bg-neutral-900 bg-cover bg-center"
                                    style={{
                                      backgroundImage: `url("${product.imageUrl}")`,
                                    }}
                                  />
                                ) : (
                                  <span
                                    role="img"
                                    aria-label="Produto sem foto"
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] border border-neutral-800 bg-neutral-900 text-neutral-500"
                                  >
                                    <Package className="h-4 w-4" />
                                  </span>
                                )}
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-semibold text-white">
                                    {product.name}
                                  </span>
                                  <span className="mt-0.5 block truncate text-[10px] font-mono uppercase tracking-wide text-neutral-500">
                                    {product.sku || "SEM SKU"}
                                    {product.barcode
                                      ? ` - ${product.barcode}`
                                      : ""}
                                  </span>
                                </span>
                              </Button>
                            ))}
                        </div>
                      )}
                  </div>
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
              <div className="flex flex-col justify-end gap-2 sm:flex-row">
                {!isOutMovement && (
                  <PermissionGate permission="products:create">
                    <Button
                      type="button"
                      variant="default"
                      onClick={onCreateNewProduct}
                      className="h-9 rounded-[4px] border-white bg-white text-xs font-bold uppercase tracking-wide text-black hover:bg-neutral-200 hover:text-black"
                    >
                      <Plus className="mr-2 h-3.5 w-3.5" strokeWidth={2.5} />
                      Criar Novo Produto
                    </Button>
                  </PermissionGate>
                )}
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
          <StockMovementItemsList
            items={items}
            isInMovement={isInMovement}
            itemsErrorMessage={form.formState.errors.items?.message}
            onEditNewProductItem={onEditNewProductItem}
            onEditExistingProductBatchData={onEditExistingProductBatchData}
            onRemoveItem={onRemoveItem}
          />

          {/* ── Fixed Bottom Bar ── */}
          <FixedBottomBar
            className={cn(
              "bg-[#0A0A0A]/95 backdrop-blur-sm",
              isFooterVisible
                ? "pointer-events-auto translate-y-0"
                : "pointer-events-none translate-y-[calc(100%+1rem)]",
            )}
          >
            <div className="mx-auto flex w-full max-w-7xl flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-between">
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
                    {MANUAL_MOVEMENT_TYPE_LABELS[selectedType]}
                  </span>
                )}
              </div>
              <div className="flex w-full flex-col items-stretch gap-3 md:w-auto md:flex-row md:items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.history.back()}
                  className="h-10 w-full rounded-[4px] border-neutral-800 text-xs font-bold uppercase tracking-wide md:w-auto"
                >
                  CANCELAR
                </Button>
                <PermissionGate permission="stock_movements:create">
                  <Button
                    type="submit"
                    disabled={isSubmitting || isLoadingProducts}
                    className="h-10 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 md:w-auto"
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
