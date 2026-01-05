"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Loader2,
  Eye,
  Pencil,
  Warehouse,
  Plus,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Move,
  ScanLine,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ScannerDrawer } from "@/components/product/scanner-drawer/scanner-drawer";
import { ProductsViewProps, SortField, SortOrder } from "./products.types";

export const ProductsView = ({
  products,
  isLoading,
  error,
  requiresWarehouse,
  filters,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onSortChange,
}: ProductsViewProps) => {
  const [scannerOpen, setScannerOpen] = useState(false);
  
  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: "Sem Estoque", variant: "destructive" as const };
    if (quantity < 10) return { label: "Baixo", variant: "secondary" as const };
    if (quantity < 50) return { label: "Normal", variant: "default" as const };
    return { label: "Alto", variant: "default" as const };
  };

  const handleSort = (field: SortField) => {
    const newOrder: SortOrder =
      filters.sortBy === field && filters.sortOrder === "asc" ? "desc" : "asc";
    onSortChange(field, newOrder);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (filters.sortBy !== field) return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/40" />;
    return filters.sortOrder === "asc" ? (
      <ArrowUpDown className="ml-1 h-3 w-3 text-foreground" />
    ) : (
      <ArrowUpDown className="ml-1 h-3 w-3 text-foreground rotate-180" />
    );
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Sticky Header - Corporate Solid */}
      <header className="sticky top-0 z-20 border-b border-border/40 bg-card">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
          <div>
            <h1 className="text-base font-semibold tracking-tight uppercase">
              Produtos
            </h1>
            <p className="text-xs text-muted-foreground hidden md:block mt-0.5">
              {pagination.totalElements}{" "}
              {pagination.totalElements === 1 ? "produto" : "produtos"} no armazém
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setScannerOpen(true)}
              variant="outline"
              className="hidden md:flex rounded-sm border-border/60 hover:bg-muted/50"
            >
              <ScanLine className="mr-2 h-3.5 w-3.5" />
              Adicionar via Scanner
            </Button>
            <Link href="/products/create">
              <Button className="hidden md:flex rounded-sm bg-foreground text-background hover:bg-foreground/90">
                <Plus className="mr-2 h-3.5 w-3.5" />
                Novo Produto
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Scanner Drawer */}
      <ScannerDrawer open={scannerOpen} onOpenChange={setScannerOpen} />

      <main className="mx-auto w-full max-w-7xl py-6 px-4 md:px-6 lg:px-8">
        {/* Warehouse Required State */}
        {requiresWarehouse && (
          <Card className="border border-border/50 bg-card/80 rounded-sm">
            <CardContent className="pt-12 pb-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-sm bg-muted/20 border border-border/30 mb-4">
                  <Warehouse className="h-8 w-8 text-foreground/40" />
                </div>
                <h3 className="text-sm font-semibold uppercase tracking-wide mb-2">
                  Nenhum armazém selecionado
                </h3>
                <p className="text-xs text-muted-foreground/70 mb-6 max-w-sm">
                  Selecione um armazém primeiro para visualizar os produtos
                </p>
                <Link href="/warehouses">
                  <Button className="rounded-sm bg-foreground text-background hover:bg-foreground/90">
                    <Warehouse className="mr-2 h-3.5 w-3.5" />
                    Selecionar Armazém
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {!requiresWarehouse && (
          <Card className="border border-border/50 bg-card/80 rounded-sm">
            <CardHeader className="border-b border-border/30 pb-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-foreground/5 border border-border/30">
                    <Package className="h-4 w-4 text-foreground/70" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                      Lista de Produtos
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      {pagination.totalElements}{" "}
                      {pagination.totalElements === 1 ? "produto" : "produtos"}
                    </CardDescription>
                  </div>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                  <Input
                    placeholder="Buscar por nome, SKU ou código de barras..."
                    value={filters.searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9 h-9 rounded-sm border-border/40 text-xs bg-background"
                  />
                </div>

                {/* Sort */}
                <Select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onValueChange={(value) => {
                    const [field, order] = value.split("-") as [SortField, SortOrder];
                    onSortChange(field, order);
                  }}
                >
                  <SelectTrigger className="w-full md:w-[180px] h-9 rounded-sm border-border/40 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-sm">
                    <SelectItem value="name-asc" className="text-xs">Nome (A-Z)</SelectItem>
                    <SelectItem value="name-desc" className="text-xs">Nome (Z-A)</SelectItem>
                    <SelectItem value="sku-asc" className="text-xs">SKU (A-Z)</SelectItem>
                    <SelectItem value="sku-desc" className="text-xs">SKU (Z-A)</SelectItem>
                    <SelectItem value="createdAt-desc" className="text-xs">Mais Recentes</SelectItem>
                    <SelectItem value="createdAt-asc" className="text-xs">Mais Antigos</SelectItem>
                  </SelectContent>
                </Select>

                {/* Page Size */}
                <Select
                  value={filters.pageSize.toString()}
                  onValueChange={(value) => onPageSizeChange(Number(value))}
                >
                  <SelectTrigger className="w-full md:w-[120px] h-9 rounded-sm border-border/40 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-sm">
                    <SelectItem value="10" className="text-xs">10 / página</SelectItem>
                    <SelectItem value="20" className="text-xs">20 / página</SelectItem>
                    <SelectItem value="50" className="text-xs">50 / página</SelectItem>
                    <SelectItem value="100" className="text-xs">100 / página</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="pt-5">
              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="flex items-center justify-center py-12 text-destructive">
                  Erro ao carregar produtos
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && products.length === 0 && !filters.searchQuery && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-sm bg-muted/20 border border-border/30 mb-4">
                    <Package className="h-8 w-8 text-foreground/40" />
                  </div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide mb-2">
                    Nenhum produto encontrado
                  </h3>
                  <p className="text-xs text-muted-foreground/70 mb-4 max-w-sm">
                    Adicione produtos a este armazém para começar
                  </p>
                  <Link href="/products/create">
                    <Button className="rounded-sm bg-foreground text-background hover:bg-foreground/90">
                      <Plus className="mr-2 h-3.5 w-3.5" />
                      Criar Produto
                    </Button>
                  </Link>
                </div>
              )}

              {/* No Results State */}
              {!isLoading && !error && products.length === 0 && filters.searchQuery && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-sm bg-muted/20 border border-border/30 mb-4">
                    <Search className="h-8 w-8 text-foreground/40" />
                  </div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide mb-2">
                    Nenhum resultado encontrado
                  </h3>
                  <p className="text-xs text-muted-foreground/70 mb-4 max-w-sm">
                    Tente buscar com outros termos
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => onSearchChange("")}
                    className="rounded-sm border-border/40 text-xs"
                  >
                    Limpar Busca
                  </Button>
                </div>
              )}

              {/* Desktop Table */}
              {!isLoading && !error && products.length > 0 && (
                <>
                  <div className="hidden md:block rounded-sm border border-border/40">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-border/30">
                          <TableHead
                            className="text-xs font-semibold uppercase tracking-wide cursor-pointer hover:text-foreground"
                            onClick={() => handleSort("name")}
                          >
                            <div className="flex items-center">
                              Nome
                              <SortIcon field="name" />
                            </div>
                          </TableHead>
                          <TableHead
                            className="text-xs font-semibold uppercase tracking-wide cursor-pointer hover:text-foreground"
                            onClick={() => handleSort("sku")}
                          >
                            <div className="flex items-center">
                              SKU
                              <SortIcon field="sku" />
                            </div>
                          </TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wide">
                            Categoria
                          </TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wide">
                            Marca
                          </TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wide">
                            Quantidade
                          </TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wide">
                            Status
                          </TableHead>
                          <TableHead className="w-32 text-right text-xs font-semibold uppercase tracking-wide">
                            Ações
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => {
                          const stockStatus = getStockStatus(product.totalQuantity);
                          return (
                            <TableRow
                              key={product.id}
                              className="border-b border-border/20 hover:bg-muted/30"
                            >
                              <TableCell className="font-medium text-sm">
                                <div className="flex flex-col">
                                  <span>{product.name}</span>
                                  {product.barcode && (
                                    <span className="text-xs text-muted-foreground/60 mt-0.5">
                                      {product.barcode}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground/80">
                                {product.sku || "—"}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground/80">
                                {product.categoryName || "—"}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground/80">
                                {product.brand?.name || "—"}
                              </TableCell>
                              <TableCell className="text-xs font-medium">
                                {product.totalQuantity}
                              </TableCell>
                              <TableCell>
                                <Badge variant={stockStatus.variant} className="rounded-sm text-xs">
                                  {stockStatus.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Link href={`/products/${product.id}`}>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 rounded-sm"
                                      title="Ver detalhes"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                      <span className="sr-only">Ver detalhes</span>
                                    </Button>
                                  </Link>
                                  <Link href={`/products/${product.id}/edit`}>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 rounded-sm"
                                      title="Editar produto"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                      <span className="sr-only">Editar</span>
                                    </Button>
                                  </Link>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-sm"
                                    title="Movimentar estoque"
                                  >
                                    <Move className="h-3.5 w-3.5" />
                                    <span className="sr-only">Movimentar</span>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile List */}
                  <div className="md:hidden space-y-3">
                    {products.map((product) => {
                      const stockStatus = getStockStatus(product.totalQuantity);
                      return (
                        <Card
                          key={product.id}
                          className="border border-border/40 bg-card rounded-sm"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="text-sm font-semibold mb-1">
                                  {product.name}
                                </h3>
                                <div className="flex flex-col gap-1">
                                  {product.sku && (
                                    <p className="text-xs text-muted-foreground/70">
                                      SKU: {product.sku}
                                    </p>
                                  )}
                                  {product.barcode && (
                                    <p className="text-xs text-muted-foreground/70">
                                      Código: {product.barcode}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Badge variant={stockStatus.variant} className="rounded-sm text-xs">
                                {stockStatus.label}
                              </Badge>
                            </div>

                            <div className="space-y-2 text-xs mb-3 pb-3 border-b border-border/20">
                              {product.categoryName && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground/60">Categoria:</span>
                                  <span className="text-muted-foreground/80">
                                    {product.categoryName}
                                  </span>
                                </div>
                              )}
                              {product.brand && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground/60">Marca:</span>
                                  <span className="text-muted-foreground/80">
                                    {product.brand.name}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-muted-foreground/60">Quantidade:</span>
                                <span className="text-muted-foreground/80 font-medium">
                                  {product.totalQuantity}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Link href={`/products/${product.id}`} className="flex-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full rounded-sm border-border/40 text-xs"
                                >
                                  <Eye className="mr-2 h-3.5 w-3.5" />
                                  Ver
                                </Button>
                              </Link>
                              <Link href={`/products/${product.id}/edit`} className="flex-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full rounded-sm border-border/40 text-xs"
                                >
                                  <Pencil className="mr-2 h-3.5 w-3.5" />
                                  Editar
                                </Button>
                              </Link>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-sm border-border/40 text-xs px-2"
                              >
                                <Move className="h-3.5 w-3.5" />
                                <span className="sr-only">Movimentar</span>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-5 pt-5 border-t border-border/30">
                      <div className="text-xs text-muted-foreground/70">
                        Página {pagination.page + 1} de {pagination.totalPages} •{" "}
                        {pagination.totalElements} {pagination.totalElements === 1 ? "item" : "itens"}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPageChange(pagination.page - 1)}
                          disabled={pagination.page === 0}
                          className="rounded-sm border-border/40 text-xs h-8"
                        >
                          <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                          Anterior
                        </Button>

                        <div className="hidden md:flex items-center gap-1">
                          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            let pageNum: number;
                            if (pagination.totalPages <= 5) {
                              pageNum = i;
                            } else if (pagination.page < 3) {
                              pageNum = i;
                            } else if (pagination.page >= pagination.totalPages - 3) {
                              pageNum = pagination.totalPages - 5 + i;
                            } else {
                              pageNum = pagination.page - 2 + i;
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={pagination.page === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => onPageChange(pageNum)}
                                className="rounded-sm border-border/40 text-xs h-8 w-8 p-0"
                              >
                                {pageNum + 1}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPageChange(pagination.page + 1)}
                          disabled={pagination.page >= pagination.totalPages - 1}
                          className="rounded-sm border-border/40 text-xs h-8"
                        >
                          Próxima
                          <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Floating Action Buttons - Mobile */}
      {!requiresWarehouse && (
        <>
          {/* Scanner Button */}
          <Button
            onClick={() => setScannerOpen(true)}
            className="fixed bottom-6 right-20 h-12 w-12 rounded-sm border-border/60 bg-card text-foreground hover:bg-muted/50 md:hidden border"
            size="icon"
          >
            <ScanLine className="h-5 w-5" />
            <span className="sr-only">Adicionar via Scanner</span>
          </Button>
          
          {/* Create Product Button */}
          <Link href="/products/create">
            <Button
              className="fixed bottom-6 right-6 h-12 w-12 rounded-sm bg-foreground text-background hover:bg-foreground/90 md:hidden"
              size="icon"
            >
              <Plus className="h-5 w-5" />
              <span className="sr-only">Novo Produto</span>
            </Button>
          </Link>
        </>
      )}
    </div>
  );
};
