import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { warehouseSchema, WarehouseFormData } from "./warehouses.schema";
import { api } from "@/lib/api";
import { toast } from "sonner";
import useSWR from "swr";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
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
  // Warehouse selection hook
  const { warehouseId: selectedWarehouseId, setWarehouseId } = useSelectedWarehouse();

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
      code: "",
      name: "",
      address: "",
      city: "",
      state: "",
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
      code: "",
      name: "",
      address: "",
      city: "",
      state: "",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    form.reset({
      code: warehouse.code,
      name: warehouse.name,
      address: warehouse.address || "",
      city: warehouse.city,
      state: warehouse.state,
      isActive: warehouse.isActive,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedWarehouse(null);
    form.reset({
      code: "",
      name: "",
      address: "",
      city: "",
      state: "",
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

  // Warehouse selection handler
  const handleSelectWarehouse = (id: string) => {
    setWarehouseId(id);
    toast.success("Armazém selecionado");
  };

  // Submit handler
  const onSubmit = async (data: WarehouseFormData) => {
    try {

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
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage =
        error.response?.data?.message ||
        "Erro ao salvar armazém. Tente novamente.";

      toast.error(errorMessage);
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
    } catch (err) {
      const error = err as { response?: { status?: number; data?: { message?: string } } };
      const errorMessage = error.response?.data?.message || "Erro ao deletar armazém";

      // Check if deletion is blocked by stock
      if (error.response?.status === 400 && errorMessage.includes("stock")) {
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

    // Delete
    warehouseToDelete,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
    isDeleting,

    // Warehouse selection
    onSelectWarehouse: handleSelectWarehouse,
    selectedWarehouseId,
  };
};
