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
} from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { WarehouseFormData } from "./warehouses.schema";
import { Warehouse, SortConfig, StatusFilter } from "./warehouses.types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
    <div className="min-h-screen bg-background pb-10">
      {/* Sticky Header - Corporate Solid */}
      <header className="sticky top-0 z-20 border-b border-border/40 bg-card">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
          <div>
            <h1 className="text-base font-semibold tracking-tight uppercase">
              Armazéns
            </h1>
            <p className="text-xs text-muted-foreground hidden md:block mt-0.5">
              Gerenciamento de armazéns e locais de estoque
            </p>
          </div>

          <Button
            onClick={openCreateModal}
            className="hidden md:flex rounded-sm bg-foreground text-background hover:bg-foreground/90"
          >
            <Plus className="mr-2 h-3.5 w-3.5" />
            Novo Armazém
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl py-6 px-4 md:px-6 lg:px-8">
        <Card className="border border-border/50 bg-card/80 rounded-sm">
          <CardHeader className="border-b border-border/30 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-foreground/5 border border-border/30">
                  <Building2 className="h-4 w-4 text-foreground/70" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                    Lista de Armazéns
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {warehouses.length}{" "}
                    {warehouses.length === 1 ? "armazém" : "armazéns"}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-5">
            {/* Search Bar and Filters - Corporate Solid */}
            <div className="mb-5 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou código..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 rounded-sm border-border/40 bg-background/50 text-sm"
                />
              </div>

              {/* Status Filter */}
              <div className="flex gap-2">
                {(["all", "active", "inactive"] as const).map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className={
                      statusFilter === status
                        ? "rounded-sm bg-foreground text-background hover:bg-foreground/90 text-xs"
                        : "rounded-sm border-border/40 text-xs"
                    }
                  >
                    {status === "all"
                      ? "Todos"
                      : status === "active"
                      ? "Ativos"
                      : "Inativos"}
                  </Button>
                ))}
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex items-center justify-center py-12 text-destructive">
                Erro ao carregar armazéns
              </div>
            )}

            {/* Empty State - Corporate Solid */}
            {!isLoading && !error && warehouses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-sm bg-muted/20 border border-border/30 mb-4">
                  <Building2 className="h-8 w-8 text-foreground/40" />
                </div>
                <h3 className="text-sm font-semibold uppercase tracking-wide mb-2">
                  {searchQuery || statusFilter !== "all"
                    ? "Nenhum resultado encontrado"
                    : "Nenhum armazém cadastrado"}
                </h3>
                <p className="text-xs text-muted-foreground/70 mb-4 max-w-sm">
                  {searchQuery || statusFilter !== "all"
                    ? "Tente buscar com outros termos ou filtros"
                    : "Adicione seu primeiro armazém para gerenciar estoque"}
                </p>
                {!searchQuery && statusFilter === "all" && (
                  <Button
                    onClick={openCreateModal}
                    className="rounded-sm bg-foreground text-background hover:bg-foreground/90"
                  >
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Criar Armazém
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
                    className={`
                      group relative cursor-pointer rounded-sm border bg-card p-5 transition-all
                      ${
                        selectedWarehouseId === warehouse.id
                          ? "border-foreground/60 bg-foreground/5 shadow-md"
                          : "border-border/40 hover:border-border/60 hover:bg-card/60"
                      }
                    `}
                  >
                    {/* Header with icon and menu */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-foreground/10 border border-border/30">
                          <Building2 className="h-5 w-5 text-foreground/70" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold tracking-tight">
                            {warehouse.name}
                          </h3>
                          <Badge
                            variant={warehouse.isActive ? "default" : "secondary"}
                            className={`
                              mt-1 rounded-sm text-[10px] uppercase tracking-wide
                              ${
                                warehouse.isActive
                                  ? "bg-foreground text-background"
                                  : "bg-muted text-muted-foreground"
                              }
                            `}
                          >
                            {warehouse.isActive ? (
                              <CheckCircle2 className="mr-1 h-2.5 w-2.5" />
                            ) : (
                              <XCircle className="mr-1 h-2.5 w-2.5" />
                            )}
                            {warehouse.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>

                      {/* Dropdown Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-sm border-border/50">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(warehouse);
                            }}
                            className="rounded-sm cursor-pointer"
                          >
                            <Edit className="mr-2 h-3.5 w-3.5" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteDialog(warehouse);
                            }}
                            className="rounded-sm cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Description */}
                    {warehouse.description && (
                      <p className="text-xs text-muted-foreground/70 mb-4 line-clamp-2">
                        {warehouse.description}
                      </p>
                    )}

                    {/* Details */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground/60 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground/70 leading-relaxed">
                          {warehouse.address
                            ? `${warehouse.address}, ${warehouse.city} - ${warehouse.state}`
                            : `${warehouse.city} - ${warehouse.state}`}
                        </span>
                      </div>
                      {warehouse.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" />
                          <span className="text-muted-foreground/70">
                            {warehouse.phone}
                          </span>
                        </div>
                      )}
                      {warehouse.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" />
                          <span className="text-muted-foreground/70 truncate">
                            {warehouse.email}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Selected indicator */}
                    {selectedWarehouseId === warehouse.id && (
                      <div className="absolute top-3 left-3 h-2 w-2 rounded-full bg-foreground animate-pulse" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Floating Action Button - Mobile - Corporate Solid */}
      <Button
        onClick={openCreateModal}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-sm bg-foreground text-background hover:bg-foreground/90 md:hidden"
        size="icon"
      >
        <Plus className="h-5 w-5" />
        <span className="sr-only">Novo Armazém</span>
      </Button>

      {/* Create/Edit Modal - Corporate Solid */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[600px] rounded-sm border-border/50">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold uppercase tracking-wide">
              {selectedWarehouse ? "Editar Armazém" : "Novo Armazém"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground/70">
              {selectedWarehouse
                ? "Atualize as informações do armazém"
                : "Adicione um novo armazém ao sistema"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Seção 1: Informações Básicas */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                        Nome <span className="text-foreground/40">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Armazém Central"
                          className="h-10 rounded-sm border-border/40 bg-background/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Seção 2: Descrição */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                      Descrição
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o armazém..."
                        className="resize-none rounded-sm border-border/40 bg-background/50 text-sm"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-[11px] text-muted-foreground/70">
                      {field.value?.length || 0} / 500 caracteres
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Seção 3: Localização e Contato */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                        Endereço
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Rua, número, bairro..."
                          className="resize-none rounded-sm border-border/40 bg-background/50 text-sm"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                          Cidade <span className="text-foreground/40">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: São Paulo"
                            className="h-10 rounded-sm border-border/40 bg-background/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                          Estado <span className="text-foreground/40">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: SP"
                            className="h-10 rounded-sm border-border/40 bg-background/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                          Telefone
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(XX) XXXXX-XXXX"
                            className="h-10 rounded-sm border-border/40 bg-background/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="warehouse@company.com"
                            className="h-10 rounded-sm border-border/40 bg-background/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Seção 4: Status */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-sm border border-border/40 p-3 bg-muted/10">
                    <div className="space-y-0.5">
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide">
                        Armazém Ativo
                      </FormLabel>
                      <FormDescription className="text-[11px] text-muted-foreground/70">
                        Controle se o armazém está operacional
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="rounded-sm border-border/40"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-sm bg-foreground text-background hover:bg-foreground/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog - Corporate Solid */}
      <AlertDialog open={!!warehouseToDelete} onOpenChange={closeDeleteDialog}>
        <AlertDialogContent className="rounded-sm border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold uppercase tracking-wide">
              Confirmar exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground/70">
              Tem certeza que deseja excluir o armazém{" "}
              <strong className="text-foreground">{warehouseToDelete?.name}</strong>
              ? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              onClick={closeDeleteDialog}
              className="rounded-sm border-border/40"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="rounded-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Deletando...
                </>
              ) : (
                "Deletar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
