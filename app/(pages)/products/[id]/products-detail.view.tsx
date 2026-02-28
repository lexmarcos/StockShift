"use client";

import { Product, ProductBatch } from "./products-detail.types";
import {
  ArrowLeft,
  Package,
  Tag,
  Barcode,
  Calendar,
  Layers,
  AlertCircle,
  Building2,
  Hash,
  Pencil,
  Clock,
  QrCode,
  Box,
  Copy,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PermissionGate } from "@/components/permission-gate";

interface ProductDetailViewProps {
  product: Product | null;
  batches: ProductBatch[];
  isLoading: boolean;
  isLoadingBatches: boolean;
  error: Error | null;
  batchesError: Error | null;
}

export const ProductDetailView = ({
  product,
  batches,
  isLoading,
  isLoadingBatches,
  error,
  batchesError,
}: ProductDetailViewProps) => {
  // Formatters
  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy • HH:mm", {
        locale: ptBR,
      }).toUpperCase();
    } catch {
      return dateString;
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`, {
      className: "bg-[#171717] border-neutral-800 text-white rounded-[4px]",
      descriptionClassName: "text-neutral-400",
    });
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Sem validade";

    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] font-sans">
        <header className="sticky top-0 z-30 border-b border-neutral-800 bg-[#0A0A0A]/95 backdrop-blur-sm">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
            <div className="h-9 w-24 animate-pulse rounded-[4px] bg-neutral-900" />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="aspect-square animate-pulse rounded-[4px] bg-neutral-900" />
            <div className="space-y-4 lg:col-span-2">
              <div className="h-12 w-3/4 animate-pulse rounded-[4px] bg-neutral-900" />
              <div className="h-24 w-full animate-pulse rounded-[4px] bg-neutral-900" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-20 animate-pulse rounded-[4px] bg-neutral-900" />
                <div className="h-20 animate-pulse rounded-[4px] bg-neutral-900" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error State
  if (error || !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] text-neutral-400">
        <div className="flex h-20 w-20 items-center justify-center rounded-[4px] bg-rose-950/20 ring-1 ring-rose-900/40 mb-6">
          <AlertCircle className="h-10 w-10 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold uppercase tracking-wide text-white">
          Produto não encontrado
        </h2>
        <p className="mt-2 max-w-md text-center text-sm">
          O produto que você está procurando não existe ou foi removido do
          sistema.
        </p>
        <Link href="/products" className="mt-8">
          <Button
            variant="outline"
            className="rounded-[4px] border-neutral-800 bg-transparent text-white hover:bg-neutral-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Lista
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-neutral-200 font-sans pb-20">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <PermissionGate permission="products:update">
          <div className="w-full flex justify-end mb-4">
            <Link href={`/products/${product.id}/edit`} className="shrink-0">
              <Button className="h-9 w-full sm:w-auto rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)]">
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Editar Produto
              </Button>
            </Link>
          </div>
        </PermissionGate>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Image & Quick Stats (4 cols) */}
          <div className="space-y-6 lg:col-span-4">
            {/* Product Image Card */}
            <div className="relative overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717] group">
              <div className="absolute top-3 right-3 z-10">
                <Badge
                  className={cn(
                    "rounded-[2px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    product.active
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-500 border-rose-500/20",
                  )}
                >
                  {product.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              <div className="aspect-square w-full flex items-center justify-center bg-[url('/grid-pattern.svg')] bg-center p-8">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-neutral-700">
                    <Package className="h-20 w-20 stroke-1 mb-4 opacity-50" />
                    <span className="text-xs uppercase tracking-widest font-medium">
                      Sem Imagem
                    </span>
                  </div>
                )}
              </div>

              {/* Image Footer Stats */}
              <div className="grid grid-cols-2 border-t border-neutral-800 bg-neutral-900/50">
                <div className="flex flex-col items-center justify-center p-3 border-r border-neutral-800">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                    Tipo
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-white">
                    {product.isKit ? (
                      <Layers className="h-3.5 w-3.5 text-purple-500" />
                    ) : (
                      <Box className="h-3.5 w-3.5 text-blue-500" />
                    )}
                    {product.isKit ? "KIT / COMBO" : "UNITÁRIO"}
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center p-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                    Validade
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-white">
                    <Clock
                      className={cn(
                        "h-3.5 w-3.5",
                        product.hasExpiration
                          ? "text-amber-500"
                          : "text-neutral-500",
                      )}
                    />
                    {product.hasExpiration ? "CONTROLADA" : "LIVRE"}
                  </div>
                </div>
              </div>
            </div>

            {/* System Info Card */}
            <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-5">
              <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white">
                <Clock className="h-3.5 w-3.5 text-neutral-500" />
                Metadados do Sistema
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-neutral-800/50">
                  <span className="text-xs text-neutral-500">Criado em</span>
                  <span className="text-xs font-mono text-neutral-300">
                    {formatDateTime(product.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-neutral-800/50">
                  <span className="text-xs text-neutral-500">
                    Atualizado em
                  </span>
                  <span className="text-xs font-mono text-neutral-300">
                    {formatDateTime(product.updatedAt)}
                  </span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500">
                    UUID do Produto
                  </span>
                  <button
                    onClick={() => copyToClipboard(product.id, "ID do Produto")}
                    className="flex w-full items-center justify-between rounded-[2px] bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs font-mono text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors group"
                  >
                    <span className="truncate mr-2">{product.id}</span>
                    <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Details (8 cols) */}
          <div className="space-y-6 lg:col-span-8">
            {/* Main Header Card */}
            <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />

              <div className="relative">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl font-bold uppercase tracking-tight text-white mb-2">
                      {product.name}
                    </h1>
                    <p className="text-sm text-neutral-400 leading-relaxed max-w-2xl">
                      {product.description ||
                        "Nenhuma descrição fornecida para este produto."}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* SKU Box */}
                  <div className="group flex items-center gap-4 rounded-[4px] border border-neutral-800 bg-neutral-900/50 p-4 transition-colors hover:border-neutral-700">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] bg-neutral-800 text-white group-hover:bg-blue-600 transition-colors">
                      <Hash className="h-5 w-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                        SKU (Stock Keeping Unit)
                      </p>
                      <p
                        className="font-mono text-sm font-bold text-white truncate"
                        title={product.sku || ""}
                      >
                        {product.sku || "NÃO DEFINIDO"}
                      </p>
                    </div>
                  </div>

                  {/* Barcode Box */}
                  <div className="group flex items-center gap-4 rounded-[4px] border border-neutral-800 bg-neutral-900/50 p-4 transition-colors hover:border-neutral-700">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] bg-neutral-800 text-white group-hover:bg-white group-hover:text-black transition-colors">
                      <Barcode className="h-5 w-5" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                          Código de Barras
                        </p>
                        {product.barcodeType && (
                          <span className="rounded-[2px] bg-neutral-800 px-1 py-px text-[9px] font-bold uppercase text-neutral-400">
                            {product.barcodeType}
                          </span>
                        )}
                      </div>
                      <p
                        className="font-mono text-sm font-bold text-white truncate"
                        title={product.barcode || ""}
                      >
                        {product.barcode || "NÃO CADASTRADO"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Categorization Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-neutral-800/50">
                    <Tag className="h-4 w-4 text-emerald-500" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white">
                    Categoria
                  </h3>
                </div>
                <div className="pl-11">
                  <p className="text-lg font-medium text-white">
                    {product.categoryName || "Sem Categoria"}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Classificação principal do item no estoque
                  </p>
                </div>
              </div>

              {/* Brand */}
              <div className="rounded-[4px] border border-neutral-800 bg-[#171717] p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-neutral-800/50">
                    <Building2 className="h-4 w-4 text-amber-500" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white">
                    Marca / Fabricante
                  </h3>
                </div>
                <div className="pl-11">
                  <p className="text-lg font-medium text-white">
                    {product.brand?.name || "Genérico"}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Fabricante registrado do produto
                  </p>
                </div>
              </div>
            </div>

            {/* Product Batches */}
            <div className="rounded-[4px] border border-neutral-800 bg-[#171717]">
              <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white">
                    Lotes do Produto
                  </h3>
                </div>
                <Badge className="rounded-[2px] border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-300">
                  {batches.length}
                </Badge>
              </div>

              <div className="p-5">
                {isLoadingBatches && (
                  <div className="space-y-3">
                    <div className="h-14 rounded-[4px] bg-neutral-900" />
                    <div className="h-14 rounded-[4px] bg-neutral-900" />
                  </div>
                )}

                {!isLoadingBatches && batchesError && (
                  <p className="text-xs text-rose-500/80">
                    Não foi possível carregar os lotes deste produto.
                  </p>
                )}

                {!isLoadingBatches && !batchesError && batches.length === 0 && (
                  <p className="text-sm text-neutral-500">
                    Nenhum lote cadastrado para este produto.
                  </p>
                )}

                {!isLoadingBatches && !batchesError && batches.length > 0 && (
                  <div className="space-y-3">
                    {batches.map((batch) => (
                      <Link
                        key={batch.id}
                        href={`/batches/${batch.id}`}
                        className="group flex items-center justify-between gap-4 rounded-[4px] border border-neutral-800 bg-neutral-900/40 px-4 py-3 hover:border-neutral-700"
                      >
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-bold uppercase tracking-wide text-white">
                            {batch.batchNumber || batch.batchCode || "SEM LOTE"}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {batch.warehouseName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white">
                            {batch.quantity} un
                          </p>
                          <div className="flex items-center justify-end gap-1 text-[10px] uppercase tracking-wide text-neutral-500">
                            <Calendar className="h-3 w-3" />
                            {formatDate(batch.expirationDate)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Attributes */}
            {product.attributes &&
              Object.keys(product.attributes).length > 0 && (
                <div className="rounded-[4px] border border-neutral-800 bg-[#171717]">
                  <div className="border-b border-neutral-800 px-5 py-4 flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-blue-500" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white">
                      Especificações Técnicas
                    </h3>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(product.attributes).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="group flex flex-col justify-center rounded-[4px] border border-neutral-800 bg-neutral-900/30 px-4 py-3 hover:bg-neutral-900/60 hover:border-neutral-700 transition-colors"
                          >
                            <span className="text-[10px] uppercase tracking-wider text-neutral-500 group-hover:text-neutral-400 mb-1">
                              {key}
                            </span>
                            <span className="text-sm font-medium text-white truncate">
                              {value}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </main>
    </div>
  );
};
