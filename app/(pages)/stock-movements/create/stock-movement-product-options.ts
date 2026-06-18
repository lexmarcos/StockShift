import type { StockMovementProductOption } from "./create-stock-movement.types";

export interface ProductListResponse {
  success: boolean;
  data:
    | { content: StockMovementProductOption[] }
    | StockMovementProductOption[];
}

export const PRODUCT_SEARCH_LIMIT = 5;

export const formatStockMovementProductLabel = (
  product: StockMovementProductOption,
): string => (product.sku ? `${product.name} (${product.sku})` : product.name);

export const mapStockMovementProductOptions = (
  response: ProductListResponse | null | undefined,
): StockMovementProductOption[] => {
  const rawProducts = response?.data;
  const productList = Array.isArray(rawProducts)
    ? rawProducts
    : rawProducts?.content || [];
  return productList.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    imageUrl: product.imageUrl,
  }));
};

export const buildStockMovementProductSearchUrl = (
  query: string,
): string | null => {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) return null;
  return `products/search?q=${encodeURIComponent(normalizedQuery)}`;
};
