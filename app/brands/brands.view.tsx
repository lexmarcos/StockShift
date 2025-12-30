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
  Package,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { BrandFormData } from "./brands.schema";
import { Brand, SortConfig } from "./brands.types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useEffect } from "react";

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

  // Update preview when logoUrl changes
  useEffect(() => {
    if (logoUrl && logoUrl.trim()) {
      setLogoPreview(logoUrl);
      setLogoError(false);
    } else {
      setLogoPreview("");
      setLogoError(false);
    }
  }, [logoUrl]);

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
            <h1 className="text-lg font-semibold tracking-tight">Marcas</h1>
            <p className="text-sm text-muted-foreground hidden md:block">
              Gerencie as marcas dos produtos
            </p>
          </div>

          <Button
            onClick={openCreateModal}
            className="hidden md:flex shadow-lg shadow-primary/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Marca
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl py-8 px-4 md:px-6 lg:px-8">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconBox icon={Package} colorScheme="blue" />
                <div>
                  <CardTitle className="text-base font-semibold">
                    Lista de Marcas
                  </CardTitle>
                  <CardDescription>
                    {brands.length}{" "}
                    {brands.length === 1 ? "marca" : "marcas"}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
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
                Erro ao carregar marcas
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && brands.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery
                    ? "Nenhum resultado encontrado"
                    : "Nenhuma marca cadastrada"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery
                    ? "Tente buscar com outros termos"
                    : "Adicione sua primeira marca para organizar produtos"}
                </p>
                {!searchQuery && (
                  <Button onClick={openCreateModal}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Marca
                  </Button>
                )}
              </div>
            )}

            {/* Table */}
            {!isLoading && !error && brands.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Logo</TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort("name")}
                          className="flex items-center font-medium hover:text-foreground"
                        >
                          Nome
                          {getSortIcon("name")}
                        </button>
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
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
                    {brands.map((brand) => (
                      <TableRow key={brand.id}>
                        <TableCell>
                          {brand.logoUrl ? (
                            <img
                              src={brand.logoUrl}
                              alt={brand.name}
                              className="h-12 w-12 rounded object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                e.currentTarget.nextElementSibling?.classList.remove(
                                  "hidden"
                                );
                              }}
                            />
                          ) : null}
                          <div
                            className={
                              brand.logoUrl
                                ? "hidden h-12 w-12 rounded bg-muted flex items-center justify-center"
                                : "h-12 w-12 rounded bg-muted flex items-center justify-center"
                            }
                          >
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {brand.name}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {format(new Date(brand.createdAt), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditModal(brand)}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(brand)}
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
        <span className="sr-only">Nova Marca</span>
      </Button>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedBrand ? "Editar Marca" : "Nova Marca"}
            </DialogTitle>
            <DialogDescription>
              {selectedBrand
                ? "Atualize as informações da marca"
                : "Adicione uma nova marca ao sistema"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nome <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Natura" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do Logo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://exemplo.com/logo.png"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Cole a URL da imagem do logo
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Logo Preview */}
              {logoPreview && (
                <div className="space-y-2">
                  <FormLabel>Preview do Logo</FormLabel>
                  <div className="flex items-center justify-center rounded-lg border p-4 bg-muted/20">
                    {!logoError ? (
                      <img
                        src={logoPreview}
                        alt="Preview"
                        className="max-h-32 max-w-full rounded object-contain"
                        onError={() => setLogoError(true)}
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ImageIcon className="h-12 w-12" />
                        <p className="text-sm">
                          Não foi possível carregar a imagem
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
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
      <AlertDialog
        open={!!brandToDelete}
        onOpenChange={closeDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a marca{" "}
              <strong>{brandToDelete?.name}</strong>? Esta ação não pode
              ser desfeita.
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
