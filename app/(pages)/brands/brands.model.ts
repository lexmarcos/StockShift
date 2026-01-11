import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { brandSchema, BrandFormData } from "./brands.schema";
import { api } from "@/lib/api";
import { toast } from "sonner";
import useSWR from "swr";
import {
  BrandsResponse,
  CreateBrandResponse,
  UpdateBrandResponse,
  DeleteBrandResponse,
  Brand,
  SortConfig,
} from "./brands.types";

export const useBrandsModel = () => {
  // State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "name",
    direction: "asc",
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);

  // Fetch brands
  const { data, error, isLoading, mutate } = useSWR<BrandsResponse>(
    "brands",
    async () => {
      return await api.get("brands").json<BrandsResponse>();
    }
  );

  const brands = data?.data || [];

  // Form
  const form = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: "",
      logoUrl: "",
    },
  });

  // Filtered and sorted brands
  const filteredAndSortedBrands = useMemo(() => {
    let filtered = brands;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((brand) =>
        brand.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (sortConfig.key === "createdAt") {
        const aDate = new Date(aValue).getTime();
        const bDate = new Date(bValue).getTime();
        return sortConfig.direction === "asc" ? aDate - bDate : bDate - aDate;
      }

      // String comparison for name
      const comparison = aValue.localeCompare(bValue);
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [brands, searchQuery, sortConfig]);

  // Modal handlers
  const openCreateModal = () => {
    setSelectedBrand(null);
    form.reset({ name: "", logoUrl: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (brand: Brand) => {
    setSelectedBrand(brand);
    form.reset({
      name: brand.name,
      logoUrl: brand.logoUrl || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBrand(null);
    form.reset({ name: "", logoUrl: "" });
  };

  // Sort handler
  const handleSort = (key: SortConfig["key"]) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // CRUD operations
  const onSubmit = async (data: BrandFormData) => {
    try {
      const payload = {
        name: data.name,
        logoUrl: data.logoUrl || undefined,
      };

      if (selectedBrand) {
        // Update
        const response = await api
          .put(`brands/${selectedBrand.id}`, { json: payload })
          .json<UpdateBrandResponse>();

        if (response.success) {
          toast.success("Marca atualizada com sucesso!");
          mutate();
          closeModal();
        }
      } else {
        // Create
        const response = await api
          .post("brands", { json: payload })
          .json<CreateBrandResponse>();

        if (response.success) {
          toast.success("Marca criada com sucesso!");
          mutate();
          closeModal();
        }
      }
    } catch (error: any) {
      console.error("Erro ao salvar marca:", error);

      // Handle specific errors
      if (error.response) {
        const errorData = await error.response.json();
        if (errorData.message?.includes("já existe")) {
          form.setError("name", {
            message: "Já existe uma marca com este nome",
          });
        } else {
          toast.error(errorData.message || "Erro ao salvar marca");
        }
      } else {
        toast.error("Erro de conexão. Tente novamente.");
      }
    }
  };

  const openDeleteDialog = (brand: Brand) => {
    setBrandToDelete(brand);
  };

  const closeDeleteDialog = () => {
    setBrandToDelete(null);
  };

  const confirmDelete = async () => {
    if (!brandToDelete) return;

    setIsDeleting(true);
    try {
      const response = await api
        .delete(`brands/${brandToDelete.id}`)
        .json<DeleteBrandResponse>();

      if (response.success) {
        toast.success("Marca deletada com sucesso!");
        mutate();
        closeDeleteDialog();
      }
    } catch (error: any) {
      console.error("Erro ao deletar marca:", error);

      if (error.response) {
        const errorData = await error.response.json();
        if (errorData.message?.includes("produtos vinculados")) {
          toast.error(
            "Esta marca possui produtos. Remova-os primeiro."
          );
        } else {
          toast.error(errorData.message || "Erro ao deletar marca");
        }
      } else {
        toast.error("Erro de conexão. Tente novamente.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    // Data
    brands: filteredAndSortedBrands,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    sortConfig,
    handleSort,

    // Modal
    isModalOpen,
    selectedBrand,
    openCreateModal,
    openEditModal,
    closeModal,

    // Form
    form,
    onSubmit,

    // Delete
    brandToDelete,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
    isDeleting,
  };
};
