"use client";

import {
  AlertTriangle,
  Box,
  ChevronDown,
  ChevronRight,
  Edit,
  Folder,
  FolderOpen,
  FolderTree,
  List,
  Loader2,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Plus,
  Search,
  Tag,
  Trash2,
} from "lucide-react";
import type { ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import { PermissionGate } from "@/components/permission-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CategoryFormData } from "./categories.schema";
import type {
  Category,
  CategoryTree,
  SortConfig,
  ViewMode,
} from "./categories.types";

interface CategoriesViewProps {
  categories: CategoryTree[] | CategoryTree[];
  categoryTree: CategoryTree[];
  flatCategories: CategoryTree[];
  isLoading: boolean;
  error: Error | null;
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

type CategoriesViewState = CategoriesViewProps;

const CATEGORY_DEPTH_BORDERS = [
  "border-blue-500",
  "border-emerald-500",
  "border-amber-500",
  "border-purple-500",
];

export const CategoriesView = (props: CategoriesViewProps) => {
  const viewState: CategoriesViewState = props;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 font-sans text-neutral-200">
      <CategoriesHeader viewState={viewState} />
      <CategoriesMain viewState={viewState} />
      <CategoryFormModal viewState={viewState} />
      <CategoryDeleteDialog viewState={viewState} />
    </div>
  );
};

function CategoriesHeader({ viewState }: { viewState: CategoriesViewState }) {
  const {
    flatCategories,
    openCreateModal,
    searchQuery,
    setSearchQuery,
    setViewMode,
    viewMode,
  } = viewState;

  return (
    <div className="relative z-30 border-b border-neutral-800 bg-[#0A0A0A]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0A0A0A]/60">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6 lg:px-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tighter text-white">
                Categorias
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                Organize os produtos por categoria
              </p>
            </div>
            <PermissionGate permission="categories:create">
              <Button
                onClick={openCreateModal}
                className="h-10 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)] hover:bg-blue-700 md:w-auto"
              >
                <Plus className="mr-2 size-4" />
                Nova Categoria
              </Button>
            </PermissionGate>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-neutral-500" />
              <Input
                placeholder="Buscar…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-[4px] border-neutral-800 bg-[#171717] pl-9 text-sm text-neutral-200 transition-all placeholder:text-neutral-600 hover:border-neutral-700 focus:border-blue-600 focus:ring-0"
              />
            </div>
            <CategoryViewToggle
              setViewMode={setViewMode}
              viewMode={viewMode}
            />
          </div>
        </div>
        {viewMode === "tree" && flatCategories.length > 0 && (
          <CategoryTreeControls viewState={viewState} />
        )}
      </div>
    </div>
  );
}

function CategoryViewToggle({
  setViewMode,
  viewMode,
}: {
  setViewMode: (mode: ViewMode) => void;
  viewMode: ViewMode;
}) {
  return (
    <div className="flex h-10 shrink-0 rounded-[4px] border border-neutral-800 bg-[#171717] p-0.5">
      <CategoryViewToggleButton
        icon={<FolderTree className="size-4" />}
        label="Visualização em Árvore"
        isActive={viewMode === "tree"}
        onClick={() => setViewMode("tree")}
      />
      <CategoryViewToggleButton
        icon={<List className="size-4" />}
        label="Visualização em Lista"
        isActive={viewMode === "flat"}
        onClick={() => setViewMode("flat")}
      />
    </div>
  );
}

function CategoryViewToggleButton({
  icon,
  isActive,
  label,
  onClick,
}: {
  icon: ReactNode;
  isActive: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      title={label}
      className={cn(
        "size-9 rounded-[2px]",
        isActive
          ? "bg-neutral-800 text-white shadow-sm"
          : "text-neutral-500 hover:text-neutral-300",
      )}
    >
      {icon}
    </Button>
  );
}

function CategoryTreeControls({
  viewState,
}: {
  viewState: CategoriesViewState;
}) {
  const { collapseAll, expandAll } = viewState;

  return (
    <div className="mt-2 flex items-center gap-2 border-t border-neutral-800/50 pt-2">
      <button
        onClick={expandAll}
        className="flex items-center gap-1 text-[10px] font-bold uppercase text-neutral-500 transition-colors hover:text-blue-500"
      >
        <Maximize2 className="size-3" /> Expandir Tudo
      </button>
      <span className="text-neutral-800">|</span>
      <button
        onClick={collapseAll}
        className="flex items-center gap-1 text-[10px] font-bold uppercase text-neutral-500 transition-colors hover:text-neutral-300"
      >
        <Minimize2 className="size-3" /> Recolher Tudo
      </button>
    </div>
  );
}

function CategoriesMain({ viewState }: { viewState: CategoriesViewState }) {
  const { error, flatCategories, isLoading, searchQuery, viewMode } = viewState;

  return (
    <main className="mx-auto mt-2 w-full max-w-7xl p-4 md:px-6 lg:px-8">
      {isLoading && <CategoriesLoadingState />}
      {error && <CategoriesErrorState />}
      {!isLoading && !error && flatCategories.length === 0 && !searchQuery && (
        <CategoriesEmptyState viewState={viewState} />
      )}
      {!isLoading && !error && flatCategories.length === 0 && searchQuery && (
        <CategoriesNoResults viewState={viewState} />
      )}
      {!isLoading && !error && flatCategories.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {viewMode === "tree" ? (
            <CategoryTreeView viewState={viewState} />
          ) : (
            <CategoryFlatView viewState={viewState} />
          )}
        </div>
      )}
    </main>
  );
}

function CategoriesLoadingState() {
  return (
    <div className="flex h-64 w-full animate-pulse flex-col items-center justify-center gap-4 rounded-[4px] border border-neutral-800 bg-[#171717]/30">
      <Loader2 className="size-8 animate-spin text-blue-600" />
      <span className="text-xs uppercase tracking-wide text-neutral-500">
        Sincronizando…
      </span>
    </div>
  );
}

function CategoriesErrorState() {
  return (
    <div className="flex h-64 w-full flex-col items-center justify-center gap-4 rounded-[4px] border border-rose-900/30 bg-rose-950/10">
      <AlertTriangle className="size-8 text-rose-500" />
      <div className="text-center">
        <h3 className="text-sm font-semibold uppercase text-rose-500">
          Falha na conexão
        </h3>
        <p className="text-xs text-rose-500/70">
          Não foi possível carregar os dados.
        </p>
      </div>
      <Button
        variant="outline"
        onClick={() => window.location.reload()}
        className="border-rose-900/30 text-rose-500 hover:bg-neutral-800"
      >
        Tentar Novamente
      </Button>
    </div>
  );
}

function CategoriesEmptyState({
  viewState,
}: {
  viewState: CategoriesViewState;
}) {
  return (
    <div className="flex h-96 w-full flex-col items-center justify-center gap-6 rounded-[4px] border border-dashed border-neutral-800 bg-[#171717]/20">
      <div className="flex size-20 items-center justify-center rounded-[4px] bg-neutral-900 ring-1 ring-neutral-800">
        <Box className="size-8 text-neutral-600" />
      </div>
      <div className="text-center">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-300">
          Catálogo Vazio
        </h3>
        <p className="mt-1 max-w-xs text-xs text-neutral-500">
          Organize seu estoque criando estruturas de categorias.
        </p>
      </div>
      <PermissionGate permission="categories:create">
        <Button
          onClick={viewState.openCreateModal}
          className="rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
        >
          <Plus className="mr-2 size-3.5" />
          Criar Primeira Categoria
        </Button>
      </PermissionGate>
    </div>
  );
}

function CategoriesNoResults({
  viewState,
}: {
  viewState: CategoriesViewState;
}) {
  const { searchQuery, setSearchQuery } = viewState;

  return (
    <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
      <Search className="mb-4 size-12 opacity-20" />
      <p className="text-sm">Nenhum resultado para &quot;{searchQuery}&quot;</p>
      <Button
        variant="link"
        onClick={() => setSearchQuery("")}
        className="mt-2 text-xs text-blue-500"
      >
        Limpar filtros
      </Button>
    </div>
  );
}

function CategoryTreeView({ viewState }: { viewState: CategoriesViewState }) {
  return (
    <div className="overflow-hidden rounded-[4px] border border-neutral-800 bg-[#0A0A0A] shadow-sm">
      {viewState.categoryTree.map((node) => (
        <CategoryTreeNode key={node.id} node={node} viewState={viewState} />
      ))}
    </div>
  );
}

function CategoryTreeNode({
  node,
  viewState,
}: {
  node: CategoryTree;
  viewState: CategoriesViewState;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = viewState.expandedNodes.has(node.id);
  const Icon = isExpanded ? FolderOpen : Folder;
  const activeBorder = CATEGORY_DEPTH_BORDERS[
    node.depth % CATEGORY_DEPTH_BORDERS.length
  ];

  return (
    <div className="select-none">
      <div
        className={cn(
          "group relative mb-[1px] flex items-center gap-3 bg-[#171717] px-3 py-3 transition-all md:px-4",
          "border-l-[4px] border-neutral-800 hover:bg-[#1f1f1f]",
          isExpanded ? activeBorder : "hover:border-neutral-600",
        )}
        style={{ paddingLeft: `${node.depth * 16 + 12}px` }}
      >
        <CategoryNodeGuide node={node} />
        <CategoryExpandButton
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          nodeId={node.id}
          toggleNode={viewState.toggleNode}
        />
        <Icon
          className={cn(
            "size-5 shrink-0 transition-colors",
            isExpanded
              ? "text-blue-500"
              : "text-neutral-500 group-hover:text-neutral-300",
          )}
        />
        <CategoryNodeTitle
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          node={node}
          toggleNode={viewState.toggleNode}
        />
        <CategoryNodeActions node={node} viewState={viewState} />
      </div>
      {hasChildren && isExpanded && (
        <div className="relative">
          <div
            className="absolute top-0 bottom-0 w-px bg-neutral-800/50"
            style={{ left: `${node.depth * 16 + 15}px` }}
          />
          {node.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              node={child}
              viewState={viewState}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryNodeGuide({ node }: { node: CategoryTree }) {
  if (node.depth === 0) return null;

  return (
    <div
      className="absolute top-0 bottom-0 left-0 w-px bg-neutral-800"
      style={{ left: `${node.depth * 16}px` }}
    />
  );
}

function CategoryExpandButton({
  hasChildren,
  isExpanded,
  nodeId,
  toggleNode,
}: {
  hasChildren: boolean;
  isExpanded: boolean;
  nodeId: string;
  toggleNode: (nodeId: string) => void;
}) {
  return (
    <button
      onClick={(event) => {
        event.stopPropagation();
        if (hasChildren) toggleNode(nodeId);
      }}
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-[4px] border border-transparent transition-all md:size-8",
        hasChildren
          ? "cursor-pointer border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600 hover:text-white"
          : "invisible",
      )}
      disabled={!hasChildren}
      aria-label={isExpanded ? "Recolher" : "Expandir"}
    >
      {hasChildren &&
        (isExpanded ? (
          <ChevronDown className="size-4" />
        ) : (
          <ChevronRight className="size-4" />
        ))}
    </button>
  );
}

function CategoryNodeTitle({
  hasChildren,
  isExpanded,
  node,
  toggleNode,
}: {
  hasChildren: boolean;
  isExpanded: boolean;
  node: CategoryTree;
  toggleNode: (nodeId: string) => void;
}) {
  return (
    <button
      type="button"
      disabled={!hasChildren}
      className={cn(
        "flex min-w-0 flex-1 flex-col justify-center text-left",
        hasChildren ? "cursor-pointer" : "cursor-default",
      )}
      onClick={() => toggleNode(node.id)}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "truncate text-sm font-medium transition-colors",
            isExpanded ? "text-white" : "text-neutral-300 group-hover:text-white",
          )}
        >
          {node.name}
        </span>
        {hasChildren && (
          <Badge
            variant="outline"
            className="hidden h-5 rounded-[2px] border-neutral-700 bg-neutral-800 px-1.5 text-[9px] font-bold text-neutral-400 sm:flex"
          >
            {node.children.length}
          </Badge>
        )}
      </div>
    </button>
  );
}

function CategoryNodeActions({
  node,
  viewState,
}: {
  node: CategoryTree;
  viewState: CategoriesViewState;
}) {
  return (
    <div className="flex items-center gap-1">
      <CategoryDesktopActions node={node} viewState={viewState} />
      <CategoryMobileActions node={node} viewState={viewState} />
    </div>
  );
}

function CategoryDesktopActions({
  node,
  viewState,
}: {
  node: CategoryTree;
  viewState: CategoriesViewState;
}) {
  return (
    <div className="hidden items-center gap-1 transition-opacity md:flex">
      <PermissionGate permission="categories:update">
        <Button
          variant="ghost"
          size="icon"
          onClick={(event) => {
            event.stopPropagation();
            viewState.openEditModal(node);
          }}
          className="size-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white"
        >
          <Edit className="size-4" />
        </Button>
      </PermissionGate>
      <PermissionGate permission="categories:delete">
        <Button
          variant="ghost"
          size="icon"
          onClick={(event) => {
            event.stopPropagation();
            viewState.openDeleteDialog(node);
          }}
          className="size-8 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-rose-500"
        >
          <Trash2 className="size-4" />
        </Button>
      </PermissionGate>
    </div>
  );
}

function CategoryMobileActions({
  node,
  viewState,
}: {
  node: CategoryTree;
  viewState: CategoriesViewState;
}) {
  return (
    <div className="md:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white focus:opacity-100"
          >
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Ações</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48 rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-200"
        >
          <DropdownMenuLabel className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Opções
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-neutral-800" />
          <CategoryMenuItems node={node} viewState={viewState} />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function CategoryMenuItems({
  node,
  viewState,
}: {
  node: CategoryTree;
  viewState: CategoriesViewState;
}) {
  return (
    <>
      <PermissionGate permission="categories:update">
        <DropdownMenuItem
          onClick={() => viewState.openEditModal(node)}
          className="cursor-pointer focus:bg-neutral-800 focus:text-white"
        >
          <Edit className="mr-2 size-3.5" />
          Editar
        </DropdownMenuItem>
      </PermissionGate>
      <PermissionGate permission="categories:delete">
        <DropdownMenuItem
          onClick={() => viewState.openDeleteDialog(node)}
          className="cursor-pointer text-rose-500 focus:bg-rose-950/20 focus:text-rose-400"
        >
          <Trash2 className="mr-2 size-3.5" />
          Excluir
        </DropdownMenuItem>
      </PermissionGate>
    </>
  );
}

function CategoryFlatView({ viewState }: { viewState: CategoriesViewState }) {
  return (
    <div className="space-y-1">
      {viewState.flatCategories.map((node) => (
        <CategoryFlatItem key={node.id} node={node} viewState={viewState} />
      ))}
    </div>
  );
}

function CategoryFlatItem({
  node,
  viewState,
}: {
  node: CategoryTree;
  viewState: CategoriesViewState;
}) {
  return (
    <div className="group relative mb-2 flex items-center gap-4 rounded-[4px] border border-neutral-800 bg-[#171717] p-4 transition-all hover:border-neutral-700">
      <div className="absolute top-0 bottom-0 left-0 w-1 rounded-l-[4px] bg-neutral-800 transition-colors group-hover:bg-blue-600" />
      <div className="flex size-10 shrink-0 items-center justify-center rounded-[4px] border border-neutral-800 bg-neutral-900 transition-colors group-hover:border-neutral-700">
        <Tag className="size-4 text-neutral-500 group-hover:text-blue-500" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-bold text-neutral-200 group-hover:text-white">
            {node.name}
          </span>
          <CategoryParentBadge node={node} />
        </div>
        {node.description && (
          <p className="mt-1 truncate text-xs text-neutral-500">
            {node.description}
          </p>
        )}
      </div>
      <CategoryChildrenStats node={node} />
      <CategoryNodeActions node={node} viewState={viewState} />
    </div>
  );
}

function CategoryParentBadge({ node }: { node: CategoryTree }) {
  if (!node.parentCategoryName) return null;

  return (
    <Badge
      variant="outline"
      className="rounded-[2px] border-neutral-800 bg-neutral-900/50 font-mono text-[9px] text-neutral-500"
    >
      <span className="mr-1 text-neutral-600">↳</span> {node.parentCategoryName}
    </Badge>
  );
}

function CategoryChildrenStats({ node }: { node: CategoryTree }) {
  if (node.children.length === 0) return null;

  return (
    <div className="hidden flex-col items-end gap-1 sm:flex">
      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
        Subcategorias
      </span>
      <Badge className="rounded-[2px] border-neutral-700 bg-neutral-800 px-2 text-neutral-300 hover:bg-neutral-700">
        {node.children.length}
      </Badge>
    </div>
  );
}

function CategoryFormModal({
  viewState,
}: {
  viewState: CategoriesViewState;
}) {
  const { closeModal, form, isModalOpen, onSubmit, selectedCategory } = viewState;

  return (
    <ResponsiveModal
      open={isModalOpen}
      onOpenChange={closeModal}
      title={selectedCategory ? "Editar Categoria" : "Nova Categoria"}
      description={
        selectedCategory ? `ID: ${selectedCategory.id}` : "Defina a estrutura"
      }
      maxWidth="sm:max-w-[500px]"
      footer={<CategoryFormFooter viewState={viewState} />}
    >
      <Form {...form}>
        <form
          id="category-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 py-2"
        >
          <CategoryNameField form={form} />
          <CategoryParentField viewState={viewState} />
          <CategoryDescriptionField form={form} />
        </form>
      </Form>
    </ResponsiveModal>
  );
}

function CategoryFormFooter({
  viewState,
}: {
  viewState: CategoriesViewState;
}) {
  const { closeModal, form, selectedCategory } = viewState;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={closeModal}
        className="rounded-[4px] text-neutral-400 hover:bg-neutral-800"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        form="category-form"
        disabled={form.formState.isSubmitting}
        className="rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
      >
        {form.formState.isSubmitting ? (
          <Loader2 className="mr-2 size-3.5 animate-spin" />
        ) : (
          <Plus className="mr-2 size-3.5" />
        )}
        {selectedCategory ? "Salvar" : "Criar"}
      </Button>
    </>
  );
}

function CategoryNameField({
  form,
}: {
  form: UseFormReturn<CategoryFormData>;
}) {
  return (
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
  );
}

function CategoryParentField({
  viewState,
}: {
  viewState: CategoriesViewState;
}) {
  const { allCategories, form, selectedCategory } = viewState;

  return (
    <FormField
      control={form.control}
      name="parentCategoryId"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Categoria Pai
          </FormLabel>
          <Select
            onValueChange={(value) =>
              field.onChange(value === "root" ? null : value)
            }
            value={field.value || "root"}
          >
            <FormControl>
              <SelectTrigger className="w-full rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:ring-0 md:w-auto">
                <SelectValue placeholder="Selecione…" />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
              <SelectItem
                value="root"
                className="mb-1 border-b border-neutral-800 pb-1 text-sm font-medium"
              >
                <span className="mr-2 font-bold text-blue-500">●</span> RAIZ
                (Sem Pai)
              </SelectItem>
              {allCategories.flatMap((category) =>
                category.id === selectedCategory?.id
                  ? []
                  : [
                      <SelectItem
                        key={category.id}
                        value={category.id}
                        className="text-sm"
                      >
                        {category.name}
                      </SelectItem>,
                    ],
              )}
            </SelectContent>
          </Select>
          <FormMessage className="text-xs text-rose-500" />
        </FormItem>
      )}
    />
  );
}

function CategoryDescriptionField({
  form,
}: {
  form: UseFormReturn<CategoryFormData>;
}) {
  return (
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
              className="min-h-[80px] resize-none rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
              {...field}
            />
          </FormControl>
          <FormMessage className="text-xs text-rose-500" />
        </FormItem>
      )}
    />
  );
}

function CategoryDeleteDialog({
  viewState,
}: {
  viewState: CategoriesViewState;
}) {
  const {
    categoryToDelete,
    closeDeleteDialog,
    confirmDelete,
    flatCategories,
    isDeleting,
  } = viewState;
  const categoryTreeMatch = flatCategories.find(
    (category) => category.id === categoryToDelete?.id,
  );
  const categoryToDeleteHasChildren =
    (categoryTreeMatch?.children.length ?? 0) > 0;

  return (
    <ResponsiveModal
      open={!!categoryToDelete}
      onOpenChange={closeDeleteDialog}
      title="Excluir Categoria?"
      description={`Você está prestes a remover ${categoryToDelete?.name}.`}
      maxWidth="sm:max-w-[400px]"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={closeDeleteDialog}
            className="rounded-[4px] border-neutral-800 bg-transparent text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            Voltar
          </Button>
          <Button
            onClick={confirmDelete}
            disabled={isDeleting}
            className="rounded-[4px] border-none bg-rose-600 text-white hover:bg-rose-700"
          >
            {isDeleting ? "Excluindo…" : "Sim, excluir"}
          </Button>
        </>
      }
    >
      <div className="py-2 text-sm text-neutral-500">
        {categoryToDeleteHasChildren ? (
          <div className="flex items-center rounded-[2px] border border-rose-900/30 bg-rose-950/20 p-3 text-xs font-bold text-rose-400">
            <AlertTriangle className="mr-2 size-4 shrink-0" />
            Esta categoria contém subcategorias que também serão afetadas.
          </div>
        ) : (
          "Esta ação não pode ser desfeita."
        )}
      </div>
    </ResponsiveModal>
  );
}
