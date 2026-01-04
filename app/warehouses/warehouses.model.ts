import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { warehouseSchema, WarehouseFormData } from "./warehouses.schema";
import { api } from "@/lib/api";
import { toast } from "sonner";
import useSWR from "swr";
import {
  Warehouse,
  WarehousesResponse,
  CreateWarehouseResponse,
  UpdateWarehouseResponse,
  DeleteWarehouseResponse,
  SortConfig,
  StatusFilter,
} from "./warehouses.types";

export const useWarehousesModel = () => {
  // State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "name",
    direction: "asc",
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState<Warehouse | null>(null);
  const [isCheckingCode, setIsCheckingCode] = useState(false);

  // Fetch warehouses
  const { data, error, isLoading, mutate } = useSWR<WarehousesResponse>(
    "warehouses",
    async () => {
      return await api.get("warehouses").json<WarehousesResponse>();
    }
  );

  const warehouses = data?.data || [];

  // Form
  const form = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      address: "",
      phone: "",
      email: "",
      isActive: true,
    },
  });

  // Filtered and sorted warehouses
  const filteredAndSortedWarehouses = useMemo(() => {
    let filtered = warehouses;

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((w) => w.isActive);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((w) => !w.isActive);
    }

    // Search filter (by name or code)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (w) =>
          w.name.toLowerCase().includes(query) ||
          w.code.toLowerCase().includes(query)
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

      // String comparison
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [warehouses, searchQuery, statusFilter, sortConfig]);

  // Modal handlers
  const openCreateModal = () => {
    setSelectedWarehouse(null);
    form.reset({
      name: "",
      code: "",
      description: "",
      address: "",
      phone: "",
      email: "",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    form.reset({
      name: warehouse.name,
      code: warehouse.code,
      description: warehouse.description,
      address: warehouse.address,
      phone: warehouse.phone,
      email: warehouse.email,
      isActive: warehouse.isActive,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedWarehouse(null);
    form.reset({
      name: "",
      code: "",
      description: "",
      address: "",
      phone: "",
      email: "",
      isActive: true,
    });
  };

  // Sort handler
  const handleSort = (key: SortConfig["key"]) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Check if code is unique
  const checkCodeUniqueness = async (code: string) => {
    // If editing, don't check (code is the same)
    if (selectedWarehouse && selectedWarehouse.code === code) {
      return true;
    }

    // Check if code exists in current warehouses
    const codeExists = warehouses.some(
      (w) => w.code.toUpperCase() === code.toUpperCase()
    );

    return !codeExists;
  };

  // Submit handler
  const onSubmit = async (data: WarehouseFormData) => {
    try {
      // Check code uniqueness
      const isCodeUnique = await checkCodeUniqueness(data.code);
      if (!isCodeUnique) {
        form.setError("code", {
          message: "Este código já está em uso",
        });
        return;
      }

      if (selectedWarehouse) {
        // Update
        const response = await api
          .put(`warehouses/${selectedWarehouse.id}`, { json: data })
          .json<UpdateWarehouseResponse>();

        if (response.success) {
          toast.success(response.message || "Armazém atualizado com sucesso");
          mutate();
          closeModal();
        }
      } else {
        // Create
        const response = await api
          .post("warehouses", { json: data })
          .json<CreateWarehouseResponse>();

        if (response.success) {
          toast.success(response.message || "Armazém criado com sucesso");
          mutate();
          closeModal();
        }
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        "Erro ao salvar armazém. Tente novamente.";
      
      // Handle specific error cases
      if (err.response?.status === 400 && errorMessage.includes("código")) {
        form.setError("code", { message: errorMessage });
      } else {
        toast.error(errorMessage);
      }
    }
  };

  // Delete handlers
  const openDeleteDialog = (warehouse: Warehouse) => {
    setWarehouseToDelete(warehouse);
  };

  const closeDeleteDialog = () => {
    setWarehouseToDelete(null);
  };

  const confirmDelete = async () => {
    if (!warehouseToDelete) return;

    try {
      setIsDeleting(true);
      const response = await api
        .delete(`warehouses/${warehouseToDelete.id}`)
        .json<DeleteWarehouseResponse>();

      if (response.success) {
        toast.success(response.message || "Armazém deletado com sucesso");
        mutate();
        closeDeleteDialog();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Erro ao deletar armazém";
      
      // Check if deletion is blocked by stock
      if (err.response?.status === 400 && errorMessage.includes("stock")) {
        toast.error(
          `${errorMessage}. Desative o armazém ou transfira o estoque primeiro.`
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    // Data
    warehouses: filteredAndSortedWarehouses,
    isLoading,
    error,

    // Search and filter
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,

    // Sort
    sortConfig,
    handleSort,

    // Modal
    isModalOpen,
    selectedWarehouse,
    openCreateModal,
    openEditModal,
    closeModal,

    // Form
    form,
    onSubmit,
    isCheckingCode,

    // Delete
    warehouseToDelete,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
    isDeleting,
  };
};
