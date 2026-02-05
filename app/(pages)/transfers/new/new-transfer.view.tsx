import { Plus, Trash2, ArrowRight, Package, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { NewTransferViewProps } from "./new-transfer.types";

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
  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-6 md:px-6 lg:px-8 pb-24">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Destination Warehouse */}
          <Card className="bg-[#171717] border-neutral-800 rounded-[4px]">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-blue-600" strokeWidth={2} />
                Destino
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="destinationWarehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-300">Warehouse de Destino</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-neutral-900 border-neutral-800 rounded-[4px] text-white focus:ring-blue-600">
                          <SelectValue placeholder="Selecione o destino..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-neutral-900 border-neutral-800 rounded-[4px]">
                        {warehouses.map((w) => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-rose-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel className="text-neutral-300">Observações (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Motivo da transferência..."
                        className="bg-neutral-900 border-neutral-800 rounded-[4px] text-white focus:border-blue-600 min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-rose-500" />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Add Items Section */}
          <Card className="bg-[#171717] border-neutral-800 rounded-[4px]">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="h-5 w-5 text-emerald-600" strokeWidth={2} />
                Adicionar Item
              </CardTitle>
              <CardDescription className="text-neutral-500">
                Selecione o produto e o lote de origem.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-5 space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Produto</label>
                  <Select value={selectedProductId} onValueChange={onProductChange}>
                    <SelectTrigger className="bg-neutral-900 border-neutral-800 rounded-[4px] text-white">
                      <SelectValue placeholder="Buscar produto..." />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800 rounded-[4px]">
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-4 space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Lote (Disponível)</label>
                  <Select value={selectedBatchId} onValueChange={onBatchChange} disabled={!selectedProductId}>
                    <SelectTrigger className="bg-neutral-900 border-neutral-800 rounded-[4px] text-white disabled:opacity-50">
                      <SelectValue placeholder="Selecione o lote" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800 rounded-[4px]">
                      {batches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.code} ({b.quantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Qtd.</label>
                  <Input
                    type="number"
                    value={itemQuantity}
                    onChange={(e) => onQuantityChange(e.target.value)}
                    className="bg-neutral-900 border-neutral-800 rounded-[4px] text-white"
                    placeholder="0"
                    min={1}
                  />
                </div>

                <div className="md:col-span-1">
                  <Button
                    type="button"
                    onClick={onAddItem}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-[4px]"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                  </Button>
                </div>
              </div>

              {addItemError && (
                <Alert variant="destructive" className="bg-rose-500/10 border-rose-900 text-rose-500 rounded-[4px]">
                  <AlertCircle className="h-4 w-4" strokeWidth={2} />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{addItemError}</AlertDescription>
                </Alert>
              )}

              <Separator className="bg-neutral-800 my-4" />

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-neutral-400">
                  Itens na Transferência ({items.length})
                </h3>

                {items.length === 0 && (
                  <div className="text-center py-8 text-neutral-600 border border-dashed border-neutral-800 rounded-[4px]">
                    Nenhum item adicionado
                  </div>
                )}

                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-neutral-900/50 border border-neutral-800 rounded-[4px]"
                    >
                      <div className="grid grid-cols-3 gap-4 flex-1">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">
                            {item.productName}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-neutral-500">Lote</span>
                          <span className="text-sm text-neutral-300">
                            {item.batchCode}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-neutral-500">Qtd.</span>
                          <span className="text-sm font-bold text-white">
                            {item.quantity}
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveItem(index)}
                        className="text-neutral-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-[4px]"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </Button>
                    </div>
                  ))}
                </div>
                {form.formState.errors.items && (
                  <p className="text-sm font-medium text-rose-500">
                    {form.formState.errors.items.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
              className="bg-transparent border-neutral-700 text-neutral-300 hover:bg-neutral-900 rounded-[4px] uppercase tracking-wide"
            >
              CANCELAR
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide rounded-[4px] px-8 uppercase"
            >
              {isSubmitting ? "CRIANDO..." : "CRIAR TRANSFERÊNCIA"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
