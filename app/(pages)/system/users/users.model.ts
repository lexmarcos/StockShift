import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema, CreateUserFormData, editUserSchema, EditUserFormData } from "./users.schema";
import { api } from "@/lib/api";
import { toast } from "sonner";
import useSWR from "swr";
import { useAuth } from "@/lib/contexts/auth-context";
import {
  User,
  UsersResponse,
  RolesResponse,
  WarehousesResponse,
  CreateUserResponse,
  UpdateUserResponse,
} from "./users.types";

const getMatchingRoleIds = (roles: { id: string; name: string }[], user: User): string[] =>
  roles.flatMap((role) => (user.roles.includes(role.name) ? [role.id] : []));

const getMatchingWarehouseIds = (
  warehouses: { id: string; name: string }[],
  user: User,
): string[] =>
  warehouses.flatMap((warehouse) =>
    user.warehouses.includes(warehouse.name) ? [warehouse.id] : [],
  );

export const useUsersModel = () => {
  const { isAdmin, user: currentUser, isLoading: isLoadingAdmin } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [createdUserEmail, setCreatedUserEmail] = useState<string | null>(null);
  const [editFormPopulated, setEditFormPopulated] = useState(false);

  // Fetch users
  const { data: usersData, error, isLoading: isLoadingSWR, mutate } = useSWR<UsersResponse>(
    "users",
    async () => {
      return await api.get("users").json<UsersResponse>();
    }
  );

  // Consider loading if SWR is loading OR auth is loading OR if we haven't received data yet and no error
  const isLoading = isLoadingSWR || isLoadingAdmin || (!usersData && !error);

  // Fetch roles for forms
  const { data: rolesData, isLoading: isLoadingRoles } = useSWR<RolesResponse>(
    isCreateModalOpen || isEditModalOpen ? "roles" : null,
    async () => {
      return await api.get("roles").json<RolesResponse>();
    }
  );

  // Fetch warehouses for forms
  const { data: warehousesData, isLoading: isLoadingWarehouses } = useSWR<WarehousesResponse>(
    isCreateModalOpen || isEditModalOpen ? "warehouses" : null,
    async () => {
      return await api.get("warehouses").json<WarehousesResponse>();
    }
  );

  const users = useMemo(() => usersData?.data ?? [], [usersData]);
  const roles = useMemo(() => rolesData?.data ?? [], [rolesData]);
  const warehouses = useMemo(
    () => (warehousesData?.data ?? []).filter((warehouse) => warehouse.isActive),
    [warehousesData],
  );

  // Filter users by search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;

    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // Create form
  const createForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: "",
      email: "",
      roleIds: [],
      warehouseIds: [],
    },
  });

  // Edit form
  const editForm = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      fullName: "",
      isActive: true,
      roleIds: [],
      warehouseIds: [],
    },
  });

  const openCreateModal = () => {
    createForm.reset({
      fullName: "",
      email: "",
      roleIds: [],
      warehouseIds: [],
    });
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    createForm.reset();
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditFormPopulated(false);
    setIsEditModalOpen(true);
  };

  // Populate edit form when roles and warehouses are loaded
  useEffect(() => {
    if (selectedUser && isEditModalOpen && roles.length > 0 && warehouses.length > 0 && !editFormPopulated) {
      const userRoleIds = getMatchingRoleIds(roles, selectedUser);
      const userWarehouseIds = getMatchingWarehouseIds(warehouses, selectedUser);

      editForm.reset({
        fullName: selectedUser.fullName,
        isActive: selectedUser.isActive,
        roleIds: userRoleIds,
        warehouseIds: userWarehouseIds,
      });
      setEditFormPopulated(true);
    }
  }, [
    selectedUser,
    isEditModalOpen,
    roles,
    warehouses,
    editFormPopulated,
    editForm,
  ]);

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
    editForm.reset();
  };

  const closePasswordModal = () => {
    setTemporaryPassword(null);
    setCreatedUserEmail(null);
  };

  const onCreateSubmit = async (data: CreateUserFormData) => {
    try {
      setIsSubmitting(true);

      const response = await api
        .post("users", { json: data })
        .json<CreateUserResponse>();

      if (response.success) {
        toast.success(response.message || "Usuário criado com sucesso");
        mutate();
        closeCreateModal();
        setTemporaryPassword(response.data.temporaryPassword);
        setCreatedUserEmail(response.data.email);
      }
    } catch (err) {
      const error = err as { message?: string };
      toast.error(error.message || "Erro ao criar usuário");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEditSubmit = async (data: EditUserFormData) => {
    if (!selectedUser) return;

    try {
      setIsSubmitting(true);

      const response = await api
        .put(`users/${selectedUser.id}`, { json: data })
        .json<UpdateUserResponse>();

      if (response.success) {
        toast.success(response.message || "Usuário atualizado com sucesso");
        mutate();
        closeEditModal();
      }
    } catch (err) {
      const error = err as { message?: string };
      toast.error(error.message || "Erro ao atualizar usuário");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserStatus = async (user: User) => {
    try {
      const userRoleIds = getMatchingRoleIds(roles, user);
      const userWarehouseIds = getMatchingWarehouseIds(warehouses, user);

      const response = await api
        .put(`users/${user.id}`, {
          json: {
            fullName: user.fullName,
            isActive: !user.isActive,
            roleIds: userRoleIds,
            warehouseIds: userWarehouseIds,
          },
        })
        .json<UpdateUserResponse>();

      if (response.success) {
        toast.success(user.isActive ? "Usuário desativado" : "Usuário ativado");
        mutate();
      }
    } catch (err) {
      const error = err as { message?: string };
      toast.error(error.message || "Erro ao alterar status do usuário");
    }
  };

  return {
    users: filteredUsers,
    isLoading,
    error: error || null,
    searchQuery,
    onSearchChange: setSearchQuery,
    isCreateModalOpen,
    openCreateModal,
    closeCreateModal,
    isEditModalOpen,
    selectedUser,
    openEditModal,
    closeEditModal,
    roles,
    warehouses,
    isLoadingRoles,
    isLoadingWarehouses,
    createForm,
    editForm,
    onCreateSubmit,
    onEditSubmit,
    isSubmitting,
    temporaryPassword,
    createdUserEmail,
    closePasswordModal,
    isAdmin,
    currentUserId: currentUser?.userId,
    toggleUserStatus,
    isLoadingAdmin,
  };
};
