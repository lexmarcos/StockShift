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
  ManualMovementType,
} from "../stock-movements.constants";

interface CreateStockMovementViewState extends CreateStockMovementViewProps {
  isInMovement: boolean;
  isNotesOpen: boolean;
  isOutMovement: boolean;
  notesValue: string | undefined;
  selectedType: ManualMovementType | undefined;
  setIsNotesOpen: (open: boolean) => void;
  totalQuantity: number;
  submittingStep: string | null;
}

export function CreateStockMovementView(props: CreateStockMovementViewProps) {
  const {
    form,
    items,
    isSubmitting,
    onEditExistingProductBatchData,
    onEditNewProductItem,
    onRemoveItem,
    onSubmit,
    submittingStep,
  } = props;
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
  const viewState: CreateStockMovementViewState = {
    ...props,
    isInMovement,
    isNotesOpen,
    isOutMovement,
    notesValue,
    selectedType,
    setIsNotesOpen,
    submittingStep,
    totalQuantity,
  };

  return (
    <PageContainer bottomPadding="fixed-bar" className="pb-40 md:pb-28">
      <StockMovementSubmitOverlay
        isSubmitting={isSubmitting}
        submittingStep={submittingStep}
      />
      <StockMovementCreateOverlays viewState={viewState} />
      <StockMovementNotesButton viewState={viewState} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <StockMovementNotesModal viewState={viewState} />
          <StockMovementTypeNotice viewState={viewState} />
          <StockMovementItemBuilder viewState={viewState} />
          <StockMovementItemsList
            items={items}
            isInMovement={isInMovement}
            itemsErrorMessage={form.formState.errors.items?.message}
            onEditNewProductItem={onEditNewProductItem}
            onEditExistingProductBatchData={onEditExistingProductBatchData}
            onRemoveItem={onRemoveItem}
          />
          <StockMovementSubmitBar viewState={viewState} />
        </form>
      </Form>
    </PageContainer>
  );
}

function StockMovementCreateOverlays({
  viewState,
}: {
  viewState: CreateStockMovementViewState;
}) {
  const {
    existingProductBatchForm,
    onApplyExistingProductCostPriceSuggestion,
    onApplyExistingProductSalePriceSuggestion,
    onBarcodeScan,
    onConfirmExistingProductBatchData,
    onCreateProductFromMissingModal,
    onExistingProductBatchCostPriceChange,
    onExistingProductBatchExpirationDateChange,
    onExistingProductBatchManufacturedDateChange,
    onExistingProductBatchOpenChange,
    onExistingProductBatchQuantityChange,
    onExistingProductBatchQuantityDecrement,
    onExistingProductBatchQuantityIncrement,
    onExistingProductBatchSellingPriceChange,
    onMissingProductModalOpenChange,
    existingProductCostPriceSuggestion,
    existingProductProfitSummary,
    existingProductSalePriceSuggestion,
    isExistingProductPriceSuggestionLoading,
    isScannerOpen,
    missingProductBarcode,
    onScannerOpenChange,
    shouldShowMissingCostPriceSuggestion,
    shouldShowMissingSalePriceSuggestion,
  } = viewState;

  return (
    <>
      <StockMovementScanner
        open={isScannerOpen}
        onOpenChange={onScannerOpenChange}
        onScan={onBarcodeScan}
      />
      <StockMovementBatchDataModal
        form={existingProductBatchForm}
        onOpenChange={onExistingProductBatchOpenChange}
        onQuantityChange={onExistingProductBatchQuantityChange}
        onQuantityIncrement={onExistingProductBatchQuantityIncrement}
        onQuantityDecrement={onExistingProductBatchQuantityDecrement}
        onManufacturedDateChange={onExistingProductBatchManufacturedDateChange}
        onExpirationDateChange={onExistingProductBatchExpirationDateChange}
        onCostPriceChange={onExistingProductBatchCostPriceChange}
        onSellingPriceChange={onExistingProductBatchSellingPriceChange}
        onApplyCostPriceSuggestion={onApplyExistingProductCostPriceSuggestion}
        onApplySalePriceSuggestion={onApplyExistingProductSalePriceSuggestion}
        onConfirm={onConfirmExistingProductBatchData}
        costPriceSuggestion={existingProductCostPriceSuggestion}
        salePriceSuggestion={existingProductSalePriceSuggestion}
        isPriceSuggestionLoading={isExistingProductPriceSuggestionLoading}
        shouldShowMissingCostPriceSuggestion={shouldShowMissingCostPriceSuggestion}
        shouldShowMissingSalePriceSuggestion={shouldShowMissingSalePriceSuggestion}
        profitSummary={existingProductProfitSummary}
      />
      <StockMovementMissingProductModal
        barcode={missingProductBarcode}
        onOpenChange={onMissingProductModalOpenChange}
        onCreateProduct={onCreateProductFromMissingModal}
      />
    </>
  );
}

function StockMovementNotesButton({
  viewState,
}: {
  viewState: CreateStockMovementViewState;
}) {
  const { notesValue, setIsNotesOpen } = viewState;

  return (
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
        <FileText className="size-3.5" />
        {notesValue ? "Editar Obs." : "Observações"}
      </Button>
    </div>
  );
}

function StockMovementNotesModal({
  viewState,
}: {
  viewState: CreateStockMovementViewState;
}) {
  const { form, isNotesOpen, setIsNotesOpen } = viewState;

  return (
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
                  placeholder="Ex: Consumo na produção do dia, ajuste de inventário…"
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
  );
}

function StockMovementTypeNotice({
  viewState,
}: {
  viewState: CreateStockMovementViewState;
}) {
  const { isOutMovement, selectedType } = viewState;
  if (!selectedType) return null;

  return (
    <div
      className={`flex items-center gap-3 rounded-[4px] border px-4 py-3 ${
        isOutMovement
          ? "border-rose-900/30 bg-rose-950/10"
          : "border-emerald-900/30 bg-emerald-950/10"
      }`}
    >
      {isOutMovement ? (
        <TrendingDown className="size-4 flex-shrink-0 text-rose-500" />
      ) : (
        <TrendingUp className="size-4 flex-shrink-0 text-emerald-500" />
      )}
      <p className={`text-xs font-medium ${isOutMovement ? "text-rose-400" : "text-emerald-400"}`}>
        <span className="font-bold uppercase">
          {MANUAL_MOVEMENT_TYPE_LABELS[selectedType]}
        </span>{" "}
        -{" "}
        {isOutMovement
          ? "As quantidades serão deduzidas do estoque usando FIFO (lote mais antigo primeiro)."
          : "Um novo lote será criado ou adicionado para o produto no warehouse atual."}
      </p>
    </div>
  );
}

function StockMovementItemBuilder({
  viewState,
}: {
  viewState: CreateStockMovementViewState;
}) {
  return (
    <FormSection
      icon={Package}
      iconColor="text-blue-400"
      title="Selecionar produto"
      description="Busque ou escaneie o produto para adicionar à movimentação"
    >
      <div className="space-y-4">
        <StockMovementProductSearch viewState={viewState} />
        <StockMovementCreateProductAction viewState={viewState} />
        <StockMovementAddItemError viewState={viewState} />
      </div>
    </FormSection>
  );
}

function StockMovementProductSearch({
  viewState,
}: {
  viewState: CreateStockMovementViewState;
}) {
  const {
    isInMovement,
    isLoadingProducts,
    isProductOptionsOpen,
    isProductSearchLoading,
    itemQuantity,
    onAddItem,
    onProductClear,
    onProductSearchBlur,
    onProductSearchChange,
    onProductSearchFocus,
    onProductSelect,
    onQuantityChange,
    onScannerOpenChange,
    productOptions,
    productSearchQuery,
    selectedProductId,
  } = viewState;

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      <div className="min-w-0 flex-1 space-y-2">
        <label htmlFor="stock-movement-product-search" className="text-xs font-bold text-neutral-400">
          PRODUTO
        </label>
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
              <Input
                id="stock-movement-product-search"
                value={productSearchQuery}
                onChange={(event) => onProductSearchChange(event.target.value)}
                onFocus={onProductSearchFocus}
                onBlur={onProductSearchBlur}
                disabled={isLoadingProducts}
                placeholder={isLoadingProducts ? "Carregando produtos…" : "Pesquisar produto por nome, SKU ou código"}
                className="h-10 w-full rounded-[4px] border-2 border-neutral-800 bg-neutral-900 pl-9 pr-9 text-sm text-white focus:border-blue-600 disabled:opacity-40"
              />
              {productSearchQuery ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onProductClear}
                  className="absolute right-1 top-1 size-8 rounded-[4px] p-0 text-neutral-500 hover:bg-neutral-800 hover:text-white"
                  aria-label="Limpar produto"
                >
                  <X className="size-4" />
                </Button>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => onScannerOpenChange(true)}
              className="size-10 shrink-0 rounded-[4px] border-neutral-800 bg-neutral-900 p-0 hover:bg-neutral-800 hover:text-white"
              aria-label="Ler código de barras"
            >
              <ScanLine className="size-4" strokeWidth={2.5} />
            </Button>
          </div>
          <StockMovementProductOptions
            isOpen={isProductOptionsOpen}
            isLoading={isProductSearchLoading}
            products={productOptions}
            onProductSelect={onProductSelect}
          />
        </div>
      </div>
      <StockMovementQuantityAction
        isInMovement={isInMovement}
        itemQuantity={itemQuantity}
        selectedProductId={selectedProductId}
        onAddItem={onAddItem}
        onQuantityChange={onQuantityChange}
      />
    </div>
  );
}

function StockMovementProductOptions({
  isOpen,
  isLoading,
  products,
  onProductSelect,
}: {
  isOpen: boolean;
  isLoading: boolean;
  products: CreateStockMovementViewProps["productOptions"];
  onProductSelect: CreateStockMovementViewProps["onProductSelect"];
}) {
  if (!isOpen || (!isLoading && products.length === 0)) return null;

  return (
    <div className="absolute left-0 right-12 top-12 z-30 overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717]">
      {isLoading ? (
        <div className="flex h-10 items-center gap-2 px-3 text-xs text-neutral-500">
          <Loader2 className="size-3.5 animate-spin" />
          Buscando produtos…
        </div>
      ) : (
        products.map((product) => (
          <Button
            key={product.id}
            type="button"
            variant="ghost"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onProductSelect(product)}
            className="flex h-auto w-full items-center justify-start gap-3 rounded-none border-b border-neutral-800 px-3 py-2 text-left hover:bg-neutral-800 hover:text-white last:border-b-0"
          >
            <StockMovementProductOptionImage product={product} />
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
        ))
      )}
    </div>
  );
}

function StockMovementProductOptionImage({
  product,
}: {
  product: CreateStockMovementViewProps["productOptions"][number];
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
      <Package className="size-4" />
    </span>
  );
}

function StockMovementQuantityAction({
  isInMovement,
  itemQuantity,
  selectedProductId,
  onAddItem,
  onQuantityChange,
}: {
  isInMovement: boolean;
  itemQuantity: string;
  selectedProductId: string;
  onAddItem: () => void;
  onQuantityChange: (quantity: string) => void;
}) {
  if (isInMovement) {
    return selectedProductId ? (
      <div className="flex items-end">
        <Button
          type="button"
          onClick={onAddItem}
          className="h-10 w-full flex-shrink-0 rounded-[4px] bg-blue-600 px-5 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 md:w-auto"
        >
          Preencher dados do lote
        </Button>
      </div>
    ) : null;
  }

  return (
    <div className="space-y-2 md:w-48">
      <label htmlFor="stock-movement-item-quantity" className="text-xs font-bold text-neutral-400">
        QUANTIDADE
      </label>
      <div className="flex items-center gap-3">
        <NumberInput
          id="stock-movement-item-quantity"
          value={itemQuantity ? Number(itemQuantity) : undefined}
          onValueChange={(value) =>
            onQuantityChange(value !== undefined ? String(value) : "")
          }
          className="h-10 w-full rounded-[4px] border-2 border-neutral-800 bg-neutral-900 font-mono text-sm tracking-tighter text-white focus:border-blue-600"
          placeholder="0"
        />
        <Button
          type="button"
          onClick={onAddItem}
          className="h-10 flex-shrink-0 rounded-[4px] bg-blue-600 px-5 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
        >
          <Plus className="mr-2 size-4" strokeWidth={2.5} />
          Add
        </Button>
      </div>
    </div>
  );
}

function StockMovementCreateProductAction({
  viewState,
}: {
  viewState: CreateStockMovementViewState;
}) {
  const { isOutMovement, onCreateNewProduct } = viewState;
  if (isOutMovement) return null;

  return (
    <div className="flex flex-col justify-end gap-2 sm:flex-row">
      <PermissionGate permission="products:create">
        <Button
          type="button"
          variant="default"
          onClick={onCreateNewProduct}
          className="h-9 rounded-[4px] border-white bg-white text-xs font-bold uppercase tracking-wide text-black hover:bg-neutral-200 hover:text-black"
        >
          <Plus className="mr-2 size-3.5" strokeWidth={2.5} />
          Criar Novo Produto
        </Button>
      </PermissionGate>
    </div>
  );
}

function StockMovementAddItemError({
  viewState,
}: {
  viewState: CreateStockMovementViewState;
}) {
  const { addItemError } = viewState;
  if (!addItemError) return null;

  return (
    <div className="flex items-center gap-2 rounded-[4px] border border-rose-900/30 bg-rose-950/10 px-4 py-3">
      <AlertCircle className="size-4 flex-shrink-0 text-rose-500" />
      <p className="text-xs font-medium text-rose-400">{addItemError}</p>
    </div>
  );
}

function StockMovementSubmitBar({
  viewState,
}: {
  viewState: CreateStockMovementViewState;
}) {
  const {
    isFooterVisible,
    isLoadingProducts,
    isSubmitting,
    items,
    selectedType,
    totalQuantity,
  } = viewState;

  return (
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
          {items.length > 0 ? (
            <span>
              Total:{" "}
              <span className="font-mono font-bold tracking-tighter text-neutral-300">
                {totalQuantity}
              </span>{" "}
              un.
            </span>
          ) : null}
          {selectedType ? (
            <span className="font-bold uppercase tracking-widest text-neutral-400">
              {MANUAL_MOVEMENT_TYPE_LABELS[selectedType]}
            </span>
          ) : null}
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
              <Save className="mr-2 size-4" />
              {isSubmitting ? "REGISTRANDO…" : "REGISTRAR MOVIMENTAÇÃO"}
            </Button>
          </PermissionGate>
        </div>
      </div>
    </FixedBottomBar>
  );
}

function StockMovementSubmitOverlay({
  isSubmitting,
  submittingStep,
}: {
  isSubmitting: boolean;
  submittingStep: string | null;
}) {
  if (!isSubmitting) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0A0A0A]/95 backdrop-blur-sm">
      <div className="flex w-full max-w-xs flex-col items-center gap-6">
        <Loader2 className="size-10 animate-spin text-blue-600" strokeWidth={2.5} />
        <div className="flex flex-col items-center gap-2">
          <p className="text-base font-bold text-white">
            Registrando movimentação
          </p>
          {submittingStep ? (
            <p className="text-sm text-neutral-400">{submittingStep}</p>
          ) : null}
        </div>
        <p className="text-center text-[11px] text-neutral-600">
          Não saia desta tela até que o processo seja concluído.
        </p>
      </div>
    </div>
  );
}

function StockMovementMissingProductModal({
  barcode,
  onOpenChange,
  onCreateProduct,
}: {
  barcode: string | null;
  onOpenChange: (open: boolean) => void;
  onCreateProduct: () => void;
}) {
  return (
    <ResponsiveModal
      open={barcode !== null}
      onOpenChange={onOpenChange}
      title="Produto não encontrado"
      description={`O produto com código "${barcode}" não foi encontrado no sistema.`}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 w-full rounded-[4px] border-neutral-800 text-xs font-bold uppercase tracking-wide md:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onCreateProduct}
            className="h-10 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 md:w-auto"
          >
            Criar Produto
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-2 pt-2">
        <div className="flex items-start gap-3 rounded-[4px] border border-amber-900/30 bg-amber-950/10 px-4 py-3">
          <AlertCircle className="size-5 shrink-0 text-amber-500" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-400">
              Produto inexistente
            </p>
            <p className="text-xs text-amber-400/80">
              Deseja criar um novo produto com este código de barras?
            </p>
          </div>
        </div>
        {barcode && (
          <div className="rounded-[4px] border border-neutral-800 bg-neutral-900 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Código de barras
            </p>
            <p className="mt-1 font-mono text-sm font-bold text-white">
              {barcode}
            </p>
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
}
