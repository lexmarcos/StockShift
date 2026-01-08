"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, ArrowUpRight, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Batch } from "../batches.types";

interface BatchesDetailViewProps {
  batch: Batch | null;
  isLoading: boolean;
  error: any;
  isDeleteOpen: boolean;
  onDeleteOpenChange: (open: boolean) => void;
  isDeleting: boolean;
  onDelete: () => void;
}

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  try {
    return format(new Date(value), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return value;
  }
};

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return "-";
  return `R$ ${value.toFixed(2)}`;
};

export const BatchesDetailView = ({
  batch,
  isLoading,
  error,
  isDeleteOpen,
  onDeleteOpenChange,
  isDeleting,
  onDelete,
}: BatchesDetailViewProps) => {
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 border-b border-border/40 bg-card">
          <div className="mx-auto flex h-14 w-full max-w-7xl items-center px-4 md:px-6 lg:px-8">
            <Link
              href="/batches"
              className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-muted/50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-10 text-xs text-muted-foreground">
          Carregando batch...
        </main>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 border-b border-border/40 bg-card">
          <div className="mx-auto flex h-14 w-full max-w-7xl items-center px-4 md:px-6 lg:px-8">
            <Link
              href="/batches"
              className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-muted/50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-10 text-xs text-muted-foreground">
          Batch não encontrado
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-20 border-b border-border/40 bg-card">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/batches"
              className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-muted/50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
            <div className="border-l border-border/40 pl-3">
              <h1 className="text-base font-semibold uppercase tracking-wide">
                {batch.batchNumber || batch.batchCode || "Batch"}
              </h1>
              <p className="text-xs text-muted-foreground hidden md:block">
                {batch.productName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/batches/${batch.id}/edit`}>
              <Button variant="outline" size="sm" className="rounded-sm border-border/40">
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Editar
              </Button>
            </Link>
            <AlertDialog open={isDeleteOpen} onOpenChange={onDeleteOpenChange}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-sm border-border/40">
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-sm">
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir batch?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação é irreversível. Se houver estoque, prefira ajustar via movimentações.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-sm">Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="rounded-sm"
                    onClick={onDelete}
                    disabled={isDeleting}
                  >
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border border-border/50 bg-card/80 rounded-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide">Produto</CardTitle>
              <CardDescription className="text-xs">Dados do item</CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nome</span>
                <span>{batch.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SKU</span>
                <span>{batch.productSku || "-"}</span>
              </div>
              {batch.productId && (
                <div className="flex justify-end pt-2">
                  <Link href={`/products/${batch.productId}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-sm border-border/40 text-xs"
                    >
                      Ver produto
                      <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-border/50 bg-card/80 rounded-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide">Warehouse</CardTitle>
              <CardDescription className="text-xs">Local de estoque</CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nome</span>
                <span>{batch.warehouseName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Código</span>
                <span>{batch.warehouseCode || "-"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card className="border border-border/50 bg-card/80 rounded-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide">Estoque</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantidade</span>
                <span>{batch.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Custo</span>
                <span>{formatCurrency(batch.costPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Venda</span>
                <span>{formatCurrency(batch.sellingPrice)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 bg-card/80 rounded-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide">Datas</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fabricação</span>
                <span>{formatDate(batch.manufacturedDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Validade</span>
                <span>{formatDate(batch.expirationDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em</span>
                <span>{formatDate(batch.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};
