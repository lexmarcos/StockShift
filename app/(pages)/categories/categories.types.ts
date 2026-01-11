export interface Category {
  id: string;
  name: string;
  description: string | null;
  parentCategoryId: string | null;
  parentCategoryName: string | null;
  attributesSchema: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTree extends Category {
  children: CategoryTree[];
  depth: number;
  productCount?: number;
}

export interface CategoriesResponse {
  success: boolean;
  message: string | null;
  data: Category[];
}

export interface CreateCategoryResponse {
  success: boolean;
  message: string;
  data: Category;
}

export interface UpdateCategoryResponse {
  success: boolean;
  message: string;
  data: Category;
}

export interface DeleteCategoryResponse {
  success: boolean;
  message: string;
  data: null;
}

export type SortKey = "name" | "createdAt";
export type SortDirection = "asc" | "desc";

export interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export type ViewMode = "tree" | "flat";
