import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { roleFormSchema, RoleFormData } from "./roles.schema";
import { api } from "@/lib/api";
import { toast } from "sonner";
import useSWR from "swr";
import { useAuth } from "@/lib/contexts/auth-context";
import {
  Role,
  RolesResponse,
  RoleResponse,
  PermissionsResponse,
  DeleteRoleResponse,
} from "./roles.types";
import {
  groupPermissionsByResource,
} from "./roles-permissions";

export const useRolesModel = () => {
  const { isAdmin, isLoading: isLoadingAdmin } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editFormPopulated, setEditFormPopulated] = useState(false);

  // Fetch roles
  const {
    data: rolesData,
    error,
    isLoading: isLoadingSWR,
    mutate,
  } = useSWR<RolesResponse>("roles", async () => {
    return await api.get("roles").json<RolesResponse>();
  });

  // Consider loading if SWR is loading OR if we haven't received data yet and no error
  const isLoading = isLoadingSWR || isLoadingAdmin || (!rolesData && !error);

  // Fetch all permissions for forms
  const { data: permissionsData, isLoading: isLoadingPermissions } =
    useSWR<PermissionsResponse>(
      isCreateModalOpen || isEditModalOpen ? "permissions" : null,
      async () => {
        return await api.get("permissions").json<PermissionsResponse>();
      },
    );

  const roles = useMemo(() => rolesData?.data || [], [rolesData?.data]);
  const permissions = useMemo(
    () => permissionsData?.data || [],
    [permissionsData?.data],
  );

  // Filter roles by search query
  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return roles;

    const query = searchQuery.toLowerCase();
    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(query) ||
        role.description?.toLowerCase().includes(query),
    );
  }, [roles, searchQuery]);

  const groupedPermissions = useMemo(
    () => groupPermissionsByResource(permissions),
    [permissions],
  );

  // Create form
  const createForm = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      permissionIds: [],
    },
  });

  // Edit form
  const editForm = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      permissionIds: [],
    },
  });

  const openCreateModal = () => {
    createForm.reset({
      name: "",
      description: "",
      permissionIds: [],
    });
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    createForm.reset();
  };

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setEditFormPopulated(false);
    setIsEditModalOpen(true);
  };

  // Populate edit form when permissions are loaded
  useEffect(() => {
    if (
      selectedRole &&
      isEditModalOpen &&
      permissions.length > 0 &&
      !editFormPopulated
    ) {
      editForm.reset({
        name: selectedRole.name,
        description: selectedRole.description || "",
        permissionIds: selectedRole.permissions.map((p) => p.id),
      });
      setEditFormPopulated(true);
    }
  }, [
    selectedRole,
    isEditModalOpen,
    permissions,
    editFormPopulated,
    editForm,
  ]);

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedRole(null);
    editForm.reset();
  };

  const openDeleteModal = (role: Role) => {
    setRoleToDelete(role);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setRoleToDelete(null);
  };

  const onCreateSubmit = async (data: RoleFormData) => {
    try {
      setIsSubmitting(true);

      const response = await api
        .post("roles", { json: data })
        .json<RoleResponse>();

      if (response.success) {
        toast.success(response.message || "Role criada com sucesso");
        mutate();
        closeCreateModal();
      }
    } catch (err) {
      const error = err as { message?: string };
      toast.error(error.message || "Erro ao criar role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEditSubmit = async (data: RoleFormData) => {
    if (!selectedRole) return;

    try {
      setIsSubmitting(true);

      const response = await api
        .put(`roles/${selectedRole.id}`, { json: data })
        .json<RoleResponse>();

      if (response.success) {
        toast.success(response.message || "Role atualizada com sucesso");
        mutate();
        closeEditModal();
      }
    } catch (err) {
      const error = err as { message?: string };
      toast.error(error.message || "Erro ao atualizar role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!roleToDelete) return;

    try {
      setIsDeleting(true);

      const response = await api
        .delete(`roles/${roleToDelete.id}`)
        .json<DeleteRoleResponse>();

      if (response.success) {
        toast.success(response.message || "Role deletada com sucesso");
        mutate();
        closeDeleteModal();
      }
    } catch (err) {
      const error = err as { message?: string };
      toast.error(error.message || "Erro ao deletar role");
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    roles: filteredRoles,
    isLoading,
    error: error || null,
    searchQuery,
    onSearchChange: setSearchQuery,
    isCreateModalOpen,
    openCreateModal,
    closeCreateModal,
    isEditModalOpen,
    selectedRole,
    openEditModal,
    closeEditModal,
    isDeleteModalOpen,
    roleToDelete,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    isDeleting,
    permissions,
    isLoadingPermissions,
    createForm,
    editForm,
    onCreateSubmit,
    onEditSubmit,
    isSubmitting,
    isAdmin,
    groupedPermissions,
    isLoadingAdmin,
  };
};
