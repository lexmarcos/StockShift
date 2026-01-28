export interface Permission {
  id: string;
  resource: string;
  resourceDisplayName: string;
  action: string;
  actionDisplayName: string;
  scope: string;
  scopeDisplayName: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface RolesResponse {
  success: boolean;
  message: string | null;
  data: Role[];
}

export interface RoleResponse {
  success: boolean;
  message: string | null;
  data: Role;
}

export interface PermissionsResponse {
  success: boolean;
  message: string | null;
  data: Permission[];
}

export interface CreateRolePayload {
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRolePayload {
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface DeleteRoleResponse {
  success: boolean;
  message: string;
  data: null;
}

export interface RolesViewProps {
  roles: Role[];
  isLoading: boolean;
  error: Error | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isCreateModalOpen: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  isEditModalOpen: boolean;
  selectedRole: Role | null;
  openEditModal: (role: Role) => void;
  closeEditModal: () => void;
  isDeleteModalOpen: boolean;
  roleToDelete: Role | null;
  openDeleteModal: (role: Role) => void;
  closeDeleteModal: () => void;
  confirmDelete: () => Promise<void>;
  isDeleting: boolean;
  permissions: Permission[];
  isLoadingPermissions: boolean;
  createForm: ReturnType<typeof import("react-hook-form").useForm<import("./roles.schema").RoleFormData>>;
  editForm: ReturnType<typeof import("react-hook-form").useForm<import("./roles.schema").RoleFormData>>;
  onCreateSubmit: (data: import("./roles.schema").RoleFormData) => Promise<void>;
  onEditSubmit: (data: import("./roles.schema").RoleFormData) => Promise<void>;
  isSubmitting: boolean;
  isAdmin: boolean;
  groupedPermissions: Map<string, Permission[]>;
}
