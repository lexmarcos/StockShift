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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IconBox } from "@/components/ui/icon-box";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
  Loader2,
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
}: WarehousesViewProps) => {
  const isSubmitting = form.formState.isSubmitting;

  const getSortIcon = (key: SortConfig["key"]) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  return (
    <div className="min-h-screen bg-muted/40 pb-10">
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Armazéns</h1>
            <p className="text-sm text-muted-foreground hidden md:block">
              Gerencie os armazéns e locais de estoque
            </p>
          </div>

          <Button
            onClick={openCreateModal}
            className="hidden md:flex shadow-lg shadow-primary/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Armazém
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl py-8 px-4 md:px-6 lg:px-8">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconBox icon={Building2} colorScheme="blue" />
                <div>
                  <CardTitle className="text-base font-semibold">
                    Lista de Armazéns
                  </CardTitle>
                  <CardDescription>
                    {warehouses.length}{" "}
                    {warehouses.length === 1 ? "armazém" : "armazéns"}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Search Bar and Filters */}
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou código..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
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

            {/* Empty State */}
            {!isLoading && !error && warehouses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery || statusFilter !== "all"
                    ? "Nenhum resultado encontrado"
                    : "Nenhum armazém cadastrado"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== "all"
                    ? "Tente buscar com outros termos ou filtros"
                    : "Adicione seu primeiro armazém para gerenciar estoque"}
                </p>
                {!searchQuery && statusFilter === "all" && (
                  <Button onClick={openCreateModal}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Armazém
                  </Button>
                )}
              </div>
            )}

            {/* Table */}
            {!isLoading && !error && warehouses.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <button
                          onClick={() => handleSort("name")}
                          className="flex items-center font-medium hover:text-foreground"
                        >
                          Nome
                          {getSortIcon("name")}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort("code")}
                          className="flex items-center font-medium hover:text-foreground"
                        >
                          Código
                          {getSortIcon("code")}
                        </button>
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Endereço
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Status
                      </TableHead>
                      <TableHead className="hidden xl:table-cell">
                        <button
                          onClick={() => handleSort("createdAt")}
                          className="flex items-center font-medium hover:text-foreground"
                        >
                          Criado em
                          {getSortIcon("createdAt")}
                        </button>
                      </TableHead>
                      <TableHead className="w-24 text-right">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {warehouses.map((warehouse) => (
                      <TableRow key={warehouse.id}>
                        <TableCell className="font-medium">
                          {warehouse.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {warehouse.code}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground max-w-xs truncate">
                          {warehouse.address || "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge
                            variant={warehouse.isActive ? "default" : "secondary"}
                          >
                            {warehouse.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-muted-foreground">
                          {format(new Date(warehouse.createdAt), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditModal(warehouse)}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(warehouse)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Deletar</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Floating Action Button - Mobile */}
      <Button
        onClick={openCreateModal}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg md:hidden"
        size="icon"
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">Novo Armazém</span>
      </Button>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedWarehouse ? "Editar Armazém" : "Novo Armazém"}
            </DialogTitle>
            <DialogDescription>
              {selectedWarehouse
                ? "Atualize as informações do armazém"
                : "Adicione um novo armazém ao sistema"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Seção 1: Informações Básicas */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Nome <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Armazém Central" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Código <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: WH-001"
                          disabled={!!selectedWarehouse}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        {selectedWarehouse
                          ? "Código não pode ser alterado"
                          : "Apenas letras maiúsculas, números e hífen"}
                      </FormDescription>
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
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o armazém..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
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
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Rua, número, bairro, cidade..."
                          className="resize-none"
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
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(XX) XXXXX-XXXX" {...field} />
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="warehouse@company.com"
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
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Armazém Ativo</FormLabel>
                      <FormDescription className="text-xs">
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

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!warehouseToDelete} onOpenChange={closeDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o armazém{" "}
              <strong>{warehouseToDelete?.name}</strong>? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
