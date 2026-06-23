export interface ProductBatch {
  id: string;
  productName: string | null;
  batchCode: string | null;
  quantity: number;
  costPrice: number | null;
  sellingPrice: number | null;
  manufacturedDate: string | null;
  expirationDate: string | null;
}

export type SortKey = "batchCode" | "quantity" | "expirationDate";
export type SortDirection = "asc" | "desc";

export interface ProductBatchesViewProps {
  batches: ProductBatch[];
  productName: string;
  isLoading: boolean;
  error: Error | null;
  requiresWarehouse: boolean;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSortChange: (key: SortKey) => void;
}
