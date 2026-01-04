export interface Warehouse {
  id: string;
  name: string;
  code: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WarehousesResponse {
  success: boolean;
  message: string | null;
  data: Warehouse[];
}

export interface CreateWarehouseResponse {
  success: boolean;
  message: string;
  data: Warehouse;
}

export interface UpdateWarehouseResponse {
  success: boolean;
  message: string;
  data: Warehouse;
}

export interface DeleteWarehouseResponse {
  success: boolean;
  message: string;
  data: null;
}

export type SortKey = 'name' | 'code' | 'createdAt';

export interface SortConfig {
  key: SortKey;
  direction: 'asc' | 'desc';
}

export type StatusFilter = 'all' | 'active' | 'inactive';
