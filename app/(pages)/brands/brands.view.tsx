"use client";

import Image from "next/image";
import { useState, type Dispatch, type SetStateAction } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Calendar,
  Image as ImageIcon,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  XCircle,
} from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { PermissionGate } from "@/components/permission-gate";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BrandFormData } from "./brands.schema";
import type { Brand, SortConfig } from "./brands.types";

interface BrandsViewProps {
  brands: Brand[];
  isLoading: boolean;
  error: Error | null;
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

interface BrandsViewState extends BrandsViewProps {
  logoPreview: string;
  logoError: boolean;
  setFailedLogoPreview: Dispatch<SetStateAction<string | null>>;
}

const SortIcon = ({
  field,
  sortConfig,
}: {
  field: SortConfig["key"];
  sortConfig: SortConfig;
}) => {
  if (sortConfig.key !== field) return <div className="size-3 opacity-0" />;

  return sortConfig.direction === "asc" ? (
    <ArrowUp className="ml-1 size-3 text-blue-500" />
  ) : (
    <ArrowDown className="ml-1 size-3 text-blue-500" />
  );
};

export const BrandsView = (props: BrandsViewProps) => {
  const [failedLogoPreview, setFailedLogoPreview] = useState<string | null>(
    null,
  );
  const logoUrl = props.form.watch("logoUrl");
  const logoPreview = logoUrl?.trim() ?? "";
  const logoError = failedLogoPreview === logoPreview;
  const viewState: BrandsViewState = {
    ...props,
    logoPreview,
    logoError,
    setFailedLogoPreview,
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 font-sans text-neutral-200">
      <BrandsHeader viewState={viewState} />
      <BrandsContent viewState={viewState} />
      <BrandFormModal viewState={viewState} />
      <BrandDeleteDialog viewState={viewState} />
    </div>
  );
};

function BrandsHeader({ viewState }: { viewState: BrandsViewState }) {
  const {
    handleSort,
    openCreateModal,
    searchQuery,
    setSearchQuery,
    sortConfig,
  } = viewState;

  return (
    <header className="relative z-30 border-b border-neutral-800 bg-[#0A0A0A]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0A0A0A]/60">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6 lg:px-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tighter text-white">
                Marcas
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                Gerencie as marcas dos produtos
              </p>
            </div>
            <PermissionGate permission="brands:create">
              <Button
                onClick={openCreateModal}
                className="h-10 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white shadow-[0_0_15px_-3px_rgba(37,99,235,0.4)] hover:bg-blue-700 md:w-auto"
              >
                <Plus className="mr-2 size-4" />
                Nova Marca
              </Button>
            </PermissionGate>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-neutral-500" />
              <Input
                placeholder="Pesquisar marcas…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-[4px] border-neutral-800 bg-[#171717] pl-9 text-sm text-neutral-200 transition-all placeholder:text-neutral-600 hover:border-neutral-700 focus:border-blue-600 focus:ring-0 md:h-9"
              />
            </div>
            <BrandSortSelect
              sortConfig={sortConfig}
              handleSort={handleSort}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

function BrandSortSelect({
  handleSort,
  sortConfig,
}: {
  handleSort: (key: SortConfig["key"]) => void;
  sortConfig: SortConfig;
}) {
  return (
    <Select
      value={`${sortConfig.key}-${sortConfig.direction}`}
      onValueChange={(value) => {
        const [key, direction] = value.split("-") as [
          SortConfig["key"],
          SortConfig["direction"],
        ];
        if (sortConfig.key !== key || sortConfig.direction !== direction) {
          handleSort(key);
        }
      }}
    >
      <SelectTrigger className="w-[120px] rounded-[4px] border-neutral-800 bg-[#171717] text-[10px] font-bold uppercase tracking-widest text-neutral-400 focus:ring-0 sm:w-[160px]">
        <SelectValue placeholder="ORDENAR" />
      </SelectTrigger>
      <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
        <SelectItem value="name-asc" className="text-[10px] font-bold uppercase">
          Nome (A-Z)
        </SelectItem>
        <SelectItem
          value="name-desc"
          className="text-[10px] font-bold uppercase"
        >
          Nome (Z-A)
        </SelectItem>
        <SelectItem
          value="createdAt-desc"
          className="text-[10px] font-bold uppercase"
        >
          Recentes
        </SelectItem>
        <SelectItem
          value="createdAt-asc"
          className="text-[10px] font-bold uppercase"
        >
          Antigos
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

function BrandsContent({ viewState }: { viewState: BrandsViewState }) {
  const { brands, error, isLoading } = viewState;

  return (
    <main className="mx-auto mt-4 w-full max-w-7xl p-4 md:px-6 lg:px-8">
      {isLoading && <BrandsLoadingState />}
      {error && <BrandsErrorState />}
      {!isLoading && !error && brands.length === 0 && (
        <BrandsEmptyState viewState={viewState} />
      )}
      {!isLoading && !error && brands.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <BrandsTable viewState={viewState} />
          <BrandMobileCards viewState={viewState} />
        </div>
      )}
    </main>
  );
}

function BrandsLoadingState() {
  return (
    <div className="flex h-64 w-full animate-pulse flex-col items-center justify-center gap-4 rounded-[4px] border border-neutral-800 bg-[#171717]/30">
      <Loader2 className="size-8 animate-spin text-blue-600" />
      <span className="text-xs uppercase tracking-wide text-neutral-500">
        Acessando Diretório…
      </span>
    </div>
  );
}

function BrandsErrorState() {
  return (
    <div className="flex h-64 w-full flex-col items-center justify-center gap-4 rounded-[4px] border border-rose-900/30 bg-rose-950/10 p-6 text-center">
      <AlertTriangle className="size-8 text-rose-500" />
      <div>
        <h3 className="text-sm font-semibold uppercase text-rose-500">
          Erro de Sincronização
        </h3>
        <p className="mt-1 text-xs text-rose-500/70">
          Falha ao carregar as marcas registradas.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.location.reload()}
        className="mt-2 border-rose-900/30 text-rose-500"
      >
        Recarregar Dados
      </Button>
    </div>
  );
}

function BrandsEmptyState({ viewState }: { viewState: BrandsViewState }) {
  const { openCreateModal, searchQuery, setSearchQuery } = viewState;

  return (
    <div className="flex h-96 w-full flex-col items-center justify-center gap-6 rounded-[4px] border border-dashed border-neutral-800 bg-[#171717]/20">
      <div className="flex size-20 items-center justify-center rounded-[4px] bg-neutral-900 ring-1 ring-neutral-800 shadow-inner">
        <Tag className="size-8 text-neutral-600" />
      </div>
      <div className="text-center">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-300">
          {searchQuery ? "Nenhum Registro Encontrado" : "Nenhuma Marca Registrada"}
        </h3>
        <p className="mt-1 max-w-xs text-xs text-neutral-500">
          {searchQuery
            ? "Tente utilizar outros termos para localizar a marca corporativa."
            : "Seu portfólio de marcas está vazio. Inicie o registro da primeira marca."}
        </p>
      </div>
      {searchQuery ? (
        <Button
          variant="link"
          onClick={() => setSearchQuery("")}
          className="text-xs font-bold uppercase tracking-widest text-blue-500"
        >
          Limpar Busca
        </Button>
      ) : (
        <PermissionGate permission="brands:create">
          <Button
            onClick={openCreateModal}
            className="rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white"
          >
            <Plus className="mr-2 size-3.5" /> Registrar Marca
          </Button>
        </PermissionGate>
      )}
    </div>
  );
}

function BrandsTable({ viewState }: { viewState: BrandsViewState }) {
  const { brands, handleSort, sortConfig } = viewState;

  return (
    <div className="hidden overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717] md:block">
      <Table>
        <TableHeader className="bg-neutral-900/50">
          <TableRow className="border-b border-neutral-800 hover:bg-transparent">
            <TableHead className="w-20 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
              Identidade
            </TableHead>
            <SortableBrandHead
              label="Nome"
              field="name"
              sortConfig={sortConfig}
              handleSort={handleSort}
            />
            <SortableBrandHead
              label="Data de Registro"
              field="createdAt"
              sortConfig={sortConfig}
              handleSort={handleSort}
            />
            <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">
              Operações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {brands.map((brand) => (
            <BrandTableRow key={brand.id} brand={brand} viewState={viewState} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SortableBrandHead({
  field,
  handleSort,
  label,
  sortConfig,
}: {
  field: SortConfig["key"];
  handleSort: (key: SortConfig["key"]) => void;
  label: string;
  sortConfig: SortConfig;
}) {
  return (
    <TableHead
      className="cursor-pointer text-[10px] font-bold uppercase tracking-widest text-neutral-500 transition-colors hover:text-white"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <SortIcon field={field} sortConfig={sortConfig} />
      </div>
    </TableHead>
  );
}

function BrandTableRow({
  brand,
  viewState,
}: {
  brand: Brand;
  viewState: BrandsViewState;
}) {
  return (
    <TableRow className="group border-b border-neutral-800/50 transition-all hover:bg-neutral-800/30">
      <TableCell>
        <BrandLogo brand={brand} containerClassName="size-12" sizes="48px" />
      </TableCell>
      <TableCell>
        <span className="font-bold tracking-tight text-white">{brand.name}</span>
      </TableCell>
      <TableCell>
        <span className="font-mono text-xs uppercase text-neutral-500">
          {format(parseISO(brand.createdAt), "dd MMM, yyyy", { locale: ptBR })}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <BrandDesktopActions brand={brand} viewState={viewState} />
      </TableCell>
    </TableRow>
  );
}

function BrandLogo({
  brand,
  containerClassName,
  sizes,
}: {
  brand: Brand;
  containerClassName: string;
  sizes: string;
}) {
  return (
    <div
      className={`relative flex ${containerClassName} items-center justify-center overflow-hidden rounded-[4px] border border-neutral-800 bg-neutral-900 shadow-inner transition-colors group-hover:border-neutral-700`}
    >
      {brand.logoUrl ? (
        <Image
          src={brand.logoUrl}
          alt={brand.name}
          fill
          sizes={sizes}
          unoptimized
          className="object-cover"
        />
      ) : (
        <ImageIcon className="size-5 text-neutral-700" />
      )}
    </div>
  );
}

function BrandDesktopActions({
  brand,
  viewState,
}: {
  brand: Brand;
  viewState: BrandsViewState;
}) {
  const { openDeleteDialog, openEditModal } = viewState;

  return (
    <div className="flex justify-end gap-1 transition-opacity">
      <PermissionGate permission="brands:update">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => openEditModal(brand)}
          className="size-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white"
        >
          <Pencil className="size-4" />
        </Button>
      </PermissionGate>
      <PermissionGate permission="brands:delete">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => openDeleteDialog(brand)}
          className="size-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-rose-500"
        >
          <Trash2 className="size-4" />
        </Button>
      </PermissionGate>
    </div>
  );
}

function BrandMobileCards({ viewState }: { viewState: BrandsViewState }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:hidden">
      {viewState.brands.map((brand) => (
        <BrandMobileCard key={brand.id} brand={brand} viewState={viewState} />
      ))}
    </div>
  );
}

function BrandMobileCard({
  brand,
  viewState,
}: {
  brand: Brand;
  viewState: BrandsViewState;
}) {
  return (
    <div className="group relative flex items-center gap-4 rounded-[4px] border border-neutral-800 bg-[#171717] p-4 transition-all hover:border-neutral-700 active:bg-[#1f1f1f]">
      <div className="absolute top-0 bottom-0 left-0 w-1 rounded-l-[4px] bg-neutral-800" />
      <BrandLogo brand={brand} containerClassName="size-16 shrink-0" sizes="64px" />
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="truncate font-semibold tracking-tight text-white">
          {brand.name}
        </h3>
        <div className="mt-1.5 flex items-center gap-2">
          <Calendar className="size-3 text-neutral-500" />
          <span className="font-mono text-[9px] uppercase text-neutral-500">
            {format(parseISO(brand.createdAt), "dd/MM/yyyy", { locale: ptBR })}
          </span>
        </div>
      </div>
      <BrandActionsMenu brand={brand} viewState={viewState} />
    </div>
  );
}

function BrandActionsMenu({
  brand,
  viewState,
}: {
  brand: Brand;
  viewState: BrandsViewState;
}) {
  const { openDeleteDialog, openEditModal } = viewState;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white"
        >
          <MoreHorizontal className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-200"
      >
        <PermissionGate permission="brands:update">
          <DropdownMenuItem
            onClick={() => openEditModal(brand)}
            className="focus:bg-neutral-800"
          >
            <Pencil className="mr-2 size-4" /> Editar
          </DropdownMenuItem>
        </PermissionGate>
        <PermissionGate permission="brands:delete">
          <DropdownMenuItem
            onClick={() => openDeleteDialog(brand)}
            className="text-rose-500 focus:bg-rose-950/20"
          >
            <Trash2 className="mr-2 size-4" /> Excluir
          </DropdownMenuItem>
        </PermissionGate>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BrandFormModal({ viewState }: { viewState: BrandsViewState }) {
  const { closeModal, form, isModalOpen, onSubmit, selectedBrand } = viewState;

  return (
    <ResponsiveModal
      open={isModalOpen}
      onOpenChange={closeModal}
      title={selectedBrand ? "Editar Marca" : "Nova Marca Corporativa"}
      description="Registro e manutenção de identidade de marca."
      maxWidth="sm:max-w-[450px]"
      footer={<BrandFormFooter viewState={viewState} />}
    >
      <Form {...form}>
        <form
          id="brand-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <BrandNameField form={form} />
          <BrandLogoUrlField form={form} />
          <BrandLogoPreview viewState={viewState} />
        </form>
      </Form>
    </ResponsiveModal>
  );
}

function BrandFormFooter({ viewState }: { viewState: BrandsViewState }) {
  const { closeModal, form, selectedBrand } = viewState;

  return (
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
        className="rounded-[4px] bg-blue-600 px-8 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg hover:bg-blue-700"
      >
        {form.formState.isSubmitting ? (
          <Loader2 className="mr-2 size-3 animate-spin" />
        ) : (
          <Plus className="mr-2 size-3" />
        )}
        {selectedBrand ? "Salvar Alterações" : "Confirmar Registro"}
      </Button>
    </>
  );
}

function BrandNameField({ form }: { form: UseFormReturn<BrandFormData> }) {
  return (
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Nome Oficial <span className="text-rose-500">*</span>
          </FormLabel>
          <FormControl>
            <Input
              placeholder="EX: TECHNO SOLUTIONS"
              {...field}
              className="h-11 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm transition-all placeholder:text-neutral-800 focus:border-blue-600 focus:ring-0 md:h-10"
            />
          </FormControl>
          <FormMessage className="text-[10px] font-bold uppercase text-rose-500" />
        </FormItem>
      )}
    />
  );
}

function BrandLogoUrlField({ form }: { form: UseFormReturn<BrandFormData> }) {
  return (
    <FormField
      control={form.control}
      name="logoUrl"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Logotipo (URL)
          </FormLabel>
          <FormControl>
            <Input
              placeholder="https://assets.cdn.com/logo.png"
              {...field}
              className="h-11 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm transition-all placeholder:text-neutral-800 focus:border-blue-600 focus:ring-0 md:h-10"
            />
          </FormControl>
          <FormMessage className="text-[10px] font-bold uppercase text-rose-500" />
        </FormItem>
      )}
    />
  );
}

function BrandLogoPreview({ viewState }: { viewState: BrandsViewState }) {
  const { logoError, logoPreview, setFailedLogoPreview } = viewState;

  if (!logoPreview) return null;

  return (
    <div className="flex min-h-[120px] flex-col items-center justify-center rounded-[4px] border border-neutral-800 bg-neutral-900/50 p-4">
      <span className="mb-3 text-[8px] font-bold uppercase tracking-widest text-neutral-600">
        Preview de Identidade
      </span>
      {!logoError ? (
        <div className="relative h-20 w-full">
          <Image
            src={logoPreview}
            alt="Brand Identity"
            fill
            sizes="240px"
            unoptimized
            className="rounded-[2px] object-contain shadow-sm"
            onError={() => setFailedLogoPreview(logoPreview)}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-neutral-500 opacity-30">
          <XCircle className="size-8" />
          <span className="text-[9px] font-bold uppercase">Imagem Inválida</span>
        </div>
      )}
    </div>
  );
}

function BrandDeleteDialog({ viewState }: { viewState: BrandsViewState }) {
  const {
    brandToDelete,
    closeDeleteDialog,
    confirmDelete,
    isDeleting,
  } = viewState;

  return (
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
            className="rounded-[4px] border-neutral-800 bg-transparent text-[10px] font-bold uppercase text-neutral-500 hover:bg-neutral-800 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmDelete}
            disabled={isDeleting}
            className="rounded-[4px] border-none bg-rose-600 text-[10px] font-bold uppercase text-white hover:bg-rose-700"
          >
            {isDeleting ? "Processando…" : "Confirmar Exclusão"}
          </Button>
        </>
      }
    >
      <div className="py-2">
        <p className="text-xs text-neutral-500">
          Esta ação removerá permanentemente a marca do sistema e de todos os
          produtos associados.
        </p>
      </div>
    </ResponsiveModal>
  );
}
