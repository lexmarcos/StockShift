"use client";

import Link from "next/link";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { BatchEditFormData } from "./batches-edit.schema";

interface BatchEditViewProps {
  form: UseFormReturn<BatchEditFormData>;
  onSubmit: (data: BatchEditFormData) => void;
  isLoading: boolean;
}

export const BatchEditView = ({ form, onSubmit, isLoading }: BatchEditViewProps) => {
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-4 py-10 text-xs text-muted-foreground">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-20 border-b border-border/40 bg-card">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 md:px-6 lg:px-8">
          <Link
            href="/batches"
            className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-muted/50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
          <div className="border-l border-border/40 pl-3">
            <h1 className="text-base font-semibold uppercase tracking-wide">Editar Batch</h1>
            <p className="text-xs text-muted-foreground hidden md:block">Atualização de lote</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="border border-border/50 bg-card/80 rounded-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">Identificação</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Produto</FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="h-9 rounded-sm border-border/40 text-xs" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="warehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Warehouse</FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="h-9 rounded-sm border-border/40 text-xs" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="batchCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Código do Batch</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-9 rounded-sm border-border/40 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border border-border/50 bg-card/80 rounded-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">Estoque</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Quantidade</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="h-9 rounded-sm border-border/40 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Custo</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} className="h-9 rounded-sm border-border/40 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sellingPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Venda</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} className="h-9 rounded-sm border-border/40 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border border-border/50 bg-card/80 rounded-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">Datas</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="manufacturedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Fabricação</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="h-9 rounded-sm border-border/40 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expirationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">Validade</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="h-9 rounded-sm border-border/40 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border border-border/50 bg-card/80 rounded-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea {...field} className="min-h-[80px] rounded-sm border-border/40 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" className="rounded-sm bg-foreground text-background">
                <Save className="mr-2 h-3.5 w-3.5" />
                Salvar alterações
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
};
