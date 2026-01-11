export interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrandsResponse {
  success: boolean;
  message: string | null;
  data: Brand[];
}

export interface CreateBrandResponse {
  success: boolean;
  message: string;
  data: Brand;
}

export interface UpdateBrandResponse {
  success: boolean;
  message: string;
  data: Brand;
}

export interface DeleteBrandResponse {
  success: boolean;
  message: string;
  data: null;
}

export interface SortConfig {
  key: 'name' | 'createdAt';
  direction: 'asc' | 'desc';
}
