export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string | null;
  city: string;
  state: string;
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

export interface SwitchWarehouseResponse {
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
