import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema, CategoryFormData } from "./categories.schema";
import { api } from "@/lib/api";
import { toast } from "sonner";
import useSWR from "swr";
import {
  Category,
  CategoryTree,
  CategoriesResponse,
  CreateCategoryResponse,
  UpdateCategoryResponse,
  DeleteCategoryResponse,
  SortConfig,
  ViewMode,
} from "./categories.types";

export const useCategoriesModel = () => {
  // State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "name",
    direction: "asc",
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Fetch categories
  const { data, error, isLoading, mutate } = useSWR<CategoriesResponse>(
    "categories",
    async () => {
      return await api.get("categories").json<CategoriesResponse>();
    }
  );

  const categories = data?.data || [];

  // Form
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      parentCategoryId: null,
      attributesSchema: {},
    },
  });

  // Build category tree
  const buildTree = (
    categories: Category[],
    parentCategoryId: string | null = null,
    depth: number = 0
  ): CategoryTree[] => {
    return categories
      .filter((cat) => cat.parentCategoryId === parentCategoryId)
      .map((cat) => ({
        ...cat,
        depth,
        children: buildTree(categories, cat.id, depth + 1),
        productCount: 0,
      }))
      .sort((a, b) => {
        const comparison = a.name.localeCompare(b.name);
        return sortConfig.direction === "asc" ? comparison : -comparison;
      });
  };

  const categoryTree = useMemo(() => buildTree(categories), [categories, sortConfig]);

  // Flatten tree for flat view
  const flattenTree = (nodes: CategoryTree[]): CategoryTree[] => {
    return nodes.reduce<CategoryTree[]>((acc, node) => {
      acc.push(node);
      if (node.children.length > 0) {
        acc.push(...flattenTree(node.children));
      }
      return acc;
    }, []);
  };

  const flatCategories = useMemo(() => flattenTree(categoryTree), [categoryTree]);

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return viewMode === "tree" ? categoryTree : flatCategories;
    }

    const query = searchQuery.toLowerCase();
    const filtered = flatCategories.filter((cat) =>
      cat.name.toLowerCase().includes(query)
    );

    if (viewMode === "tree") {
      // For tree view, rebuild tree with filtered categories
      const filteredIds = new Set(filtered.map((c) => c.id));
      
      // Include parent categories of matched items
      const includeParents = (cat: Category): boolean => {
        if (!cat.parentCategoryId) return true;
        const parent = categories.find((c) => c.id === cat.parentCategoryId);
        return parent ? includeParents(parent) : false;
      };

      const relevantCategories = categories.filter(
        (cat) => filteredIds.has(cat.id) || includeParents(cat)
      );

      return buildTree(relevantCategories);
    }

    return filtered;
  }, [categories, categoryTree, flatCategories, searchQuery, viewMode]);

  // Modal handlers
  const openCreateModal = () => {
    setSelectedCategory(null);
    form.reset({
      name: "",
      description: "",
      parentCategoryId: null,
      attributesSchema: {},
    });
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    form.reset({
      name: category.name,
      description: category.description || "",
      parentCategoryId: category.parentCategoryId,
      attributesSchema: category.attributesSchema || {},
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
    form.reset();
  };

  // Submit handler
  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (selectedCategory) {
        // Update
        const response = await api
          .put(`categories/${selectedCategory.id}`, { json: data })
          .json<UpdateCategoryResponse>();

        if (response.success) {
          toast.success(response.message);
          mutate();
          closeModal();
        }
      } else {
        // Create
        const response = await api
          .post("categories", { json: data })
          .json<CreateCategoryResponse>();

        if (response.success) {
          toast.success(response.message);
          mutate();
          closeModal();
        }
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        selectedCategory
          ? "Erro ao atualizar categoria"
          : "Erro ao criar categoria";
      toast.error(errorMessage);
    }
  };

  // Delete handlers
  const openDeleteDialog = (category: Category) => {
    setCategoryToDelete(category);
  };

  const closeDeleteDialog = () => {
    setCategoryToDelete(null);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    try {
      const response = await api
        .delete(`categories/${categoryToDelete.id}`)
        .json<DeleteCategoryResponse>();

      if (response.success) {
        toast.success(response.message);
        mutate();
        closeDeleteDialog();
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || "Erro ao deletar categoria";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  // Sort handler
  const handleSort = (key: SortConfig["key"]) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Expand/collapse handlers
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = flatCategories.map((c) => c.id);
    setExpandedNodes(new Set(allIds));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  return {
    categories: filteredCategories,
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
    allCategories: categories,
  };
};
