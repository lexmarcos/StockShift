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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  FolderTree,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  List,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { CategoryFormData } from "./categories.schema";
import { Category, CategoryTree, SortConfig, ViewMode } from "./categories.types";

interface CategoriesViewProps {
  categories: CategoryTree[] | CategoryTree[];
  categoryTree: CategoryTree[];
  flatCategories: CategoryTree[];
  isLoading: boolean;
  error: any;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  sortConfig: SortConfig;
  handleSort: (key: SortConfig["key"]) => void;
  isModalOpen: boolean;
  selectedCategory: Category | null;
  openCreateModal: () => void;
  openEditModal: (category: Category) => void;
  closeModal: () => void;
  form: UseFormReturn<CategoryFormData>;
  onSubmit: (data: CategoryFormData) => void;
  categoryToDelete: Category | null;
  openDeleteDialog: (category: Category) => void;
  closeDeleteDialog: () => void;
  confirmDelete: () => void;
  isDeleting: boolean;
  expandedNodes: Set<string>;
  toggleNode: (nodeId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  allCategories: Category[];
}

export const CategoriesView = ({
  categories,
  categoryTree,
  flatCategories,
  isLoading,
  error,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  sortConfig,
  handleSort,
  isModalOpen,
  selectedCategory,
  openCreateModal,
  openEditModal,
  closeModal,
  form,
  onSubmit,
  categoryToDelete,
  openDeleteDialog,
  closeDeleteDialog,
  confirmDelete,
  isDeleting,
  expandedNodes,
  toggleNode,
  expandAll,
  collapseAll,
  allCategories,
}: CategoriesViewProps) => {
  // Render tree node recursively
  const renderTreeNode = (node: CategoryTree) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const Icon = isExpanded ? FolderOpen : Folder;

    return (
      <div key={node.id} className="select-none">
        {/* Node Row */}
        <div
          className="group flex items-center gap-2 py-2 px-3 hover:bg-muted/30 rounded-sm border-l-2 border-transparent hover:border-border/60 transition-colors"
          style={{ marginLeft: `${node.depth * 24}px` }}
        >
          {/* Expand/Collapse Button */}
          <button
            onClick={() => hasChildren && toggleNode(node.id)}
            className={`flex h-5 w-5 items-center justify-center rounded-sm transition-all ${
              hasChildren
                ? "hover:bg-muted cursor-pointer"
                : "cursor-default opacity-0"
            }`}
            disabled={!hasChildren}
          >
            {hasChildren && (
              <>
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-foreground/70" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-foreground/70" />
                )}
              </>
            )}
          </button>

          {/* Icon */}
          <Icon className="h-4 w-4 text-foreground/50" />

          {/* Name */}
          <span className="flex-1 text-sm font-medium text-foreground">
            {node.name}
          </span>

          {/* Children Count */}
          {hasChildren && (
            <Badge variant="secondary" className="rounded-sm text-xs px-1.5 py-0">
              {node.children.length}
            </Badge>
          )}

          {/* Actions */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-sm"
              onClick={() => openEditModal(node)}
            >
              <Edit className="h-3.5 w-3.5" />
              <span className="sr-only">Editar</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-sm text-destructive/80 hover:text-destructive"
              onClick={() => openDeleteDialog(node)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="sr-only">Deletar</span>
            </Button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>{node.children.map((child) => renderTreeNode(child))}</div>
        )}
      </div>
    );
  };

  // Render flat list item
  const renderFlatItem = (node: CategoryTree) => {
    return (
      <div
        key={node.id}
        className="group flex items-center gap-3 py-3 px-4 border-b border-border/20 hover:bg-muted/30 transition-colors"
      >
        {/* Icon with depth indicator */}
        <div className="flex items-center gap-2" style={{ marginLeft: `${node.depth * 16}px` }}>
          <Folder className="h-4 w-4 text-foreground/50" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">
              {node.name}
            </span>
            {node.parentCategoryName && (
              <span className="text-xs text-muted-foreground/60">
                em {node.parentCategoryName}
              </span>
            )}
          </div>
          {node.description && (
            <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
              {node.description}
            </p>
          )}
        </div>

        {/* Children Badge */}
        {node.children.length > 0 && (
          <Badge variant="secondary" className="rounded-sm text-xs">
            {node.children.length} subcategorias
          </Badge>
        )}

        {/* Actions */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-sm"
            onClick={() => openEditModal(node)}
          >
            <Edit className="h-3.5 w-3.5" />
            <span className="sr-only">Editar</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-sm text-destructive/80 hover:text-destructive"
            onClick={() => openDeleteDialog(node)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only">Deletar</span>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 border-b border-border/40 bg-card">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-foreground/5 border border-border/30">
              <FolderTree className="h-4 w-4 text-foreground/70" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight uppercase">
                Categorias
              </h1>
              <p className="text-xs text-muted-foreground hidden md:block mt-0.5">
                {flatCategories.length}{" "}
                {flatCategories.length === 1 ? "categoria" : "categorias"}
              </p>
            </div>
          </div>

          <Button
            onClick={openCreateModal}
            className="rounded-sm bg-foreground text-background hover:bg-foreground/90"
          >
            <Plus className="mr-2 h-3.5 w-3.5" />
            Nova Categoria
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl py-6 px-4 md:px-6 lg:px-8">
        <Card className="border border-border/50 bg-card/80 rounded-sm">
          <CardHeader className="border-b border-border/30 pb-3">
            <div className="flex items-center justify-between mb-4">
              <div>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                  Gerenciar Categorias
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Organize produtos em categorias hierárquicas
                </CardDescription>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                <Input
                  placeholder="Buscar categorias..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 rounded-sm border-border/40 text-xs bg-background"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "tree" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("tree")}
                  className="rounded-sm text-xs h-9"
                >
                  <FolderTree className="mr-2 h-3.5 w-3.5" />
                  Árvore
                </Button>
                <Button
                  variant={viewMode === "flat" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("flat")}
                  className="rounded-sm text-xs h-9"
                >
                  <List className="mr-2 h-3.5 w-3.5" />
                  Lista
                </Button>
              </div>

              {/* Expand/Collapse Controls (Tree View Only) */}
              {viewMode === "tree" && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={expandAll}
                    className="rounded-sm text-xs h-9"
                  >
                    <Maximize2 className="mr-2 h-3.5 w-3.5" />
                    Expandir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={collapseAll}
                    className="rounded-sm text-xs h-9"
                  >
                    <Minimize2 className="mr-2 h-3.5 w-3.5" />
                    Recolher
                  </Button>
                </div>
              )}
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
                Erro ao carregar categorias
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && flatCategories.length === 0 && !searchQuery && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-sm bg-muted/20 border border-border/30 mb-4">
                  <FolderTree className="h-8 w-8 text-foreground/40" />
                </div>
                <h3 className="text-sm font-semibold uppercase tracking-wide mb-2">
                  Nenhuma categoria criada
                </h3>
                <p className="text-xs text-muted-foreground/70 mb-4 max-w-sm">
                  Crie categorias para organizar seus produtos
                </p>
                <Button
                  onClick={openCreateModal}
                  className="rounded-sm bg-foreground text-background hover:bg-foreground/90"
                >
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  Criar Primeira Categoria
                </Button>
              </div>
            )}

            {/* No Results State */}
            {!isLoading && !error && flatCategories.length === 0 && searchQuery && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-sm bg-muted/20 border border-border/30 mb-4">
                  <Search className="h-8 w-8 text-foreground/40" />
                </div>
                <h3 className="text-sm font-semibold uppercase tracking-wide mb-2">
                  Nenhuma categoria encontrada
                </h3>
                <p className="text-xs text-muted-foreground/70 mb-4 max-w-sm">
                  Tente buscar com outros termos
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery("")}
                  className="rounded-sm border-border/40 text-xs"
                >
                  Limpar Busca
                </Button>
              </div>
            )}

            {/* Tree View */}
            {!isLoading &&
              !error &&
              flatCategories.length > 0 &&
              viewMode === "tree" && (
                <div className="rounded-sm border border-border/40 bg-background">
                  {(categories as CategoryTree[]).map((node) => renderTreeNode(node))}
                </div>
              )}

            {/* Flat List View */}
            {!isLoading &&
              !error &&
              flatCategories.length > 0 &&
              viewMode === "flat" && (
                <div className="rounded-sm border border-border/40 bg-background">
                  {flatCategories.map((node) => renderFlatItem(node))}
                </div>
              )}
          </CardContent>
        </Card>
      </main>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[500px] rounded-sm">
          <DialogHeader>
            <DialogTitle className="text-base uppercase tracking-wide">
              {selectedCategory ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {selectedCategory
                ? "Atualize as informações da categoria"
                : "Preencha os dados para criar uma nova categoria"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wide">
                      Nome *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o nome da categoria"
                        className="rounded-sm border-border/40 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wide">
                      Descrição
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrição opcional da categoria"
                        className="rounded-sm border-border/40 text-sm resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parentCategoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wide">
                      Categoria Pai
                    </FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "root" ? null : value)}
                      value={field.value || "root"}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-sm border-border/40 text-sm">
                          <SelectValue placeholder="Selecione a categoria pai" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-sm">
                        <SelectItem value="root" className="text-sm">
                          Raiz (Sem Pai)
                        </SelectItem>
                        {allCategories
                          .filter((cat) => cat.id !== selectedCategory?.id)
                          .map((cat) => (
                            <SelectItem key={cat.id} value={cat.id} className="text-sm">
                              {cat.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      Deixe em "Raiz" para categoria de nível superior
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="rounded-sm text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="rounded-sm bg-foreground text-background hover:bg-foreground/90 text-xs"
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      {selectedCategory ? "Salvando..." : "Criando..."}
                    </>
                  ) : selectedCategory ? (
                    "Salvar Alterações"
                  ) : (
                    "Criar Categoria"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={closeDeleteDialog}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base uppercase tracking-wide">
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Tem certeza que deseja deletar a categoria{" "}
              <strong className="text-foreground">{categoryToDelete?.name}</strong>?
              {categoryToDelete && flatCategories.find(c => c.id === categoryToDelete.id)?.children?.length && flatCategories.find(c => c.id === categoryToDelete.id)!.children.length > 0 && (
                <span className="block mt-2 text-destructive">
                  Esta categoria possui subcategorias. Todas serão afetadas.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="rounded-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs"
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
