export interface CreateBrandFormData {
  name: string;
  description: string;
}

export interface CreateBrandRequest {
  name: string;
  description?: string;
}

export interface BrandResponse {
  id: string;
  name: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
}
