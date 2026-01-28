export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface SystemUser {
  id: string;
  email: string;
  fullName: string;
  roles: Role[];
  warehouseId: string | null;
  warehouseName: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface UsersResponse {
  success: boolean;
  message: string | null;
  data: SystemUser[];
}

export interface RolesResponse {
  success: boolean;
  message: string | null;
  data: Role[];
}

export interface CreateUserPayload {
  email: string;
  fullName: string;
  password: string;
  roleIds: string[];
  warehouseId: string | null;
}

export interface UpdateUserPayload {
  fullName: string;
  roleIds: string[];
  warehouseId: string | null;
  isActive: boolean;
}

export interface CreateUserResponse {
  success: boolean;
  message: string;
  data: SystemUser;
}

export interface UpdateUserResponse {
  success: boolean;
  message: string;
  data: SystemUser;
}

export interface DeleteUserResponse {
  success: boolean;
  message: string;
  data: null;
}

export interface SortConfig {
  key: "fullName" | "email" | "createdAt";
  direction: "asc" | "desc";
}
