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
  Tag,
  MoreHorizontal,
  Box
} from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { CategoryFormData } from "./categories.schema";
import { Category, CategoryTree, SortConfig, ViewMode } from "./categories.types";
import { cn } from "@/lib/utils";

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
  categoryTree,
  flatCategories,
  isLoading,
  error,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
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

  // Recursively render tree nodes
  const renderTreeNode = (node: CategoryTree) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const Icon = isExpanded ? FolderOpen : Folder;
    
    // Depth-based border colors for visual hierarchy
    const depthColors = [
      "border-blue-500", 
      "border-emerald-500", 
      "border-amber-500", 
      "border-purple-500"
    ];
    const activeBorder = depthColors[node.depth % depthColors.length];

    return (
      <div key={node.id} className="select-none">
        {/* Node Row */}
        <div
          className={cn(
            "group relative flex items-center gap-3 py-3 px-3 md:px-4 bg-[#171717] mb-[1px] transition-all",
            "border-l-[4px] border-neutral-800 hover:bg-[#1f1f1f]",
             isExpanded ? activeBorder : "hover:border-neutral-600"
          )}
          style={{ paddingLeft: `${(node.depth * 16) + 12}px` }}
        >
          {/* Visual Thread Line for nested items */}
          {node.depth > 0 && (
             <div 
               className="absolute left-0 top-0 bottom-0 w-[1px] bg-neutral-800"
               style={{ left: `${node.depth * 16}px` }} 
             />
          )}

          {/* Expand/Collapse Trigger */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              hasChildren && toggleNode(node.id);
            }}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] border border-transparent transition-all",
              hasChildren
                ? "cursor-pointer bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-white"
                : "invisible"
            )}
            disabled={!hasChildren}
            aria-label={isExpanded ? "Recolher" : "Expandir"}
          >
            {hasChildren && (
              isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {/* Icon */}
          <Icon className={cn(
            "h-5 w-5 shrink-0 transition-colors", 
            isExpanded ? "text-blue-500" : "text-neutral-500 group-hover:text-neutral-300"
          )} />

          {/* Content Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center cursor-pointer" onClick={() => hasChildren && toggleNode(node.id)}>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-sm font-medium transition-colors truncate",
                isExpanded ? "text-white" : "text-neutral-300 group-hover:text-white"
              )}>
                {node.name}
              </span>
              
              {hasChildren && (
                 <Badge variant="outline" className="hidden sm:flex h-5 rounded-[2px] border-neutral-700 bg-neutral-800 px-1.5 text-[9px] font-bold text-neutral-400">
                   {node.children.length}
                 </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-1 transition-opacity">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(node);
                }}
                className="h-8 w-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => {
                  e.stopPropagation();
                  openDeleteDialog(node);
                }}
                className="h-8 w-8 rounded-[4px] text-neutral-500 hover:bg-rose-950/20 hover:text-rose-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile Actions Menu */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white focus:opacity-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Ações</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-200">
                  <DropdownMenuLabel className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Opções
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-neutral-800" />
                  <DropdownMenuItem 
                    onClick={() => openEditModal(node)}
                    className="cursor-pointer focus:bg-neutral-800 focus:text-white"
                  >
                    <Edit className="mr-2 h-3.5 w-3.5" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => openDeleteDialog(node)}
                    className="cursor-pointer text-rose-500 focus:bg-rose-950/20 focus:text-rose-400"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Children Render */}
        {hasChildren && isExpanded && (
          <div className="relative">
             {/* Vertical Guide Line */}
             <div 
               className="absolute top-0 bottom-0 w-px bg-neutral-800/50"
               style={{ left: `${(node.depth * 16) + 15}px` }}
             />
             {node.children.map((child) => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  // Render Flat List Item
  const renderFlatItem = (node: CategoryTree) => {
    return (
      <div
        key={node.id}
        className="group relative flex items-center gap-4 border border-neutral-800 bg-[#171717] p-4 rounded-[4px] mb-2 hover:border-neutral-700 transition-all"
      >
        {/* Left Color Accent */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-neutral-800 group-hover:bg-blue-600 transition-colors rounded-l-[4px]" />

        {/* Icon Box */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] bg-neutral-900 border border-neutral-800 group-hover:border-neutral-700 transition-colors">
          <Tag className="h-4 w-4 text-neutral-500 group-hover:text-blue-500" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-bold text-neutral-200 group-hover:text-white">
              {node.name}
            </span>
            {node.parentCategoryName && (
              <Badge variant="outline" className="rounded-[2px] border-neutral-800 bg-neutral-900/50 text-[9px] font-mono text-neutral-500">
                <span className="text-neutral-600 mr-1">↳</span> {node.parentCategoryName}
              </Badge>
            )}
          </div>
          {node.description && (
            <p className="text-xs text-neutral-500 truncate mt-1">
              {node.description}
            </p>
          )}
        </div>

        {/* Stats (Hidden on small mobile) */}
        {node.children.length > 0 && (
           <div className="hidden sm:flex flex-col items-end gap-1">
             <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Subcategorias</span>
             <Badge className="bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border-neutral-700 rounded-[2px] px-2">
                {node.children.length}
             </Badge>
           </div>
        )}

        {/* Actions Menu */}
        <div className="flex items-center gap-1">
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-1 transition-opacity">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => openEditModal(node)}
              className="h-8 w-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => openDeleteDialog(node)}
              className="h-8 w-8 rounded-[4px] text-neutral-500 hover:bg-rose-950/20 hover:text-rose-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Actions Menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Ações</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-200">
                <DropdownMenuLabel className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Opções
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-neutral-800" />
                <DropdownMenuItem 
                  onClick={() => openEditModal(node)}
                  className="cursor-pointer focus:bg-neutral-800 focus:text-white"
                >
                  <Edit className="mr-2 h-3.5 w-3.5" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => openDeleteDialog(node)}
                  className="cursor-pointer text-rose-500 focus:bg-rose-950/20 focus:text-rose-400"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 font-sans text-neutral-200">
      
      {/* Header & Controls */}
      <div className="sticky top-0 z-30 border-b border-neutral-800 bg-[#0A0A0A]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0A0A0A]/60">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6 lg:px-8">
          
          <div className="flex flex-col gap-4">
            {/* Title & Main Action */}
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-blue-600/10 border border-blue-900/50">
                   <Layers className="h-4 w-4 text-blue-500" />
                 </div>
                 <h1 className="text-lg font-bold tracking-tight text-white uppercase">Categorias</h1>
               </div>
               
               <Button
                onClick={openCreateModal}
                className="h-9 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 shadow-[0_0_15px_-3px_rgba(37,99,235,0.4)]"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Nova Categoria</span>
                <span className="sm:hidden">Nova</span>
              </Button>
            </div>

            {/* Filters Toolbar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                <Input
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-full rounded-[4px] border-neutral-800 bg-[#171717] text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-blue-600 focus:ring-0 transition-all hover:border-neutral-700"
                />
              </div>

              {/* View Toggle Group */}
              <div className="flex bg-[#171717] p-0.5 rounded-[4px] border border-neutral-800 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("tree")}
                  title="Visualização em Árvore"
                  className={cn(
                    "h-8 w-8 rounded-[2px]",
                    viewMode === "tree" 
                      ? "bg-neutral-800 text-white shadow-sm" 
                      : "text-neutral-500 hover:text-neutral-300"
                  )}
                >
                  <FolderTree className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("flat")}
                  title="Visualização em Lista"
                  className={cn(
                    "h-8 w-8 rounded-[2px]",
                    viewMode === "flat" 
                      ? "bg-neutral-800 text-white shadow-sm" 
                      : "text-neutral-500 hover:text-neutral-300"
                  )}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Tree specific controls (Expand/Collapse) */}
          {viewMode === "tree" && flatCategories.length > 0 && (
             <div className="flex items-center gap-2 mt-2 pt-2 border-t border-neutral-800/50">
                <button 
                  onClick={expandAll}
                  className="text-[10px] uppercase font-bold text-neutral-500 hover:text-blue-500 transition-colors flex items-center gap-1"
                >
                  <Maximize2 className="h-3 w-3" /> Expandir Tudo
                </button>
                <span className="text-neutral-800">|</span>
                <button 
                  onClick={collapseAll}
                  className="text-[10px] uppercase font-bold text-neutral-500 hover:text-neutral-300 transition-colors flex items-center gap-1"
                >
                  <Minimize2 className="h-3 w-3" /> Recolher Tudo
                </button>
             </div>
          )}
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl p-4 md:px-6 lg:px-8 mt-2">
        {/* Loading State */}
        {isLoading && (
          <div className="flex h-64 w-full flex-col items-center justify-center gap-4 rounded-[4px] border border-neutral-800 bg-[#171717]/30 animate-pulse">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-xs uppercase tracking-wide text-neutral-500">Sincronizando...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex h-64 w-full flex-col items-center justify-center gap-4 rounded-[4px] border border-rose-900/30 bg-rose-950/10">
            <AlertTriangle className="h-8 w-8 text-rose-500" />
            <div className="text-center">
              <h3 className="text-sm font-bold uppercase text-rose-500">Falha na conexão</h3>
              <p className="text-xs text-rose-500/70">Não foi possível carregar os dados.</p>
            </div>
            <Button variant="outline" onClick={() => window.location.reload()} className="border-rose-900/30 text-rose-500 hover:bg-rose-950/20">
              Tentar Novamente
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && flatCategories.length === 0 && !searchQuery && (
          <div className="flex h-96 w-full flex-col items-center justify-center gap-6 rounded-[4px] border border-dashed border-neutral-800 bg-[#171717]/20">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900 ring-1 ring-neutral-800">
              <Box className="h-8 w-8 text-neutral-600" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-300">
                Catálogo Vazio
              </h3>
              <p className="mt-1 max-w-xs text-xs text-neutral-500">
                Organize seu estoque criando estruturas de categorias.
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

        {/* No Results */}
        {!isLoading && !error && flatCategories.length === 0 && searchQuery && (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
             <Search className="h-12 w-12 mb-4 opacity-20" />
             <p className="text-sm">Nenhum resultado para "{searchQuery}"</p>
             <Button 
               variant="link" 
               onClick={() => setSearchQuery("")}
               className="text-blue-500 text-xs mt-2"
             >
               Limpar filtros
             </Button>
          </div>
        )}

        {/* Views */}
        {!isLoading && !error && flatCategories.length > 0 && (
          <div className="animate-in fade-in duration-500 slide-in-from-bottom-2">
            
            {viewMode === "tree" && (
              <div className="rounded-[4px] border border-neutral-800 bg-[#0A0A0A] overflow-hidden shadow-sm">
                {(categoryTree as CategoryTree[]).map((node) => renderTreeNode(node))}
              </div>
            )}

            {viewMode === "flat" && (
              <div className="space-y-1">
                {flatCategories.map((node) => renderFlatItem(node))}
              </div>
            )}
            
          </div>
        )}
      </main>

      {/* Modal - Create/Edit */}
      <ResponsiveModal
        open={isModalOpen}
        onOpenChange={closeModal}
        title={selectedCategory ? "Editar Categoria" : "Nova Categoria"}
        description={selectedCategory ? `ID: ${selectedCategory.id}` : "Defina a estrutura"}
        maxWidth="sm:max-w-[500px]"
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={closeModal}
              className="rounded-[4px] hover:bg-neutral-800 text-neutral-400"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="category-form"
              disabled={form.formState.isSubmitting}
              className="rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
            >
              {form.formState.isSubmitting ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-2 h-3.5 w-3.5" />}
              {selectedCategory ? "Salvar" : "Criar"}
            </Button>
          </>
        }
      >
        <Form {...form}>
          <form id="category-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Nome <span className="text-rose-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Eletrônicos"
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
                      <SelectItem value="root" className="text-sm font-medium border-b border-neutral-800 mb-1 pb-1">
                        <span className="text-blue-500 font-bold mr-2">●</span> RAIZ (Sem Pai)
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
                      placeholder="Opcional"
                      className="rounded-[4px] border-neutral-800 bg-neutral-900 text-sm resize-none focus:border-blue-600 focus:ring-0 min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-500" />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </ResponsiveModal>

      {/* Delete Dialog */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={closeDeleteDialog}>
        <AlertDialogContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-200 sm:max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-rose-500" />
              Excluir Categoria?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-500 text-sm">
              Você está prestes a remover <span className="text-white font-bold">{categoryToDelete?.name}</span>.
              <br/><br/>
              {categoryToDelete && flatCategories.find(c => c.id === categoryToDelete.id)?.children?.length && flatCategories.find(c => c.id === categoryToDelete.id)!.children.length > 0 ? (
                <span className="block p-3 bg-rose-950/20 border border-rose-900/30 rounded-[2px] text-rose-400 text-xs font-bold">
                  ⚠️ Esta categoria contém subcategorias que também serão afetadas.
                </span>
              ) : (
                "Esta ação não pode ser desfeita."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-[4px] border-neutral-800 bg-transparent text-neutral-400 hover:bg-neutral-800 hover:text-white">
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="rounded-[4px] bg-rose-600 text-white hover:bg-rose-700 border-none"
            >
              {isDeleting ? "Excluindo..." : "Sim, excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};