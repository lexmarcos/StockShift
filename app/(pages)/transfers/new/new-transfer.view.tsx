import {
  Plus,
  Trash2,
  ArrowRight,
  Package,
  AlertCircle,
  Warehouse,
  MapPin,
  FileText,
  Save,
  Hash,
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
import { NewTransferViewProps } from "./new-transfer.types";
import { PermissionGate } from "@/components/permission-gate";

export function NewTransferView({
  form,
  onSubmit,
  warehouses,
  products,
  batches,
  isLoading,
  isSubmitting,
  selectedProductId,
  selectedBatchId,
  itemQuantity,
  addItemError,
  onProductChange,
  onBatchChange,
  onQuantityChange,
  onAddItem,
  onRemoveItem,
  items,
}: NewTransferViewProps) {
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
  const notesValue = form.watch("notes");

  return (
    <PageContainer bottomPadding="fixed-bar">
      <PageHeader title="Nova Transferência" subtitle="Criar Transferência" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* ── Route Card ── */}
          <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-5">
            <div className="mb-5 flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <ArrowRight className="h-5 w-5 text-blue-400" strokeWidth={2} />
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
                <FileText className="h-3.5 w-3.5" />
                {notesValue ? "Editar Obs." : "Observações"}
              </Button>
            </div>

            {/* Origin */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[4px] border border-blue-600/50 bg-blue-600/10 text-blue-400">
                <Warehouse className="h-4 w-4" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  Origem
                </p>
                <p className="text-sm font-bold text-white">
                  Seu depósito atual
                </p>
              </div>
            </div>

            {/* Connector */}
            <div className="ml-5 flex flex-col items-center py-2">
              <div className="h-5 w-px border-l border-dashed border-neutral-700" />
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-700 bg-neutral-800/50">
                <ArrowRight className="h-3 w-3 rotate-90 text-neutral-500" strokeWidth={2.5} />
              </div>
              <div className="h-5 w-px border-l border-dashed border-neutral-700" />
            </div>

            {/* Destination */}
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                Destino
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[4px] border border-neutral-700 bg-neutral-800 text-neutral-400">
                  <MapPin className="h-4 w-4" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <FormField
                    control={form.control}
                    name="destinationWarehouseId"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10 w-full rounded-[4px] border-2 border-neutral-800 bg-neutral-900 text-sm text-white focus:border-blue-600">
                              <SelectValue placeholder="Selecione o destino..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-[4px] border-neutral-800 bg-neutral-900">
                            {warehouses.map((w) => (
                              <SelectItem key={w.id} value={w.id}>
                                {w.name}
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
          </div>

          {/* ── Notes Modal ── */}
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
            <div className="pb-4 pt-2">
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

          {/* ── Item Builder ── */}
          <FormSection
            icon={Package}
            iconColor="text-emerald-400"
            title="Adicionar Item"
            description="Selecione produto, lote e quantidade"
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
                  >
                    <SelectTrigger className="h-10 w-full rounded-[4px] border-2 border-neutral-800 bg-neutral-900 text-sm text-white focus:border-blue-600">
                      <SelectValue placeholder="Selecione um produto..." />
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

                <div className="min-w-0 flex-1 space-y-2">
                  <label className="text-xs font-bold text-neutral-400">
                    LOTE (DISPONÍVEL)
                  </label>
                  <Select
                    value={selectedBatchId}
                    onValueChange={onBatchChange}
                    disabled={!selectedProductId}
                  >
                    <SelectTrigger className="h-10 w-full rounded-[4px] border-2 border-neutral-800 bg-neutral-900 text-sm text-white focus:border-blue-600 disabled:opacity-40">
                      <SelectValue placeholder="Selecione o lote" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[4px] border-neutral-800 bg-neutral-900">
                      {batches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          <span className="font-mono text-xs tracking-tighter">
                            {b.code}
                          </span>
                          <span className="ml-2 text-neutral-500">
                            ({b.quantity} un.)
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400">
                  QUANTIDADE
                </label>
                <div className="flex items-center gap-3">
                  <NumberInput
                    value={itemQuantity ? Number(itemQuantity) : undefined}
                    onValueChange={(val) => onQuantityChange(val !== undefined ? String(val) : "")}
                    className="h-10 w-full rounded-[4px] border-2 border-neutral-800 bg-neutral-900 font-mono text-sm tracking-tighter text-white focus:border-blue-600"
                    placeholder="0"
                  />
                  <Button
                    type="button"
                    onClick={onAddItem}
                    className="h-10 flex-shrink-0 rounded-[4px] bg-emerald-600 px-5 text-xs font-bold uppercase tracking-wide text-white hover:bg-emerald-700"
                  >
                    <Plus className="mr-2 h-4 w-4" strokeWidth={2.5} />
                    Adicionar
                  </Button>
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
                          <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                            Lote
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
                            <td className="px-5 py-3.5 font-mono text-xs text-neutral-400">
                              {item.batchCode || "—"}
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
              </>
            )}

            {form.formState.errors.items && (
              <p className="mt-2 text-xs font-medium text-rose-500">
                {form.formState.errors.items.message}
              </p>
            )}
          </div>

          {/* ── Fixed Bottom Bar ── */}
          <FixedBottomBar>
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
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
                    <Save className="mr-2 h-4 w-4" strokeWidth={2} />
                    {isSubmitting ? "CRIANDO..." : "CRIAR TRANSFERÊNCIA"}
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
