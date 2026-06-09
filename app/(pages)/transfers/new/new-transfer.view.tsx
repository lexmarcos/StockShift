import {
  AlertCircle,
  ArrowRight,
  FileText,
  MapPin,
  Package,
  Save,
  Warehouse,
} from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import { PermissionGate } from "@/components/permission-gate";
import { FixedBottomBar } from "@/components/ui/fixed-bottom-bar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { FormSection } from "@/components/ui/form-section";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { NewTransferViewProps } from "./new-transfer.types";
import { NewTransferBatchDrawer } from "./new-transfer-batch-drawer.view";
import { TransferItemsList } from "./new-transfer-items-list.view";
import { TransferProductSearch } from "./new-transfer-product-search.view";
import { NewTransferScanner } from "./new-transfer-scanner.view";

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
    <PageContainer bottomPadding="fixed-bar" className="pb-44 md:pb-28">
      <PageHeader title="Nova Transferência" subtitle="Criar Transferência" />
      <NewTransferScanner
        open={props.isScannerOpen}
        onOpenChange={props.onScannerOpenChange}
        onScan={props.onBarcodeScan}
      />
      <NewTransferBatchDrawer
        form={props.batchDrawer}
        batches={props.batches}
        isLoading={props.isBatchLoading}
        onOpenChange={props.onBatchDrawerOpenChange}
        onBatchChange={props.onBatchChange}
        onQuantityChange={props.onQuantityChange}
        onQuantityIncrement={props.onQuantityIncrement}
        onQuantityDecrement={props.onQuantityDecrement}
        onConfirm={props.onConfirmBatch}
      />
      <Form {...props.form}>
        <form
          onSubmit={props.form.handleSubmit(props.onSubmit)}
          className="space-y-6"
        >
          <TransferRouteCard viewState={viewState} />
          <TransferNotesModal viewState={viewState} />
          <TransferItemBuilder viewState={viewState} />
          <TransferItemsList
            viewState={viewState}
            totalQuantity={viewState.totalQuantity}
          />
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
      title="Selecionar produto"
      description="Busque ou escaneie o produto para escolher o lote"
    >
      <div className="space-y-4">
        <TransferProductSearch viewState={viewState} />
        <TransferAddItemError addItemError={viewState.addItemError} />
      </div>
    </FormSection>
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

function TransferSubmitBar({
  viewState,
}: {
  viewState: NewTransferViewState;
}) {
  const { isFooterVisible, isLoading, isSubmitting, items, totalQuantity } =
    viewState;

  return (
    <FixedBottomBar
      className={cn(
        "bg-[#0A0A0A]/95 backdrop-blur-sm transition-transform duration-200 ease-in-out",
        isFooterVisible
          ? "translate-y-0"
          : "pointer-events-none translate-y-[calc(100%+1rem)]",
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <TransferSummary items={items} totalQuantity={totalQuantity} />
        <div className="flex w-full flex-col items-stretch gap-3 md:w-auto md:flex-row md:items-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            className="h-10 w-full rounded-[4px] border-neutral-800 text-xs font-bold uppercase tracking-wide md:w-auto"
          >
            CANCELAR
          </Button>
          <PermissionGate permission="transfers:create">
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="h-12 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 md:h-10 md:w-auto"
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
    <div className="flex items-center justify-between md:justify-start md:gap-4 text-xs text-neutral-500">
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
