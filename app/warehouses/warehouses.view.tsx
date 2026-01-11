"use client";

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Building2,
  Loader2,
  MoreVertical,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building
} from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { WarehouseFormData } from "./warehouses.schema";
import { Warehouse, SortConfig, StatusFilter } from "./warehouses.types";
import { WarehouseStockInfo } from "./warehouse-stock-info";
import { cn } from "@/lib/utils";

interface WarehousesViewProps {
  warehouses: Warehouse[];
  isLoading: boolean;
  error: any;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (status: StatusFilter) => void;
  sortConfig: SortConfig;
  handleSort: (key: SortConfig["key"]) => void;
  isModalOpen: boolean;
  selectedWarehouse: Warehouse | null;
  openCreateModal: () => void;
  openEditModal: (warehouse: Warehouse) => void;
  closeModal: () => void;
  form: UseFormReturn<WarehouseFormData>;
  onSubmit: (data: WarehouseFormData) => void;
  warehouseToDelete: Warehouse | null;
  openDeleteDialog: (warehouse: Warehouse) => void;
  closeDeleteDialog: () => void;
  confirmDelete: () => void;
  isDeleting: boolean;
  onSelectWarehouse: (id: string) => void;
  selectedWarehouseId: string | null;
}

export const WarehousesView = ({
  warehouses,
  isLoading,
  error,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  sortConfig,
  handleSort,
  isModalOpen,
  selectedWarehouse,
  openCreateModal,
  openEditModal,
  closeModal,
  form,
  onSubmit,
  warehouseToDelete,
  openDeleteDialog,
  closeDeleteDialog,
  confirmDelete,
  isDeleting,
  onSelectWarehouse,
  selectedWarehouseId,
}: WarehousesViewProps) => {
  const isSubmitting = form.formState.isSubmitting;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 font-sans text-neutral-200">
      <main className="mx-auto w-full max-w-7xl py-8 px-4 md:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
              <Input
                placeholder="Buscar por nome, código ou cidade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 w-full rounded-[4px] border-neutral-800 bg-[#171717] text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-blue-600 focus:ring-0 transition-all hover:border-neutral-700"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              {(["all", "active", "inactive"] as const).map((status) => (
                <Button
                  key={status}
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "h-8 rounded-[4px] px-3 text-xs font-bold uppercase tracking-wide border transition-all",
                    statusFilter === status
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm hover:bg-blue-700"
                      : "border-neutral-800 bg-[#171717] text-neutral-400 hover:text-white hover:border-neutral-600"
                  )}
                >
                  {status === "all" ? "Todos" : status === "active" ? "Ativos" : "Inativos"}
                </Button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="min-h-[400px]">
            {/* Loading State */}
            {isLoading && (
              <div className="flex h-64 w-full flex-col items-center justify-center gap-4 rounded-[4px] border border-neutral-800 bg-[#171717]/50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="text-xs uppercase tracking-wide text-neutral-500">Carregando armazéns...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex h-64 w-full flex-col items-center justify-center gap-4 rounded-[4px] border border-rose-900/30 bg-rose-950/10">
                <AlertTriangle className="h-8 w-8 text-rose-500" />
                <div className="text-center">
                  <h3 className="text-sm font-bold uppercase text-rose-500">Erro de Carregamento</h3>
                  <p className="text-xs text-rose-500/70">Não foi possível acessar a lista de armazéns</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && warehouses.length === 0 && (
              <div className="flex h-96 w-full flex-col items-center justify-center gap-6 rounded-[4px] border border-dashed border-neutral-800 bg-[#171717]/30">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900 ring-1 ring-neutral-800">
                  <Building className="h-8 w-8 text-neutral-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-300">
                    {searchQuery || statusFilter !== "all" ? "Nenhum resultado" : "Nenhum armazém"}
                  </h3>
                  <p className="mt-1 max-w-xs text-xs text-neutral-500">
                    {searchQuery || statusFilter !== "all" 
                      ? "Tente ajustar seus termos de busca."
                      : "Comece cadastrando seu primeiro armazém."}
                  </p>
                </div>
                {!searchQuery && statusFilter === "all" && (
                  <Button
                    onClick={openCreateModal}
                    className="rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Criar Primeiro Armazém
                  </Button>
                )}
              </div>
            )}

            {/* Cards Grid */}
            {!isLoading && !error && warehouses.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {warehouses.map((warehouse) => (
                  <div
                    key={warehouse.id}
                    onClick={() => onSelectWarehouse(warehouse.id)}
                    className={cn(
                      "group relative flex flex-col gap-4 rounded-[4px] border bg-[#171717] p-5 transition-all cursor-pointer",
                      selectedWarehouseId === warehouse.id
                        ? "border-blue-600 shadow-[0_0_0_1px_rgba(37,99,235,1)]"
                        : "border-neutral-800 hover:border-neutral-600"
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-[4px] border",
                          warehouse.isActive 
                            ? "bg-blue-900/20 border-blue-900/30 text-blue-500" 
                            : "bg-neutral-800 border-neutral-700 text-neutral-500"
                        )}>
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white leading-tight">
                            {warehouse.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-[2px] border px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider",
                                warehouse.isActive
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                                  : "border-neutral-700 bg-neutral-800 text-neutral-500"
                              )}
                            >
                              {warehouse.isActive ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white -mr-2 -mt-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(warehouse);
                            }}
                            className="text-xs focus:bg-neutral-800 focus:text-white cursor-pointer"
                          >
                            <Edit className="mr-2 h-3.5 w-3.5" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteDialog(warehouse);
                            }}
                            className="text-xs text-rose-500 focus:bg-rose-950/20 focus:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-neutral-500 line-clamp-2 min-h-[2.5em]">
                      {warehouse.description || "Sem descrição disponível."}
                    </p>

                    {/* Details */}
                    <div className="space-y-2 pt-4 border-t border-neutral-800">
                      <div className="flex items-start gap-2 text-xs text-neutral-400">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 text-neutral-600 shrink-0" />
                        <span className="break-words">
                          {warehouse.address
                            ? `${warehouse.address}, ${warehouse.city} - ${warehouse.state}`
                            : `${warehouse.city} - ${warehouse.state}`}
                        </span>
                      </div>
                      
                      {(warehouse.phone || warehouse.email) && (
                        <div className="flex flex-col gap-1.5 pt-1">
                          {warehouse.phone && (
                            <div className="flex items-center gap-2 text-xs text-neutral-400">
                              <Phone className="h-3.5 w-3.5 text-neutral-600 shrink-0" />
                              <span>{warehouse.phone}</span>
                            </div>
                          )}
                          {warehouse.email && (
                            <div className="flex items-center gap-2 text-xs text-neutral-400">
                              <Mail className="h-3.5 w-3.5 text-neutral-600 shrink-0" />
                              <span className="truncate">{warehouse.email}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Stock Summary Placeholder */}
                    <div className="mt-auto pt-2">
                       <WarehouseStockInfo warehouseId={warehouse.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Button - Mobile */}
      <Button
        onClick={openCreateModal}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 md:hidden z-40 flex items-center justify-center"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Create/Edit Modal */}
      <ResponsiveModal
        open={isModalOpen}
        onOpenChange={closeModal}
        title={selectedWarehouse ? "Editar Armazém" : "Novo Armazém"}
        description={
          selectedWarehouse
            ? "Atualize as informações do armazém"
            : "Preencha os dados para cadastrar um novo local"
        }
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              className="rounded-[4px] border-neutral-700 bg-transparent text-xs uppercase hover:bg-neutral-800 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="warehouse-form"
              disabled={isSubmitting}
              className="rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Dados"
              )}
            </Button>
          </>
        }
      >
        <Form {...form}>
          <form id="warehouse-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-2">
            {/* Basic Info */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Nome do Armazém <span className="text-rose-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="EX: CENTRAL DE DISTRIBUIÇÃO"
                      className="rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Descrição
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhes sobre a operação deste local..."
                      className="rounded-[4px] border-neutral-800 bg-neutral-900 text-sm resize-none focus:border-blue-600 focus:ring-0 min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-500" />
                </FormItem>
              )}
            />

            {/* Location */}
            <div className="space-y-4 pt-2 border-t border-neutral-800">
              <h4 className="text-xs font-bold uppercase tracking-wide text-white mb-2">Localização</h4>
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Endereço Completo
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Rua, Número, Bairro"
                        className="rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-rose-500" />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Cidade <span className="text-rose-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: São Paulo"
                          className="rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-rose-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Estado (UF) <span className="text-rose-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: SP"
                          maxLength={2}
                          className="rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0 uppercase"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-rose-500" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-4 pt-2 border-t border-neutral-800">
              <h4 className="text-xs font-bold uppercase tracking-wide text-white mb-2">Contato</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Telefone
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(00) 00000-0000"
                          className="rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-rose-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="email@empresa.com"
                          className="rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-rose-500" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Status */}
            <div className="pt-2 border-t border-neutral-800">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-[4px] border border-neutral-800 bg-neutral-900 p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-bold text-white">
                        Status Operacional
                      </FormLabel>
                      <FormDescription className="text-xs text-neutral-500">
                        Armazéns inativos não permitem movimentações
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </ResponsiveModal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!warehouseToDelete} onOpenChange={closeDeleteDialog}>
        <AlertDialogContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold uppercase tracking-wide text-white">
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-neutral-500">
              Tem certeza que deseja deletar o armazém{" "}
              <strong className="text-white">{warehouseToDelete?.name}</strong>?
              Esta ação é irreversível e pode afetar históricos de movimentação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-[4px] border-neutral-700 bg-transparent text-xs uppercase hover:bg-neutral-800 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="rounded-[4px] bg-rose-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-rose-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Deletando...
                </>
              ) : (
                "Confirmar Exclusão"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
