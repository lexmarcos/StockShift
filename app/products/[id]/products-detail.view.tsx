"use client";

import { Product } from "./products-detail.types";
import {
  ArrowLeft,
  Package,
  Tag,
  Barcode,
  CheckCircle2,
  XCircle,
  Calendar,
  Layers,
  AlertCircle,
  Building2,
  Hash,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProductDetailViewProps {
  product: Product | null;
  isLoading: boolean;
  error: Error | null;
}

export const ProductDetailView = ({
  product,
  isLoading,
  error,
}: ProductDetailViewProps) => {
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 border-b border-border/40 bg-card">
          <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Link
                href="/products"
                className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-muted/50 hover:bg-muted"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-sm border border-border/40 bg-muted/20 flex items-center justify-center mb-3">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Carregando produto...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 border-b border-border/40 bg-card">
          <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Link
                href="/products"
                className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-muted/50 hover:bg-muted"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-sm border border-border/40 bg-muted/20 flex items-center justify-center mb-3">
                <AlertCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Produto não encontrado
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", {
        locale: ptBR,
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", {
        locale: ptBR,
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/40 bg-card">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/products"
              className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-muted/50 hover:bg-muted"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
            <div className="border-l border-border/40 pl-3">
              <h1 className="text-base font-semibold tracking-tight">
                DETALHES DO PRODUTO
              </h1>
            </div>
          </div>
          {product && (
            <Link
              href={`/products/${product.id}/edit`}
              className="inline-flex h-8 items-center justify-center rounded-sm border border-border bg-muted/50 hover:bg-muted px-3 text-xs font-semibold uppercase tracking-wide"
            >
              Editar
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        {/* Hero Section - Asymmetric Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
          {/* Image - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <Card className="border border-border/50 bg-card/80 rounded-sm overflow-hidden h-full">
              <CardContent className="p-0">
                <div className="relative aspect-square w-full bg-background/30 flex items-center justify-center">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-contain p-8"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-16 w-16 rounded-sm border border-border/40 bg-muted/20 flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground/50">
                        Sem Imagem
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Info - Takes 3 columns on large screens */}
          <div className="lg:col-span-3 space-y-6">
            {/* Product Name & Status */}
            <Card className="border border-border/50 bg-card/80 rounded-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold tracking-tight mb-2">
                      {product.name}
                    </h2>
                    {product.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {product.description}
                      </p>
                    )}
                  </div>
                  <div
                    className={`flex-shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border ${
                      product.active
                        ? "border-green-900/30 bg-green-950/20"
                        : "border-red-900/30 bg-red-950/20"
                    }`}
                  >
                    {product.active ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                    )}
                    <span
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        product.active ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {product.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/30">
                  {product.sku && (
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground/50" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                          SKU
                        </p>
                        <p className="text-xs font-semibold">{product.sku}</p>
                      </div>
                    </div>
                  )}
                  {product.barcode && (
                    <div className="flex items-center gap-2">
                      <Barcode className="h-4 w-4 text-muted-foreground/50" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                          Código de Barras
                        </p>
                        <p className="text-xs font-semibold">
                          {product.barcode}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Classification Grid - 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <Card className="border border-border/50 bg-card/80 rounded-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-sm border border-border/40 bg-foreground/5 flex items-center justify-center flex-shrink-0">
                      <Tag className="h-5 w-5 text-foreground/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">
                        Categoria
                      </p>
                      <p className="text-sm font-semibold truncate">
                        {product.categoryName || "Não categorizado"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Brand */}
              <Card className="border border-border/50 bg-card/80 rounded-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-sm border border-border/40 bg-foreground/5 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-foreground/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">
                        Marca
                      </p>
                      <p className="text-sm font-semibold truncate">
                        {product.brand?.name || "Sem marca"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Secondary Info Grid - Asymmetric 3-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Product Type */}
          <Card className="border border-border/50 bg-card/80 rounded-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-sm border border-border/40 bg-foreground/5 flex items-center justify-center flex-shrink-0">
                  <Layers className="h-4 w-4 text-foreground/70" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-1">
                    Tipo
                  </p>
                  <p className="text-xs font-semibold">
                    {product.isKit ? "Kit / Combo" : "Produto Individual"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expiration Control */}
          <Card className="border border-border/50 bg-card/80 rounded-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-sm border border-border/40 bg-foreground/5 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-4 w-4 text-foreground/70" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-1">
                    Validade
                  </p>
                  <p className="text-xs font-semibold">
                    {product.hasExpiration
                      ? "Controlado"
                      : "Sem Controle"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Barcode Type */}
          {product.barcodeType && (
            <Card className="border border-border/50 bg-card/80 rounded-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-sm border border-border/40 bg-foreground/5 flex items-center justify-center flex-shrink-0">
                    <Barcode className="h-4 w-4 text-foreground/70" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-1">
                      Tipo de Código
                    </p>
                    <p className="text-xs font-semibold">
                      {product.barcodeType}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Attributes Section */}
        {product.attributes && Object.keys(product.attributes).length > 0 && (
          <Card className="border border-border/50 bg-card/80 rounded-sm mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/30">
                <div className="h-8 w-8 rounded-sm border border-border/40 bg-foreground/5 flex items-center justify-center">
                  <Package className="h-4 w-4 text-foreground/70" />
                </div>
                <h3 className="text-sm font-semibold uppercase tracking-wide">
                  Atributos do Produto
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(product.attributes).map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-sm border border-border/40 bg-background/30 p-3"
                  >
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-1">
                      {key}
                    </p>
                    <p className="text-sm font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadata Section */}
        <Card className="border border-border/50 bg-card/80 rounded-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/30">
              <div className="h-8 w-8 rounded-sm border border-border/40 bg-foreground/5 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-foreground/70" />
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-wide">
                Informações do Sistema
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-1">
                  Data de Criação
                </p>
                <p className="text-sm font-medium">
                  {formatDateTime(product.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-1">
                  Última Atualização
                </p>
                <p className="text-sm font-medium">
                  {formatDateTime(product.updatedAt)}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-1">
                  ID do Produto
                </p>
                <p className="text-xs font-mono text-muted-foreground bg-muted/20 px-3 py-2 rounded-sm inline-block">
                  {product.id}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
