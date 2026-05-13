import {
  AlertCircle,
  ArrowRight,
  FileText,
  Hash,
  MapPin,
  Package,
  Plus,
  Save,
  Trash2,
  Warehouse,
} from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import { PermissionGate } from "@/components/permission-gate";
import { EmptyState } from "@/components/ui/empty-state";
import { FixedBottomBar } from "@/components/ui/fixed-bottom-bar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { FormSection } from "@/components/ui/form-section";
import { NumberInput } from "@/components/ui/number-input";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { SectionLabel } from "@/components/ui/section-label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { NewTransferViewProps } from "./new-transfer.types";

interface NewTransferViewState extends NewTransferViewProps {
  isNotesOpen: boolean;
  notesValue?: string | null;
  setIsNotesOpen: Dispatch<SetStateAction<boolean>>;
  totalQuantity: number;
}

export function NewTransferView(props: NewTransferViewProps) {
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const totalQuantity = props.items.reduce(
    (acc, item) => acc + item.quantity,
    0,
  );
  const notesValue = props.form.watch("notes");
  const viewState: NewTransferViewState = {
    ...props,
    isNotesOpen,
    notesValue,
    setIsNotesOpen,
    totalQuantity,
  };

  return (
    <PageContainer bottomPadding="fixed-bar">
      <PageHeader title="Nova Transferência" subtitle="Criar Transferência" />
      <Form {...props.form}>
        <form
          onSubmit={props.form.handleSubmit(props.onSubmit)}
          className="space-y-6"
        >
          <TransferRouteCard viewState={viewState} />
          <TransferNotesModal viewState={viewState} />
          <TransferItemBuilder viewState={viewState} />
          <TransferItemsList viewState={viewState} />
          <TransferSubmitBar viewState={viewState} />
        </form>
      </Form>
    </PageContainer>
  );
}

function TransferRouteCard({
  viewState,
}: {
  viewState: NewTransferViewState;
}) {
  return (
    <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-5">
      <TransferRouteHeader viewState={viewState} />
      <TransferOriginNode />
      <TransferRouteConnector />
      <TransferDestinationField viewState={viewState} />
    </div>
  );
}

function TransferRouteHeader({
  viewState,
}: {
  viewState: NewTransferViewState;
}) {
  const { notesValue, setIsNotesOpen } = viewState;

  return (
    <div className="mb-5 flex items-center justify-between border-b border-neutral-800 pb-4">
      <div className="flex items-center gap-3">
        <ArrowRight className="size-5 text-blue-400" strokeWidth={2} />
        <div>
          <p className="text-sm font-bold text-white">Rota</p>
          <p className="text-xs text-neutral-500">
            Origem e destino da transferência
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
        <FileText className="size-3.5" />
        {notesValue ? "Editar Obs." : "Observações"}
      </Button>
    </div>
  );
}

function TransferOriginNode() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-[4px] border border-blue-600/50 bg-blue-600/10 text-blue-400">
        <Warehouse className="size-4" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          Origem
        </p>
        <p className="text-sm font-bold text-white">Seu depósito atual</p>
      </div>
    </div>
  );
}

function TransferRouteConnector() {
  return (
    <div className="ml-5 flex flex-col items-center py-2">
      <div className="h-5 w-px border-l border-dashed border-neutral-700" />
      <div className="flex size-6 items-center justify-center rounded-[4px] border border-neutral-700 bg-neutral-800/50">
        <ArrowRight
          className="size-3 rotate-90 text-neutral-500"
          strokeWidth={2.5}
        />
      </div>
      <div className="h-5 w-px border-l border-dashed border-neutral-700" />
    </div>
  );
}

function TransferDestinationField({
  viewState,
}: {
  viewState: NewTransferViewState;
}) {
  const { form, warehouses } = viewState;

  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
        Destino
      </p>
      <div className="flex items-center gap-3">
        <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-[4px] border border-neutral-700 bg-neutral-800 text-neutral-400">
          <MapPin className="size-4" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <FormField
            control={form.control}
            name="destinationWarehouseId"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-10 w-full rounded-[4px] border-2 border-neutral-800 bg-neutral-900 text-sm text-white focus:border-blue-600">
                      <SelectValue placeholder="Selecione o destino..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-[4px] border-neutral-800 bg-neutral-900">
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs text-rose-500" />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}

function TransferNotesModal({
  viewState,
}: {
  viewState: NewTransferViewState;
}) {
  const { form, isNotesOpen, setIsNotesOpen } = viewState;

  return (
    <ResponsiveModal
      open={isNotesOpen}
      onOpenChange={setIsNotesOpen}
      title="Observações"
      description="Adicione informações adicionais, instruções ou motivos para esta transferência."
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
      <div className="pt-2 pb-4">
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="Digite suas observações aqui..."
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

function TransferItemBuilder({
  viewState,
}: {
  viewState: NewTransferViewState;
}) {
  return (
    <FormSection
      icon={Package}
      iconColor="text-emerald-400"
      title="Adicionar Item"
      description="Selecione produto, lote e quantidade"
    >
      <div className="space-y-4">
        <TransferProductBatchSelectors viewState={viewState} />
        <TransferQuantityInput viewState={viewState} />
        <TransferAddItemError addItemError={viewState.addItemError} />
      </div>
    </FormSection>
  );
}

function TransferProductBatchSelectors({
  viewState,
}: {
  viewState: NewTransferViewState;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row">
      <TransferProductSelect viewState={viewState} />
      <TransferBatchSelect viewState={viewState} />
    </div>
  );
}

function TransferProductSelect({
  viewState,
}: {
  viewState: NewTransferViewState;
}) {
  const { onProductChange, products, selectedProductId } = viewState;

  return (
    <div className="min-w-0 flex-1 space-y-2">
      <label
        htmlFor="transfer-product-select"
        className="text-xs font-bold text-neutral-400"
      >
        PRODUTO
      </label>
      <Select value={selectedProductId} onValueChange={onProductChange}>
        <SelectTrigger
          id="transfer-product-select"
          className="h-10 w-full rounded-[4px] border-2 border-neutral-800 bg-neutral-900 text-sm text-white focus:border-blue-600"
        >
          <SelectValue placeholder="Selecione um produto..." />
        </SelectTrigger>
        <SelectContent className="rounded-[4px] border-neutral-800 bg-neutral-900">
          {products.map((product) => (
            <SelectItem key={product.id} value={product.id}>
              {product.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function TransferBatchSelect({
  viewState,
}: {
  viewState: NewTransferViewState;
}) {
  const { batches, onBatchChange, selectedBatchId, selectedProductId } =
    viewState;

  return (
    <div className="min-w-0 flex-1 space-y-2">
      <label
        htmlFor="transfer-batch-select"
        className="text-xs font-bold text-neutral-400"
      >
        LOTE (DISPONÍVEL)
      </label>
      <Select
        value={selectedBatchId}
        onValueChange={onBatchChange}
        disabled={!selectedProductId}
      >
        <SelectTrigger
          id="transfer-batch-select"
          className="h-10 w-full rounded-[4px] border-2 border-neutral-800 bg-neutral-900 text-sm text-white focus:border-blue-600 disabled:opacity-40"
        >
          <SelectValue placeholder="Selecione o lote" />
        </SelectTrigger>
        <SelectContent className="rounded-[4px] border-neutral-800 bg-neutral-900">
          {batches.map((batch) => (
            <SelectItem key={batch.id} value={batch.id}>
              <span className="font-mono text-xs tracking-tighter">
                {batch.code}
              </span>
              <span className="ml-2 text-neutral-500">
                ({batch.quantity} un.)
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function TransferQuantityInput({
  viewState,
}: {
  viewState: NewTransferViewState;
}) {
  const { itemQuantity, onAddItem, onQuantityChange } = viewState;

  return (
    <div className="space-y-2">
      <label
        htmlFor="transfer-item-quantity"
        className="text-xs font-bold text-neutral-400"
      >
        QUANTIDADE
      </label>
      <div className="flex items-center gap-3">
        <NumberInput
          id="transfer-item-quantity"
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
          className="h-10 flex-shrink-0 rounded-[4px] bg-emerald-600 px-5 text-xs font-bold uppercase tracking-wide text-white hover:bg-emerald-700"
        >
          <Plus className="mr-2 size-4" strokeWidth={2.5} />
          Adicionar
        </Button>
      </div>
    </div>
  );
}

function TransferAddItemError({
  addItemError,
}: {
  addItemError: string | null;
}) {
  if (!addItemError) return null;

  return (
    <div className="flex items-center gap-2 rounded-[4px] border border-rose-900/30 bg-rose-950/10 px-4 py-3">
      <AlertCircle className="size-4 flex-shrink-0 text-rose-500" strokeWidth={2} />
      <p className="text-xs font-medium text-rose-400">{addItemError}</p>
    </div>
  );
}

function TransferItemsList({
  viewState,
}: {
  viewState: NewTransferViewState;
}) {
  const { form, items } = viewState;

  return (
    <div>
      <SectionLabel icon={Hash} className="mb-4">
        Itens na Transferência ({items.length})
      </SectionLabel>
      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhum item adicionado"
          description="Selecione um produto e lote acima para adicionar itens à transferência."
        />
      ) : (
        <>
          <TransferItemsMobileList viewState={viewState} />
          <TransferItemsDesktopTable viewState={viewState} />
        </>
      )}
      {form.formState.errors.items && (
        <p className="mt-2 text-xs font-medium text-rose-500">
          {form.formState.errors.items.message}
        </p>
      )}
    </div>
  );
}

function TransferItemsMobileList({
  viewState,
}: {
  viewState: NewTransferViewState;
}) {
  return (
    <div className="flex flex-col gap-3 md:hidden">
      {viewState.items.map((item, index) => (
        <div
          key={item.id}
          className="flex items-center gap-3 rounded-[4px] border border-neutral-800 bg-[#171717] p-4"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">
              {item.productName || "Produto"}
            </p>
            <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500">
              <span>
                Lote:{" "}
                <span className="font-mono text-neutral-400">
                  {item.batchCode}
                </span>
              </span>
              <span>
                Qtd:{" "}
                <span className="font-mono font-bold tracking-tighter text-white">
                  {item.quantity}
                </span>
              </span>
            </div>
          </div>
          <TransferRemoveItemButton
            index={index}
            onRemoveItem={viewState.onRemoveItem}
            sizeClassName="size-9"
          />
        </div>
      ))}
    </div>
  );
}

function TransferItemsDesktopTable({
  viewState,
}: {
  viewState: NewTransferViewState;
}) {
  const { items, totalQuantity } = viewState;

  return (
    <div className="hidden md:block">
      <div className="rounded-[4px] border border-neutral-800 bg-[#171717]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                Produto
              </th>
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                Lote
              </th>
              <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                Quantidade
              </th>
              <th className="w-12 p-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <TransferItemsDesktopRow
                key={item.id}
                index={index}
                item={item}
                onRemoveItem={viewState.onRemoveItem}
              />
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-neutral-700">
              <td
                colSpan={2}
                className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500"
              >
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
  );
}

function TransferItemsDesktopRow({
  index,
  item,
  onRemoveItem,
}: {
  index: number;
  item: NewTransferViewProps["items"][number];
  onRemoveItem: (index: number) => void;
}) {
  return (
    <tr className="border-b border-neutral-800 last:border-0">
      <td className="px-5 py-3.5 text-sm font-medium text-white">
        {item.productName || "Produto"}
      </td>
      <td className="px-5 py-3.5 font-mono text-xs text-neutral-400">
        {item.batchCode || "—"}
      </td>
      <td className="px-5 py-3.5 text-right font-mono text-sm font-bold tracking-tighter text-white">
        {item.quantity}
      </td>
      <td className="p-3.5">
        <TransferRemoveItemButton
          index={index}
          onRemoveItem={onRemoveItem}
          sizeClassName="size-8"
        />
      </td>
    </tr>
  );
}

function TransferRemoveItemButton({
  index,
  onRemoveItem,
  sizeClassName,
}: {
  index: number;
  onRemoveItem: (index: number) => void;
  sizeClassName: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => onRemoveItem(index)}
      className={`${sizeClassName} rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-rose-500`}
    >
      <Trash2 className="size-4" strokeWidth={2} />
    </Button>
  );
}

function TransferSubmitBar({
  viewState,
}: {
  viewState: NewTransferViewState;
}) {
  const { isLoading, isSubmitting, items, totalQuantity } = viewState;

  return (
    <FixedBottomBar>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <TransferSummary items={items} totalQuantity={totalQuantity} />
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            className="h-10 rounded-[4px] border-neutral-800 text-xs font-bold uppercase tracking-wide"
          >
            CANCELAR
          </Button>
          <PermissionGate permission="transfers:create">
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="h-10 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
            >
              <Save className="mr-2 size-4" strokeWidth={2} />
              {isSubmitting ? "CRIANDO..." : "CRIAR TRANSFERÊNCIA"}
            </Button>
          </PermissionGate>
        </div>
      </div>
    </FixedBottomBar>
  );
}

function TransferSummary({
  items,
  totalQuantity,
}: {
  items: NewTransferViewProps["items"];
  totalQuantity: number;
}) {
  return (
    <div className="hidden items-center gap-4 text-xs text-neutral-500 sm:flex">
      <span>
        <span className="font-mono font-bold tracking-tighter text-neutral-300">
          {items.length}
        </span>{" "}
        {items.length === 1 ? "item" : "itens"}
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
    </div>
  );
}
