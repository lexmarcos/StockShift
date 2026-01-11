"use client";

import { Button } from "@/components/ui/button";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Package,
  Loader2,
  Eye,
  Pencil,
  Warehouse,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Move,
  ScanLine,
  Trash2,
  AlertTriangle,
  Filter,
  ArrowUp,
  ArrowDown,
  Layers,
  BarChart3,
  AlertCircle,
  XCircle,
  Tag,
  MoreHorizontal
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ScannerDrawer } from "@/components/product/scanner-drawer/scanner-drawer";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { ProductsViewProps, SortField, SortOrder } from "./products.types";
import { cn } from "@/lib/utils";

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
  onOpenDeleteDialog,
  onConfirmDelete,
  onSecondConfirmDelete,
  onCloseDeleteDialog,
  onCloseSecondConfirm,
  deleteDialogOpen,
  secondConfirmOpen,
  deleteProduct,
  deleteBatches,
  isCheckingDeleteBatches,
  isDeletingProduct,
}: ProductsViewProps) => {
  const [scannerOpen, setScannerOpen] = useState(false);
  
  // Calculate Client-Side Stats (Demo purposes as backend aggregation is separate)
  const lowStockCount = products.filter(p => p.totalQuantity > 0 && p.totalQuantity < 10).length;
  const outOfStockCount = products.filter(p => p.totalQuantity === 0).length;
  
  // Simple mode calculation for category
  const categories = products.map(p => p.categoryName).filter(Boolean) as string[];
  const topCategory = categories.length > 0 
    ? categories.sort((a,b) => categories.filter(v => v===a).length - categories.filter(v => v===b).length).pop() 
    : "N/A";

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { 
      label: "SEM ESTOQUE", 
      color: "text-rose-500", 
      bg: "bg-rose-500/10", 
      border: "border-rose-500/20",
      indicator: "bg-rose-500"
    };
    if (quantity < 10) return { 
      label: "BAIXO", 
      color: "text-amber-500", 
      bg: "bg-amber-500/10", 
      border: "border-amber-500/20",
      indicator: "bg-amber-500"
    };
    if (quantity < 50) return { 
      label: "REGULAR", 
      color: "text-blue-500", 
      bg: "bg-blue-500/10", 
      border: "border-blue-500/20",
      indicator: "bg-blue-500"
    };
    return { 
      label: "ALTO", 
      color: "text-emerald-500", 
      bg: "bg-emerald-500/10", 
      border: "border-emerald-500/20",
      indicator: "bg-emerald-500"
    };
  };

  const handleSort = (field: SortField) => {
    const newOrder: SortOrder =
      filters.sortBy === field && filters.sortOrder === "asc" ? "desc" : "asc";
    onSortChange(field, newOrder);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (filters.sortBy !== field) return <div className="w-3 h-3 opacity-0" />;
    return filters.sortOrder === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 text-blue-500" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-blue-500" />
    );
  };

  const ProductActions = ({ product }: { product: any }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-200 shadow-xl">
        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Ações do Produto</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-neutral-800" />
        <DropdownMenuItem asChild>
          <Link href={`/products/${product.id}`} className="cursor-pointer focus:bg-neutral-800 focus:text-white flex items-center w-full">
            <Eye className="mr-2 h-3.5 w-3.5" /> Detalhes
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/products/${product.id}/edit`} className="cursor-pointer focus:bg-neutral-800 focus:text-white flex items-center w-full">
            <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onOpenDeleteDialog(product)} className="cursor-pointer text-rose-500 focus:bg-rose-950/20 focus:text-rose-400">
          <Trash2 className="mr-2 h-3.5 w-3.5" /> Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const InsightCards = () => (
    <>
      {/* Total Items */}
      <div className="flex flex-col justify-center rounded-[4px] border border-neutral-800 bg-[#171717] px-5 py-4 transition-colors hover:border-neutral-700">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-[2px] bg-blue-600/10 border border-blue-600/20">
            <BarChart3 className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Total Geral</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tighter text-white">{pagination.totalElements}</span>
          <span className="text-[10px] font-medium uppercase text-neutral-600">itens</span>
        </div>
      </div>

      {/* Low Stock */}
      <div className="flex flex-col justify-center rounded-[4px] border border-neutral-800 bg-[#171717] px-5 py-4 transition-colors hover:border-neutral-700">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-[2px] bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Baixo Estoque</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tighter text-white">{lowStockCount}</span>
          <span className="text-[10px] font-medium uppercase text-neutral-600">alertas</span>
        </div>
      </div>

      {/* Out of Stock */}
      <div className="flex flex-col justify-center rounded-[4px] border border-neutral-800 bg-[#171717] px-5 py-4 transition-colors hover:border-neutral-700">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-[2px] bg-rose-500/10 border border-rose-500/20">
            <XCircle className="h-3.5 w-3.5 text-rose-500" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Sem Estoque</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tighter text-white">{outOfStockCount}</span>
          <span className="text-[10px] font-medium uppercase text-neutral-600">itens</span>
        </div>
      </div>

      {/* Top Category */}
      <div className="flex flex-col justify-center rounded-[4px] border border-neutral-800 bg-[#171717] px-5 py-4 transition-colors hover:border-neutral-700">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-[2px] bg-emerald-500/10 border border-emerald-500/20">
            <Tag className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Top Categoria</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-bold tracking-tighter text-white truncate max-w-[140px]" title={topCategory}>{topCategory || "—"}</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="min-h-screen bg-[#0A0A0A] pb-20 font-sans text-neutral-200">
        {/* Scanner Drawer */}
        <ScannerDrawer open={scannerOpen} onOpenChange={setScannerOpen} />

        <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
          {/* Main Content */}
          <div className="space-y-6">
              <div className="flex flex-col gap-5">
                {/* Actions Bar */}
                <div className="flex items-center justify-end gap-3">
                  <Button
                    onClick={() => setScannerOpen(true)}
                    variant="outline"
                    className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-xs font-medium uppercase tracking-wide text-neutral-300 hover:bg-neutral-800 hover:text-white"
                  >
                    <ScanLine className="mr-2 h-3.5 w-3.5" />
                    Scanner
                  </Button>
                  <Link href="/products/create">
                    <Button className="h-10 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)]">
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Produto
                    </Button>
                  </Link>
                </div>

                {/* Row 1: Insight Cards */}
                <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <InsightCards />
                </div>
                
                {/* Mobile Accordion Insights */}
                <div className="md:hidden">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="insights" className="border border-neutral-800 rounded-[4px] bg-[#171717] px-4">
                      <AccordionTrigger className="text-sm font-bold uppercase text-neutral-400 hover:text-white hover:no-underline py-4">
                        Resumo do Inventário
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 gap-4 pt-2 pb-2">
                          <InsightCards />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                {/* Row 2: Search & Filters */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:h-12 w-full">
                  <div className="relative h-12 flex-1 min-w-[200px] flex items-center">
                    <div className="text-neutral-500 absolute left-3">
                      <Search className="h-3.5 w-3.5" />
                    </div>
                    <Input
                      placeholder="Pesquisar no inventário (nome, SKU, código)..."
                      value={filters.searchQuery}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className="w-full rounded-[4px] border-neutral-800 bg-[#171717] pl-10 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-blue-600 focus:ring-0 transition-all hover:border-neutral-700"
                    />
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-2 h-auto md:h-12">
                    <Select
                      value={`${filters.sortBy}-${filters.sortOrder}`}
                      onValueChange={(value) => {
                        const [field, order] = value.split("-") as [SortField, SortOrder];
                        onSortChange(field, order);
                      }}
                    >
                      <SelectTrigger className="h-12 w-full md:w-[150px] rounded-[4px] border-neutral-800 bg-[#171717] text-[12px] font-bold uppercase tracking-widest text-neutral-400 focus:border-blue-600 focus:ring-0 hover:border-neutral-700 transition-colors">
                        <div className="flex items-center gap-2">
                          <Filter className="h-3.5 w-3.5 text-neutral-500" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
                        <SelectItem value="name-asc" className="text-[12px] font-bold uppercase focus:bg-neutral-800">Nome (A-Z)</SelectItem>
                        <SelectItem value="name-desc" className="text-[12px] font-bold uppercase focus:bg-neutral-800">Nome (Z-A)</SelectItem>
                        <SelectItem value="sku-asc" className="text-[12px] font-bold uppercase focus:bg-neutral-800">SKU (A-Z)</SelectItem>
                        <SelectItem value="sku-desc" className="text-[12px] font-bold uppercase focus:bg-neutral-800">SKU (Z-A)</SelectItem>
                        <SelectItem value="createdAt-desc" className="text-[12px] font-bold uppercase focus:bg-neutral-800">Recentes</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={filters.pageSize.toString()}
                      onValueChange={(value) => onPageSizeChange(Number(value))}
                    >
                      <SelectTrigger className="h-12 w-full md:w-[75px] rounded-[4px] border-neutral-800 bg-[#171717] text-[12px] font-bold uppercase tracking-widest text-neutral-400 focus:border-blue-600 focus:ring-0 hover:border-neutral-700 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
                        <SelectItem value="10" className="text-[12px] font-bold uppercase focus:bg-neutral-800">10</SelectItem>
                        <SelectItem value="20" className="text-[12px] font-bold uppercase focus:bg-neutral-800">20</SelectItem>
                        <SelectItem value="50" className="text-[12px] font-bold uppercase focus:bg-neutral-800">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Data Display */}
              <div className="min-h-[400px]">
                {/* Loading */}
                {isLoading && (
                  <div className="flex h-64 w-full flex-col items-center justify-center gap-4 rounded-[4px] border border-neutral-800 bg-[#171717]/50">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="text-xs uppercase tracking-wide text-neutral-500">Carregando dados...</span>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="flex h-64 w-full flex-col items-center justify-center gap-4 rounded-[4px] border border-rose-900/30 bg-rose-950/10">
                    <AlertTriangle className="h-8 w-8 text-rose-500" />
                    <div className="text-center">
                      <h3 className="text-sm font-bold uppercase text-rose-500">Falha na conexão</h3>
                      <p className="text-xs text-rose-500/70">Não foi possível carregar a lista de produtos</p>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && products.length === 0 && (
                  <div className="flex h-96 w-full flex-col items-center justify-center gap-6 rounded-[4px] border border-dashed border-neutral-800 bg-[#171717]/30">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900 ring-1 ring-neutral-800">
                      <Package className="h-8 w-8 text-neutral-600" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-300">
                        {filters.searchQuery ? "Nenhum resultado encontrado" : "Nenhum produto cadastrado"}
                      </h3>
                      <p className="mt-1 max-w-xs text-xs text-neutral-500">
                        {filters.searchQuery 
                          ? "Tente ajustar seus termos de busca ou filtros." 
                          : "O inventário deste armazém está vazio. Comece adicionando produtos."}
                      </p>
                    </div>
                    {filters.searchQuery ? (
                      <Button
                        variant="outline"
                        onClick={() => onSearchChange("")}
                        className="rounded-[4px] border-neutral-700 text-xs uppercase text-neutral-300 hover:bg-neutral-800"
                      >
                        Limpar Filtros
                      </Button>
                    ) : (
                      <Link href="/products/create">
                        <Button className="rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700">
                          <Plus className="mr-2 h-3.5 w-3.5" />
                          Primeiro Produto
                        </Button>
                      </Link>
                    )}
                  </div>
                )}

                {/* Table View (Desktop) */}
                {!isLoading && !error && products.length > 0 && (
                  <>
                    <div className="hidden overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717] md:block">
                      <Table>
                        <TableHeader className="bg-neutral-900">
                          <TableRow className="border-b border-neutral-800 hover:bg-neutral-900">
                            <TableHead
                              className="h-10 cursor-pointer text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white"
                              onClick={() => handleSort("name")}
                            >
                              <div className="flex items-center gap-1">Nome <SortIcon field="name" /></div>
                            </TableHead>
                            <TableHead
                              className="h-10 cursor-pointer text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white"
                              onClick={() => handleSort("sku")}
                            >
                              <div className="flex items-center gap-1">SKU <SortIcon field="sku" /></div>
                            </TableHead>
                            <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                              Categoria / Marca
                            </TableHead>
                            <TableHead className="h-10 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                              Estoque
                            </TableHead>
                            <TableHead className="h-10 text-center text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                              Status
                            </TableHead>
                            <TableHead className="h-10 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">
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
                                className="group border-b border-neutral-800/50 hover:bg-neutral-800/50 transition-colors"
                              >
                                <TableCell className="py-3">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-medium text-white">{product.name}</span>
                                    {product.barcode && (
                                      <span className="font-mono text-[10px] text-neutral-500">
                                        {product.barcode}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="py-3 font-mono text-xs text-neutral-400">
                                  {product.sku || "—"}
                                </TableCell>
                                <TableCell className="py-3">
                                  <div className="flex flex-col text-xs">
                                    <span className="text-neutral-300">{product.categoryName || "—"}</span>
                                    <span className="text-[10px] text-neutral-600">{product.brand?.name || "—"}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-3 text-right">
                                  <span className="font-mono text-sm font-bold tracking-tighter text-white">
                                    {product.totalQuantity}
                                  </span>
                                </TableCell>
                                <TableCell className="py-3 text-center">
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "rounded-[2px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                      stockStatus.bg,
                                      stockStatus.color,
                                      stockStatus.border
                                    )}
                                  >
                                    {stockStatus.label}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-3 text-right">
                                  <div className="flex justify-end gap-1 transition-opacity">
                                    <Button
                                      asChild
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white"
                                    >
                                      <Link href={`/products/${product.id}`}>
                                        <Eye className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                    <Button
                                      asChild
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white"
                                    >
                                      <Link href={`/products/${product.id}/edit`}>
                                        <Pencil className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => onOpenDeleteDialog(product)}
                                      className="h-8 w-8 rounded-[4px] text-neutral-500 hover:bg-rose-950/20 hover:text-rose-500"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Grid */}
                    <div className="grid gap-3 md:hidden">
                      {products.map((product) => {
                        const stockStatus = getStockStatus(product.totalQuantity);
                        return (
                          <div
                            key={product.id}
                            className="relative flex flex-col gap-3 rounded-[4px] border border-neutral-800 bg-[#171717] p-4 transition-colors hover:border-neutral-700"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 pr-2">
                                <h3 className="font-semibold text-white">{product.name}</h3>
                                <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                                  <span className="font-mono">{product.sku || "SEM SKU"}</span>
                                  <span>•</span>
                                  <span>{product.categoryName}</span>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "rounded-[2px] border px-1.5 py-0.5 text-[10px] font-bold uppercase",
                                    stockStatus.bg,
                                    stockStatus.color,
                                    stockStatus.border
                                  )}
                                >
                                  {product.totalQuantity} un
                                </Badge>
                                <ProductActions product={product} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-neutral-800 pt-6">
                        <div className="text-xs text-neutral-500">
                          Mostrando {pagination.page * pagination.pageSize + 1} a{" "}
                          {Math.min(
                            (pagination.page + 1) * pagination.pageSize,
                            pagination.totalElements
                          )}{" "}
                          de {pagination.totalElements} produtos
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(pagination.page - 1)}
                            disabled={pagination.page === 0}
                            className="h-8 w-8 rounded-[4px] border-neutral-800 bg-[#171717] p-0 hover:bg-neutral-800 disabled:opacity-30"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages - 1}
                            className="h-8 w-8 rounded-[4px] border-neutral-800 bg-[#171717] p-0 hover:bg-neutral-800 disabled:opacity-30"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
        </main>

        {/* Floating Action Buttons - Mobile */}
        <Button
          onClick={() => setScannerOpen(true)}
          className="fixed bottom-20 right-4 h-12 w-12 rounded-[4px] border border-neutral-700 bg-[#171717] text-white shadow-lg hover:bg-neutral-800 md:hidden"
          size="icon"
        >
          <ScanLine className="h-5 w-5" />
        </Button>
        
        <Link href="/products/create">
          <Button
            className="fixed bottom-6 right-4 h-12 w-12 rounded-[4px] bg-blue-600 text-white shadow-lg hover:bg-blue-700 md:hidden"
            size="icon"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </Link>
      </div>

      <ResponsiveModal
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) onCloseDeleteDialog();
        }}
        title="Confirmar exclusão"
        description={`Tem certeza que deseja deletar o produto ${deleteProduct?.name}? Esta ação é irreversível.`}
        maxWidth="sm:max-w-[450px]"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={onCloseDeleteDialog}
              className="rounded-[4px] border-neutral-700 bg-transparent text-xs uppercase hover:bg-neutral-800 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={onConfirmDelete}
              disabled={isCheckingDeleteBatches || isDeletingProduct}
              className="rounded-[4px] bg-rose-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-rose-700"
            >
              {isDeletingProduct ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {isCheckingDeleteBatches && (
            <div className="flex items-center gap-2 rounded-[4px] border border-blue-900/30 bg-blue-950/10 px-3 py-2 text-xs text-blue-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Verificando estoque...
            </div>
          )}

          {!isCheckingDeleteBatches && deleteBatches.length > 0 && (
            <div className="rounded-[4px] border border-amber-900/30 bg-amber-950/10 px-3 py-3 text-xs text-amber-500">
              <div className="flex items-center gap-2 font-bold uppercase tracking-wide">
                <AlertTriangle className="h-3.5 w-3.5" />
                Estoque Existente
              </div>
              <p className="mt-1 opacity-90">
                Ainda existe estoque deste produto. Zere o estoque antes de excluir.
              </p>
              <div className="mt-2 space-y-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                {deleteBatches.map((batch) => (
                  <div key={batch.id} className="flex items-center justify-between">
                    <span>Lote {batch.batchNumber}</span>
                    <span>{batch.quantity} un</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ResponsiveModal>

      <ResponsiveModal
        open={secondConfirmOpen}
        onOpenChange={(open) => {
          if (!open) onCloseSecondConfirm();
        }}
        title="Confirmação Final"
        description={`Tem certeza que deseja deletar? O produto ${deleteProduct?.name} será desativado.`}
        maxWidth="sm:max-w-[400px]"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={onCloseSecondConfirm}
              className="rounded-[4px] border-neutral-700 bg-transparent text-xs uppercase hover:bg-neutral-800 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={onSecondConfirmDelete}
              disabled={isDeletingProduct}
              className="rounded-[4px] bg-rose-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-rose-700"
            >
              {isDeletingProduct ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Deletando...
                </>
              ) : (
                "Confirmar Exclusão"
              )}
            </Button>
          </>
        }
      >
        <div className="py-2">
          <p className="text-xs text-neutral-500">
            Esta é a última confirmação antes da remoção definitiva dos registros associados a este produto.
          </p>
        </div>
      </ResponsiveModal>
    </>
  );
};
