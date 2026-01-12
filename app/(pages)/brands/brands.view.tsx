"use client";

import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Tag,
  AlertTriangle,
  XCircle,
  Filter,
  MoreHorizontal,
  Calendar,
  Globe
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
      
      {/* Sticky Header with Controls */}
      <header className="sticky top-0 z-30 border-b border-neutral-800 bg-[#0A0A0A]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0A0A0A]/60">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6 lg:px-8">
          <div className="flex flex-col gap-4">
            
            {/* Top Row: Brand & Action */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-blue-600/10 border border-blue-900/50">
                  <Globe className="h-4 w-4 text-blue-500" />
                </div>
                <h1 className="text-lg font-bold tracking-tight text-white uppercase">Marcas</h1>
              </div>
              
              <Button
                onClick={openCreateModal}
                className="h-9 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 shadow-[0_0_15px_-3px_rgba(37,99,235,0.4)]"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Nova Marca</span>
                <span className="sm:hidden">Nova</span>
              </Button>
            </div>

            {/* Bottom Row: Search & Filters */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                <Input
                  placeholder="Pesquisar marcas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-full rounded-[4px] border-neutral-800 bg-[#171717] text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-blue-600 focus:ring-0 transition-all hover:border-neutral-700"
                />
              </div>

              <Select
                value={`${sortConfig.key}-${sortConfig.direction}`}
                onValueChange={(value) => {
                  const [key, direction] = value.split("-") as [SortConfig["key"], SortConfig["direction"]];
                  if (sortConfig.key !== key || sortConfig.direction !== direction) {
                     handleSort(key);
                  }
                }}
              >
                <SelectTrigger className="h-9 w-[120px] sm:w-[160px] rounded-[4px] border-neutral-800 bg-[#171717] text-[10px] font-bold uppercase tracking-widest text-neutral-400 focus:ring-0">
                  <SelectValue placeholder="ORDENAR" />
                </SelectTrigger>
                <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
                  <SelectItem value="name-asc" className="text-[10px] font-bold uppercase">Nome (A-Z)</SelectItem>
                  <SelectItem value="name-desc" className="text-[10px] font-bold uppercase">Nome (Z-A)</SelectItem>
                  <SelectItem value="createdAt-desc" className="text-[10px] font-bold uppercase">Recentes</SelectItem>
                  <SelectItem value="createdAt-asc" className="text-[10px] font-bold uppercase">Antigos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl p-4 md:px-6 lg:px-8 mt-4">
        
        {/* State Layers */}
        {isLoading && (
          <div className="flex h-64 w-full flex-col items-center justify-center gap-4 rounded-[4px] border border-neutral-800 bg-[#171717]/30 animate-pulse">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-xs uppercase tracking-wide text-neutral-500">Acessando Diretório...</span>
          </div>
        )}

        {error && (
          <div className="flex h-64 w-full flex-col items-center justify-center gap-4 rounded-[4px] border border-rose-900/30 bg-rose-950/10 p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-rose-500" />
            <div>
              <h3 className="text-sm font-bold uppercase text-rose-500">Erro de Sincronização</h3>
              <p className="text-xs text-rose-500/70 mt-1">Falha ao carregar as marcas registradas.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-2 border-rose-900/30 text-rose-500">
              Recarregar Dados
            </Button>
          </div>
        )}

        {!isLoading && !error && brands.length === 0 && (
          <div className="flex h-96 w-full flex-col items-center justify-center gap-6 rounded-[4px] border border-dashed border-neutral-800 bg-[#171717]/20">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900 ring-1 ring-neutral-800 shadow-inner">
              <Tag className="h-8 w-8 text-neutral-600" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-300">
                {searchQuery ? "Nenhum Registro Encontrado" : "Nenhuma Marca Registrada"}
              </h3>
              <p className="mt-1 max-w-xs text-xs text-neutral-500">
                {searchQuery 
                  ? "Tente utilizar outros termos para localizar a marca corporativa." 
                  : "Seu portfólio de marcas está vazio. Inicie o registro da primeira marca."}
              </p>
            </div>
            {searchQuery ? (
              <Button variant="link" onClick={() => setSearchQuery("")} className="text-blue-500 text-xs font-bold uppercase tracking-widest">
                Limpar Busca
              </Button>
            ) : (
              <Button onClick={openCreateModal} className="rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white">
                <Plus className="mr-2 h-3.5 w-3.5" /> Registrar Marca
              </Button>
            )}
          </div>
        )}

        {/* Data Content */}
        {!isLoading && !error && brands.length > 0 && (
          <div className="animate-in fade-in duration-500 slide-in-from-bottom-2">
            
            {/* Desktop View - Table */}
            <div className="hidden md:block overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717]">
              <Table>
                <TableHeader className="bg-neutral-900/50">
                  <TableRow className="border-b border-neutral-800 hover:bg-transparent">
                    <TableHead className="w-20 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Identidade</TableHead>
                    <TableHead className="cursor-pointer text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white transition-colors" onClick={() => handleSort("name")}>
                      <div className="flex items-center gap-1">Nome <SortIcon field="name" /></div>
                    </TableHead>
                    <TableHead className="cursor-pointer text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white transition-colors" onClick={() => handleSort("createdAt")}>
                      <div className="flex items-center gap-1">Data de Registro <SortIcon field="createdAt" /></div>
                    </TableHead>
                    <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">Operações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brands.map((brand) => (
                    <TableRow key={brand.id} className="group border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-all">
                      <TableCell>
                        <div className="flex h-12 w-12 items-center justify-center rounded-[4px] border border-neutral-800 bg-neutral-900 overflow-hidden shadow-inner group-hover:border-neutral-700 transition-colors">
                          {brand.logoUrl ? (
                            <img src={brand.logoUrl} alt={brand.name} className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-neutral-700" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-white tracking-tight">{brand.name}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-neutral-500 uppercase">
                          {format(new Date(brand.createdAt), "dd MMM, yyyy", { locale: ptBR })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openEditModal(brand)} 
                            className="h-8 w-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openDeleteDialog(brand)} 
                            className="h-8 w-8 rounded-[4px] text-neutral-500 hover:bg-rose-950/20 hover:text-rose-500"
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

            {/* Mobile View - Cards */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {brands.map((brand) => (
                <div key={brand.id} className="relative flex items-center gap-4 rounded-[4px] border border-neutral-800 bg-[#171717] p-4 hover:border-neutral-700 transition-all active:bg-[#1f1f1f]">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-neutral-800 rounded-l-[4px]" />
                  
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[4px] border border-neutral-800 bg-neutral-900 overflow-hidden shadow-inner">
                    {brand.logoUrl ? (
                      <img src={brand.logoUrl} alt={brand.name} className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-7 w-7 text-neutral-700" />
                    )}
                  </div>
                  
                  <div className="flex flex-1 flex-col min-w-0">
                    <h3 className="font-bold text-white tracking-tight truncate">{brand.name}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                       <Calendar className="h-3 w-3 text-neutral-500" />
                       <span className="font-mono text-[9px] text-neutral-500 uppercase">
                         {format(new Date(brand.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                       </span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-200">
                      <DropdownMenuItem onClick={() => openEditModal(brand)} className="focus:bg-neutral-800">
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openDeleteDialog(brand)} className="text-rose-500 focus:bg-rose-950/20">
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>

          </div>
        )}

      </main>

      {/* Mobile Floating Action Button */}
      <Button
        onClick={openCreateModal}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-[4px] bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:bg-blue-700 active:scale-95 transition-all md:hidden z-40"
        size="icon"
      >
        <Plus className="h-7 w-7" />
      </Button>

      {/* Modals */}
      <ResponsiveModal
        open={isModalOpen}
        onOpenChange={closeModal}
        title={selectedBrand ? "Editar Marca" : "Nova Marca Corporativa"}
        description="Registro e manutenção de identidade de marca."
        maxWidth="sm:max-w-[450px]"
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={closeModal}
              className="rounded-[4px] text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="brand-form"
              disabled={form.formState.isSubmitting}
              className="rounded-[4px] bg-blue-600 px-8 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-blue-700 shadow-lg"
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="h-3 w-3 animate-spin mr-2" />
              ) : (
                <Plus className="h-3 w-3 mr-2" />
              )}
              {selectedBrand ? "Salvar Alterações" : "Confirmar Registro"}
            </Button>
          </>
        }
      >
        <Form {...form}>
          <form id="brand-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                    Nome Oficial <span className="text-rose-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="EX: TECHNO SOLUTIONS" 
                      {...field} 
                      className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0 transition-all placeholder:text-neutral-800"
                    />
                  </FormControl>
                  <FormMessage className="text-[10px] font-bold text-rose-500 uppercase" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Logotipo (URL)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://assets.cdn.com/logo.png"
                      {...field}
                      className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0 transition-all placeholder:text-neutral-800"
                    />
                  </FormControl>
                  <FormMessage className="text-[10px] font-bold text-rose-500 uppercase" />
                </FormItem>
              )}
            />

            {/* Identity Preview */}
            {logoPreview && (
              <div className="rounded-[4px] border border-neutral-800 bg-neutral-900/50 p-4 flex flex-col items-center justify-center min-h-[120px]">
                <span className="text-[8px] font-bold uppercase text-neutral-600 mb-3 tracking-widest">Preview de Identidade</span>
                {!logoError ? (
                  <img
                    src={logoPreview}
                    alt="Brand Identity"
                    className="max-h-20 max-w-full rounded-[2px] object-contain shadow-sm"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 opacity-30 text-neutral-500">
                    <XCircle className="h-8 w-8" />
                    <span className="text-[9px] uppercase font-bold">Imagem Inválida</span>
                  </div>
                )}
              </div>
            )}
          </form>
        </Form>
      </ResponsiveModal>

      {/* Alert Dialogs */}
      <ResponsiveModal
        open={!!brandToDelete}
        onOpenChange={closeDeleteDialog}
        title="Excluir Marca"
        description={`Tem certeza que deseja remover o registro de ${brandToDelete?.name}?`}
        maxWidth="sm:max-w-[400px]"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={closeDeleteDialog}
              className="rounded-[4px] border-neutral-800 bg-transparent text-[10px] font-bold uppercase text-neutral-500 hover:text-white hover:bg-neutral-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="rounded-[4px] bg-rose-600 text-[10px] font-bold uppercase text-white hover:bg-rose-700 border-none"
            >
              {isDeleting ? "Processando..." : "Confirmar Exclusão"}
            </Button>
          </>
        }
      >
        <div className="py-2">
          <p className="text-xs text-neutral-500">
            Esta ação removerá permanentemente a marca do sistema e de todos os produtos associados.
          </p>
        </div>
      </ResponsiveModal>

    </div>
  );
};