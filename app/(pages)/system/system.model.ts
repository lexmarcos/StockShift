// app/(pages)/system/system.model.ts

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import useSWR from "swr";
import { useAuth } from "@/lib/contexts/auth-context";
import {
  createUserSchema,
  updateUserSchema,
  CreateUserFormData,
  UpdateUserFormData,
} from "./system.schema";
import {
  SystemUser,
  Role,
  UsersResponse,
  RolesResponse,
  SortConfig,
} from "./system.types";
import { MOCK_USERS, MOCK_ROLES, mockDelay } from "./system.mocks";

// Mock fetchers - replace with real API calls when backend is ready
const fetchUsers = async (): Promise<UsersResponse> => {
  await mockDelay();
  return { success: true, message: null, data: MOCK_USERS };
};

const fetchRoles = async (): Promise<RolesResponse> => {
  await mockDelay(300);
  return { success: true, message: null, data: MOCK_ROLES };
};

export const useSystemModel = () => {
  const router = useRouter();
  const { isAdmin, isLoading: isAuthLoading } = useAuth();

  // Redirect non-admin users
  useEffect(() => {
    if (!isAuthLoading && !isAdmin) {
      router.push("/dashboard");
    }
  }, [isAuthLoading, isAdmin, router]);

  // State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "fullName",
    direction: "asc",
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<SystemUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch users
  const {
    data: usersData,
    error: usersError,
    isLoading: isUsersLoading,
    mutate: mutateUsers,
  } = useSWR<UsersResponse>("users", fetchUsers);

  // Fetch roles
  const { data: rolesData, isLoading: isRolesLoading } = useSWR<RolesResponse>(
    "roles",
    fetchRoles
  );

  // Fetch warehouses - reuse existing endpoint
  const { data: warehousesData } = useSWR("warehouses", async () => {
    // Mock warehouses for now
    await mockDelay(200);
    return {
      success: true,
      data: [
        { id: "wh-1", name: "Matriz" },
        { id: "wh-2", name: "Filial Centro" },
        { id: "wh-3", name: "Filial Sul" },
      ],
    };
  });

  const users = usersData?.data || [];
  const roles = rolesData?.data || [];
  const warehouses = warehousesData?.data || [];

  // Create form
  const createForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      roleIds: [],
      warehouseId: null,
    },
  });

  // Update form
  const updateForm = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      fullName: "",
      roleIds: [],
      warehouseId: null,
      isActive: true,
    },
  });

  // Filtered and sorted users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.fullName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (sortConfig.key === "createdAt") {
        const aDate = new Date(aValue).getTime();
        const bDate = new Date(bValue).getTime();
        return sortConfig.direction === "asc" ? aDate - bDate : bDate - aDate;
      }

      const comparison = aValue.localeCompare(bValue);
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [users, searchQuery, sortConfig]);

  // Modal handlers
  const openCreateModal = () => {
    setSelectedUser(null);
    createForm.reset({
      fullName: "",
      email: "",
      password: "",
      roleIds: [],
      warehouseId: null,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: SystemUser) => {
    setSelectedUser(user);
    updateForm.reset({
      fullName: user.fullName,
      roleIds: user.roles.map((r) => r.id),
      warehouseId: user.warehouseId,
      isActive: user.isActive,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    createForm.reset();
    updateForm.reset();
  };

  // Sort handler
  const handleSort = (key: SortConfig["key"]) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Create user
  const onCreateSubmit = async (data: CreateUserFormData) => {
    setIsSubmitting(true);
    try {
      await mockDelay();
      // Mock: In real implementation, call API
      toast.success("Usuário criado com sucesso!");
      mutateUsers();
      closeModal();
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      toast.error("Erro ao criar usuário");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update user
  const onUpdateSubmit = async (data: UpdateUserFormData) => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      await mockDelay();
      // Mock: In real implementation, call API
      toast.success("Usuário atualizado com sucesso!");
      mutateUsers();
      closeModal();
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      toast.error("Erro ao atualizar usuário");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete handlers
  const openDeleteDialog = (user: SystemUser) => {
    setUserToDelete(user);
  };

  const closeDeleteDialog = () => {
    setUserToDelete(null);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      await mockDelay();
      // Mock: In real implementation, call API
      toast.success("Usuário desativado com sucesso!");
      mutateUsers();
      closeDeleteDialog();
    } catch (error) {
      console.error("Erro ao desativar usuário:", error);
      toast.error("Erro ao desativar usuário");
    } finally {
      setIsDeleting(false);
    }
  };

  const isLoading = isAuthLoading || isUsersLoading;

  return {
    // Auth
    isAdmin,
    isAuthLoading,

    // Data
    users: filteredAndSortedUsers,
    roles,
    warehouses,
    isLoading,
    isRolesLoading,
    error: usersError,
    searchQuery,
    setSearchQuery,
    sortConfig,
    handleSort,

    // Modal
    isModalOpen,
    selectedUser,
    openCreateModal,
    openEditModal,
    closeModal,

    // Forms
    createForm,
    updateForm,
    onCreateSubmit,
    onUpdateSubmit,
    isSubmitting,

    // Delete
    userToDelete,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
    isDeleting,
  };
};
