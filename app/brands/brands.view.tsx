"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  Loader2,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Tag,
  AlertTriangle,
  XCircle,
  Filter
} from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { BrandFormData } from "./brands.schema";
import { Brand, SortConfig } from "./brands.types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BrandsViewProps {
  brands: Brand[];
  isLoading: boolean;
  error: any;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortConfig: SortConfig;
  handleSort: (key: SortConfig["key"]) => void;
  isModalOpen: boolean;
  selectedBrand: Brand | null;
  openCreateModal: () => void;
  openEditModal: (brand: Brand) => void;
  closeModal: () => void;
  form: UseFormReturn<BrandFormData>;
  onSubmit: (data: BrandFormData) => void;
  brandToDelete: Brand | null;
  openDeleteDialog: (brand: Brand) => void;
  closeDeleteDialog: () => void;
  confirmDelete: () => void;
  isDeleting: boolean;
}

export const BrandsView = ({
  brands,
  isLoading,
  error,
  searchQuery,
  setSearchQuery,
  sortConfig,
  handleSort,
  isModalOpen,
  selectedBrand,
  openCreateModal,
  openEditModal,
  closeModal,
  form,
  onSubmit,
  brandToDelete,
  openDeleteDialog,
  closeDeleteDialog,
  confirmDelete,
  isDeleting,
}: BrandsViewProps) => {
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoError, setLogoError] = useState(false);

  const logoUrl = form.watch("logoUrl");

  useEffect(() => {
    if (logoUrl && logoUrl.trim()) {
      setLogoPreview(logoUrl);
      setLogoError(false);
    } else {
      setLogoPreview("");
      setLogoError(false);
    }
  }, [logoUrl]);

  const SortIcon = ({ field }: { field: SortConfig["key"] }) => {
    if (sortConfig.key !== field) return <div className="w-3 h-3 opacity-0" />;
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 text-blue-500" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-blue-500" />
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 font-sans text-neutral-200">
      {/* Header - Corporate Solid Dark */}
      <header className="sticky top-0 z-30 border-b border-neutral-800 bg-[#0A0A0A]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-blue-600 font-bold text-white shadow-[0_0_15px_-3px_rgba(37,99,235,0.4)]">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight uppercase text-white">
                Marcas
              </h1>
              <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Portfólio Industrial
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={openCreateModal}
              className="h-9 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Marca
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Search & Filters */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:h-12 w-full">
            <div className="relative h-12 flex-1 min-w-[200px]">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                <Search className="h-3.5 w-3.5" />
              </div>
              <Input
                placeholder="Pesquisar por nome da marca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 w-full rounded-[4px] border-neutral-800 bg-[#171717] pl-10 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-blue-600 focus:ring-0 transition-all hover:border-neutral-700"
              />
            </div>

            <div className="flex items-center gap-2 h-12">
              <Select
                value={`${sortConfig.key}-${sortConfig.direction}`}
                onValueChange={(value) => {
                  const [key, direction] = value.split("-") as [SortConfig["key"], SortConfig["direction"]];
                  handleSort(key); // Simplified as the handler toggles or sets
                }}
              >
                <SelectTrigger className="h-12 w-[180px] rounded-[4px] border-neutral-800 bg-[#171717] text-[10px] font-bold uppercase tracking-widest text-neutral-400 focus:border-blue-600 focus:ring-0 hover:border-neutral-700 transition-colors">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5 text-neutral-500" />
                    <SelectValue placeholder="Ordenar" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
                  <SelectItem value="name-asc" className="text-[9px] font-bold uppercase focus:bg-neutral-800">Nome (A-Z)</SelectItem>
                  <SelectItem value="name-desc" className="text-[9px] font-bold uppercase focus:bg-neutral-800">Nome (Z-A)</SelectItem>
                  <SelectItem value="createdAt-desc" className="text-[9px] font-bold uppercase focus:bg-neutral-800">Mais Recentes</SelectItem>
                  <SelectItem value="createdAt-asc" className="text-[9px] font-bold uppercase focus:bg-neutral-800">Mais Antigos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Data Display */}
          <div className="min-h-[400px]">
            {/* Loading */}
            {isLoading && (
              <div className="flex h-64 w-full flex-col items-center justify-center gap-4 rounded-[4px] border border-neutral-800 bg-[#171717]/50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="text-xs uppercase tracking-wide text-neutral-500">Carregando marcas...</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex h-64 w-full flex-col items-center justify-center gap-4 rounded-[4px] border border-rose-900/30 bg-rose-950/10">
                <AlertTriangle className="h-8 w-8 text-rose-500" />
                <div className="text-center">
                  <h3 className="text-sm font-bold uppercase text-rose-500">Erro de Sistema</h3>
                  <p className="text-xs text-rose-500/70">Não foi possível carregar o diretório de marcas</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && brands.length === 0 && (
              <div className="flex h-96 w-full flex-col items-center justify-center gap-6 rounded-[4px] border border-dashed border-neutral-800 bg-[#171717]/30">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900 ring-1 ring-neutral-800">
                  <Tag className="h-8 w-8 text-neutral-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-300">
                    {searchQuery ? "Nenhum resultado encontrado" : "Nenhuma marca no sistema"}
                  </h3>
                  <p className="mt-1 max-w-xs text-xs text-neutral-500">
                    {searchQuery 
                      ? "Refine seu termo de busca para localizar a marca desejada." 
                      : "Sua base de marcas está vazia. Comece cadastrando sua primeira marca corporativa."}
                  </p>
                </div>
                {searchQuery ? (
                  <Button
                    variant="outline"
                    onClick={() => setSearchQuery("")}
                    className="rounded-[4px] border-neutral-700 text-xs uppercase text-neutral-300 hover:bg-neutral-800"
                  >
                    Limpar Busca
                  </Button>
                ) : (
                  <Button 
                    onClick={openCreateModal}
                    className="rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Adicionar Primeira Marca
                  </Button>
                )}
              </div>
            )}

            {/* Table View (Desktop) */}
            {!isLoading && !error && brands.length > 0 && (
              <>
                <div className="hidden overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717] md:block">
                  <Table>
                    <TableHeader className="bg-neutral-900">
                      <TableRow className="border-b border-neutral-800 hover:bg-neutral-900">
                        <TableHead className="h-10 w-20 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                          Logo
                        </TableHead>
                        <TableHead
                          className="h-10 cursor-pointer text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white"
                          onClick={() => handleSort("name")}
                        >
                          <div className="flex items-center gap-1">Nome <SortIcon field="name" /></div>
                        </TableHead>
                        <TableHead
                          className="h-10 cursor-pointer text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white"
                          onClick={() => handleSort("createdAt")}
                        >
                          <div className="flex items-center gap-1">Data de Registro <SortIcon field="createdAt" /></div>
                        </TableHead>
                        <TableHead className="h-10 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                          Ações
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {brands.map((brand) => (
                        <TableRow
                          key={brand.id}
                          className="group border-b border-neutral-800/50 hover:bg-neutral-800/50 transition-colors"
                        >
                          <TableCell className="py-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-[4px] border border-neutral-800 bg-neutral-900 overflow-hidden shadow-inner">
                              {brand.logoUrl ? (
                                <img
                                  src={brand.logoUrl}
                                  alt={brand.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    e.currentTarget.nextElementSibling?.classList.remove("hidden");
                                  }}
                                />
                              ) : null}
                              <div className={cn(
                                "flex items-center justify-center h-full w-full",
                                brand.logoUrl ? "hidden" : ""
                              )}>
                                <ImageIcon className="h-5 w-5 text-neutral-700" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="font-bold text-white tracking-tight">{brand.name}</span>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="font-mono text-xs text-neutral-500 uppercase">
                              {format(new Date(brand.createdAt), "dd MMM yyyy", { locale: ptBR })}
                            </span>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-[4px] hover:bg-neutral-800 text-neutral-400 hover:text-blue-500"
                                onClick={() => openEditModal(brand)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-[4px] hover:bg-neutral-800 text-neutral-400 hover:text-rose-500"
                                onClick={() => openDeleteDialog(brand)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Grid */}
                <div className="grid gap-3 md:hidden">
                  {brands.map((brand) => (
                    <div
                      key={brand.id}
                      className="flex items-center gap-4 rounded-[4px] border border-neutral-800 bg-[#171717] p-4"
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[4px] border border-neutral-800 bg-neutral-900 overflow-hidden shadow-inner">
                        {brand.logoUrl ? (
                          <img src={brand.logoUrl} alt={brand.name} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-neutral-700" />
                        )}
                      </div>
                      
                      <div className="flex flex-1 flex-col">
                        <h3 className="font-bold text-white tracking-tight">{brand.name}</h3>
                        <span className="font-mono text-[10px] text-neutral-500 mt-1 uppercase">
                          Reg: {format(new Date(brand.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-[4px] border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-blue-500"
                          onClick={() => openEditModal(brand)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-[4px] border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-rose-500"
                          onClick={() => openDeleteDialog(brand)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Button - Mobile */}
      <Button
        onClick={openCreateModal}
        className="fixed bottom-6 right-4 h-12 w-12 rounded-[4px] bg-blue-600 text-white shadow-lg hover:bg-blue-700 md:hidden"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[500px] rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-200">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-wide text-white">
              {selectedBrand ? "Atualizar Marca" : "Nova Marca Corporativa"}
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              {selectedBrand
                ? "Modifique os parâmetros da marca selecionada."
                : "Insira os dados para o registro de uma nova marca no portfólio."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Nome da Marca <span className="text-rose-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: GLOBAL LOGISTICS" 
                        {...field} 
                        className="h-11 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0 transition-all placeholder:text-neutral-700"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold uppercase text-rose-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">URL do Logotipo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://cloud.storage.com/logo.png"
                        {...field}
                        className="h-11 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0 transition-all placeholder:text-neutral-700"
                      />
                    </FormControl>
                    <FormDescription className="text-[10px] text-neutral-600 uppercase tracking-tight">
                      Forneça um link público para a imagem da marca.
                    </FormDescription>
                    <FormMessage className="text-[10px] font-bold uppercase text-rose-500" />
                  </FormItem>
                )}
              />

              {/* Logo Preview */}
              {logoPreview && (
                <div className="space-y-2">
                  <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Visualização de Identidade</FormLabel>
                  <div className="flex items-center justify-center rounded-[4px] border border-neutral-800 p-6 bg-neutral-900/50 shadow-inner">
                    {!logoError ? (
                      <img
                        src={logoPreview}
                        alt="Preview"
                        className="max-h-32 max-w-full rounded-[4px] object-contain"
                        onError={() => setLogoError(true)}
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-neutral-600">
                        <XCircle className="h-10 w-10 opacity-20" />
                        <p className="text-[10px] font-bold uppercase tracking-wider">
                          Erro de Carregamento
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="h-11 rounded-[4px] border-neutral-800 bg-transparent text-xs font-bold uppercase text-neutral-400 hover:bg-neutral-800 hover:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="h-11 rounded-[4px] bg-blue-600 px-6 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Confirmar Registro"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!brandToDelete}
        onOpenChange={closeDeleteDialog}
      >
        <AlertDialogContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold uppercase tracking-wide text-white">Remover Marca</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-neutral-500">
              Tem certeza que deseja excluir a marca{" "}
              <strong className="text-white">{brandToDelete?.name}</strong>? Este processo removerá a associação desta marca de todos os produtos vinculados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-[4px] border-neutral-700 bg-transparent text-xs font-bold uppercase text-neutral-400 hover:bg-neutral-800 hover:text-white">
              Manter Registro
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="rounded-[4px] bg-rose-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-rose-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Confirmar Remoção"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
