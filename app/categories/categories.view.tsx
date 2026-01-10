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
  AlertTriangle,
  Layers,
  Tag
} from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { CategoryFormData } from "./categories.schema";
import { Category, CategoryTree, SortConfig, ViewMode } from "./categories.types";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
          className="group flex items-center gap-2 py-2.5 px-3 hover:bg-neutral-800/50 border-l border-neutral-800 hover:border-blue-600/50 transition-colors bg-[#171717] mb-[1px]"
          style={{ marginLeft: `${node.depth * 24}px` }}
        >
          {/* Expand/Collapse Button */}
          <button
            onClick={() => hasChildren && toggleNode(node.id)}
            className={`flex h-6 w-6 items-center justify-center rounded-[2px] transition-all border border-transparent ${
              hasChildren
                ? "hover:bg-neutral-800 hover:border-neutral-700 cursor-pointer text-neutral-500 hover:text-white"
                : "cursor-default opacity-0"
            }`}
            disabled={!hasChildren}
          >
            {hasChildren && (
              <>
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </>
            )}
          </button>

          {/* Icon */}
          <Icon className={cn("h-4 w-4", isExpanded ? "text-blue-500" : "text-neutral-500 group-hover:text-blue-400 transition-colors")} />

          {/* Name */}
          <span className="flex-1 text-sm font-medium text-neutral-200 group-hover:text-white transition-colors">
            {node.name}
          </span>

          {/* Children Count */}
          {hasChildren && (
            <Badge variant="outline" className="rounded-[2px] border-neutral-700 bg-neutral-800 text-[9px] font-bold text-neutral-400">
              {node.children.length} SUB
            </Badge>
          )}

          {/* Actions */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-[4px] hover:bg-neutral-800 text-neutral-400 hover:text-blue-500"
              onClick={() => openEditModal(node)}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-[4px] hover:bg-rose-950/30 text-neutral-400 hover:text-rose-500"
              onClick={() => openDeleteDialog(node)}
            >
              <Trash2 className="h-3.5 w-3.5" />
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
        className="group flex items-center gap-3 py-3 px-4 border border-neutral-800 bg-[#171717] hover:border-blue-900/50 hover:bg-neutral-800/30 transition-all rounded-[4px] mb-2"
      >
        {/* Icon with depth indicator */}
        <div className="flex h-8 w-8 items-center justify-center rounded-[2px] bg-neutral-900 border border-neutral-800 group-hover:border-blue-900/30 group-hover:bg-blue-950/10 transition-colors">
          <Tag className="h-4 w-4 text-neutral-500 group-hover:text-blue-500" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-neutral-200 group-hover:text-white">
              {node.name}
            </span>
            {node.parentCategoryName && (
              <Badge variant="outline" className="rounded-[2px] border-neutral-800 bg-neutral-900 text-[9px] font-mono text-neutral-500">
                em {node.parentCategoryName}
              </Badge>
            )}
          </div>
          {node.description && (
            <p className="text-xs text-neutral-500 truncate mt-0.5 max-w-md">
              {node.description}
            </p>
          )}
        </div>

        {/* Children Badge */}
        {node.children.length > 0 && (
          <Badge variant="outline" className="rounded-[2px] border-neutral-700 bg-neutral-800 text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
            {node.children.length} subcategorias
          </Badge>
        )}

        {/* Actions */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-[4px] hover:bg-neutral-800 text-neutral-400 hover:text-blue-500"
            onClick={() => openEditModal(node)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-[4px] hover:bg-rose-950/30 text-neutral-400 hover:text-rose-500"
            onClick={() => openDeleteDialog(node)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 font-sans text-neutral-200">
      <main className="mx-auto w-full max-w-7xl py-8 px-4 md:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          {/* Actions Bar */}
          <div className="flex items-center justify-end">
            <Button
              onClick={openCreateModal}
              className="h-10 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Categoria
            </Button>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
              <Input
                placeholder="Buscar categorias..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 w-full rounded-[4px] border-neutral-800 bg-[#171717] text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-blue-600 focus:ring-0 transition-all hover:border-neutral-700"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              {/* View Mode Toggle */}
              <div className="bg-[#171717] p-1 rounded-[4px] border border-neutral-800 flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("tree")}
                  className={cn(
                    "h-8 rounded-[2px] px-3 text-xs font-bold uppercase tracking-wide",
                    viewMode === "tree" 
                      ? "bg-neutral-800 text-white shadow-sm" 
                      : "text-neutral-500 hover:text-neutral-300 hover:bg-transparent"
                  )}
                >
                  <FolderTree className="mr-2 h-3.5 w-3.5" />
                  Árvore
                </Button>
                <div className="w-px h-4 bg-neutral-800 mx-1"></div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("flat")}
                  className={cn(
                    "h-8 rounded-[2px] px-3 text-xs font-bold uppercase tracking-wide",
                    viewMode === "flat" 
                      ? "bg-neutral-800 text-white shadow-sm" 
                      : "text-neutral-500 hover:text-neutral-300 hover:bg-transparent"
                  )}
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
                    size="icon"
                    onClick={expandAll}
                    title="Expandir Tudo"
                    className="h-10 w-10 rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-400 hover:bg-neutral-800 hover:text-white"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={collapseAll}
                    title="Recolher Tudo"
                    className="h-10 w-10 rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-400 hover:bg-neutral-800 hover:text-white"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="min-h-[400px]">
            {/* Loading State */}
            {isLoading && (
              <div className="flex h-64 w-full flex-col items-center justify-center gap-4 rounded-[4px] border border-neutral-800 bg-[#171717]/50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="text-xs uppercase tracking-wide text-neutral-500">Carregando categorias...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex h-64 w-full flex-col items-center justify-center gap-4 rounded-[4px] border border-rose-900/30 bg-rose-950/10">
                <AlertTriangle className="h-8 w-8 text-rose-500" />
                <div className="text-center">
                  <h3 className="text-sm font-bold uppercase text-rose-500">Erro de Carregamento</h3>
                  <p className="text-xs text-rose-500/70">Não foi possível acessar a lista de categorias</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && flatCategories.length === 0 && !searchQuery && (
              <div className="flex h-96 w-full flex-col items-center justify-center gap-6 rounded-[4px] border border-dashed border-neutral-800 bg-[#171717]/30">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900 ring-1 ring-neutral-800">
                  <Layers className="h-8 w-8 text-neutral-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-300">
                    Nenhuma categoria criada
                  </h3>
                  <p className="mt-1 max-w-xs text-xs text-neutral-500">
                    Comece organizando seus produtos criando a primeira categoria.
                  </p>
                </div>
                <Button
                  onClick={openCreateModal}
                  className="rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  Criar Primeira Categoria
                </Button>
              </div>
            )}

            {/* No Results State */}
            {!isLoading && !error && flatCategories.length === 0 && searchQuery && (
              <div className="flex h-64 w-full flex-col items-center justify-center gap-6 rounded-[4px] border border-dashed border-neutral-800 bg-[#171717]/30">
                <div className="flex h-16 w-16 items-center justify-center rounded-[4px] bg-neutral-900 ring-1 ring-neutral-800">
                  <Search className="h-6 w-6 text-neutral-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-300">
                    Nenhum resultado
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    Não encontramos categorias para "{searchQuery}"
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery("")}
                  className="rounded-[4px] border-neutral-700 text-xs uppercase text-neutral-300 hover:bg-neutral-800"
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
                <div className="rounded-[4px] border border-neutral-800 bg-[#0A0A0A] overflow-hidden">
                  <div className="bg-neutral-900 px-3 py-2 border-b border-neutral-800">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Estrutura Hierárquica</span>
                  </div>
                  {(categories as CategoryTree[]).map((node) => renderTreeNode(node))}
                </div>
              )}

            {/* Flat List View */}
            {!isLoading &&
              !error &&
              flatCategories.length > 0 &&
              viewMode === "flat" && (
                <div className="space-y-1">
                   <div className="flex justify-between items-center mb-2 px-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Lista Completa</span>
                    <span className="text-[10px] font-mono text-neutral-600">{flatCategories.length} TOTAL</span>
                  </div>
                  {flatCategories.map((node) => renderFlatItem(node))}
                </div>
              )}
          </div>
        </div>
      </main>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[500px] rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-200">
          <DialogHeader>
            <DialogTitle className="text-base font-bold uppercase tracking-wide text-white">
              {selectedCategory ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              {selectedCategory
                ? "Atualize as informações estruturais da categoria"
                : "Defina os parâmetros para a nova categoria"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Nome da Categoria
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="EX: ELETRÔNICOS"
                        className="rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-rose-500" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="parentCategoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Categoria Pai
                      </FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === "root" ? null : value)}
                        value={field.value || "root"}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:ring-0">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
                          <SelectItem value="root" className="text-sm font-medium focus:bg-neutral-800 focus:text-white">
                            <span className="text-blue-500 font-bold mr-2">●</span> RAIZ (Sem Pai)
                          </SelectItem>
                          {allCategories
                            .filter((cat) => cat.id !== selectedCategory?.id)
                            .map((cat) => (
                              <SelectItem key={cat.id} value={cat.id} className="text-sm focus:bg-neutral-800 focus:text-white">
                                {cat.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs text-rose-500" />
                    </FormItem>
                  )}
                />
              </div>

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
                        placeholder="Detalhes opcionais..."
                        className="rounded-[4px] border-neutral-800 bg-neutral-900 text-sm resize-none focus:border-blue-600 focus:ring-0 min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-rose-500" />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 pt-4">
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
                  disabled={form.formState.isSubmitting}
                  className="rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Salvando...
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
        <AlertDialogContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold uppercase tracking-wide text-white">
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-neutral-500">
              Tem certeza que deseja deletar a categoria{" "}
              <strong className="text-white">{categoryToDelete?.name}</strong>?
              {categoryToDelete && flatCategories.find(c => c.id === categoryToDelete.id)?.children?.length && flatCategories.find(c => c.id === categoryToDelete.id)!.children.length > 0 && (
                <div className="mt-3 rounded-[2px] border border-rose-900/30 bg-rose-950/20 p-3 text-rose-400">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    ATENÇÃO
                  </div>
                  Esta categoria possui subcategorias. A exclusão pode afetar a estrutura hierárquica.
                </div>
              )}
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
