export interface User {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLogin: string | null;
  createdAt: string;
  roles: string[];
  warehouses: string[];
}

export interface UsersResponse {
  success: boolean;
  message: string | null;
  data: User[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystemRole: boolean;
}

export interface RolesResponse {
  success: boolean;
  message: string | null;
  data: Role[];
}

export interface Warehouse {
  id: string;
  name: string;
  isActive: boolean;
}

export interface WarehousesResponse {
  success: boolean;
  message: string | null;
  data: Warehouse[];
}

export interface CreateUserPayload {
  email: string;
  fullName: string;
  roleIds: string[];
  warehouseIds: string[];
}

export interface CreateUserResponse {
  success: boolean;
  message: string;
  data: {
    userId: string;
    email: string;
    fullName: string;
    temporaryPassword: string;
    mustChangePassword: boolean;
    roles: string[];
    warehouses: string[];
  };
}

export interface UpdateUserPayload {
  fullName: string;
  isActive: boolean;
  roleIds: string[];
  warehouseIds: string[];
}

export interface UpdateUserResponse {
  success: boolean;
  message: string;
  data: User;
}

export interface UsersViewProps {
  users: User[];
  isLoading: boolean;
  error: Error | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isCreateModalOpen: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  isEditModalOpen: boolean;
  selectedUser: User | null;
  openEditModal: (user: User) => void;
  closeEditModal: () => void;
  roles: Role[];
  warehouses: Warehouse[];
  isLoadingRoles: boolean;
  isLoadingWarehouses: boolean;
  createForm: ReturnType<typeof import("react-hook-form").useForm<import("./users.schema").CreateUserFormData>>;
  editForm: ReturnType<typeof import("react-hook-form").useForm<import("./users.schema").EditUserFormData>>;
  onCreateSubmit: (data: import("./users.schema").CreateUserFormData) => Promise<void>;
  onEditSubmit: (data: import("./users.schema").EditUserFormData) => Promise<void>;
  isSubmitting: boolean;
  temporaryPassword: string | null;
  createdUserEmail: string | null;
  closePasswordModal: () => void;
  isAdmin: boolean;
  currentUserId: string | undefined;
  toggleUserStatus: (user: User) => Promise<void>;
  isLoadingAdmin: boolean;
}
