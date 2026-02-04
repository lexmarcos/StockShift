"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { UseFormReturn } from "react-hook-form";
import { CreateTransferFormData } from "./create-transfer.schema";
import { Product, Warehouse } from "./create-transfer.types";

interface CreateTransferViewProps {
  form: UseFormReturn<CreateTransferFormData>;
  onSubmit: (data: CreateTransferFormData) => Promise<void>;
  warehouses: Warehouse[];
  products: Product[];
  currentWarehouseName: string;
  isSubmitting: boolean;
  items: { id: string }[];
  addItem: () => void;
  removeItem: (index: number) => void;
}

export const CreateTransferView = ({
  form,
  onSubmit,
  warehouses,
  products,
  currentWarehouseName,
  isSubmitting,
  items,
  addItem,
  removeItem,
}: CreateTransferViewProps) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Origin (read-only) */}
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Origem
          </label>
          <div className="mt-1 px-3 py-2 bg-muted/50 rounded-md text-sm">
            {currentWarehouseName || "Carregando..."}
          </div>
        </div>

        {/* Destination */}
        <FormField
          control={form.control}
          name="destinationWarehouseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Destino</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o warehouse" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações sobre a transferência..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Produtos</label>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>

          {items.map((item, index) => (
            <div key={item.id} className="flex gap-2 items-start">
              <FormField
                control={form.control}
                name={`items.${index}.productId`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Produto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`items.${index}.quantity`}
                render={({ field }) => (
                  <FormItem className="w-24">
                    <FormControl>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="Qtd"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(index)}
                disabled={items.length === 1}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="sticky bottom-0 bg-background pt-4 pb-2 -mx-4 px-4 border-t border-border/40">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Criando..." : "Criar Transferência"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
