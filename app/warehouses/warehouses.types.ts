export interface Warehouse {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string;
  state: string;
  phone: string | null;
  email: string | null;
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

export type SortKey = 'name' | 'createdAt';

export interface SortConfig {
  key: SortKey;
  direction: 'asc' | 'desc';
}

export type StatusFilter = 'all' | 'active' | 'inactive';
