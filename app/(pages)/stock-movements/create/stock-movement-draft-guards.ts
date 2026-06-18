import type { StockMovementDraftItem } from "./create-stock-movement.types";

export interface InlineProductIdentity {
  name: string;
  barcode?: string;
}

const withoutIgnoredIndex = (
  items: StockMovementDraftItem[],
  ignoredIndex: number | null,
): StockMovementDraftItem[] => {
  return items.filter((_, index) => index !== ignoredIndex);
};

export const findDuplicateInlineProductError = (
  product: InlineProductIdentity,
  items: StockMovementDraftItem[],
  ignoredIndex: number | null,
): string | null => {
  const normalizedName = product.name.trim().toLowerCase();
  const normalizedBarcode = product.barcode?.trim();
  const consideredItems = withoutIgnoredIndex(items, ignoredIndex);

  const hasDuplicateName = consideredItems.some((item) => {
    return item.newProductData?.name.toLowerCase() === normalizedName;
  });
  if (hasDuplicateName) {
    return `O produto "${product.name}" já foi adicionado nesta movimentação.`;
  }

  if (!normalizedBarcode) return null;
  const barcodeConflictItem = consideredItems.find((item) => {
    return item.newProductData?.barcode === normalizedBarcode;
  });
  if (!barcodeConflictItem) return null;
  return `O código ${normalizedBarcode} já está em uso pelo produto "${barcodeConflictItem.productName}" nesta movimentação.`;
};

export const getPendingInlineProductBarcodeConflictError = (
  items: StockMovementDraftItem[],
  barcode: string | null | undefined,
): string | null => {
  if (!barcode) return null;
  const conflictingItem = items.find((item) => {
    return item.newProductData?.barcode === barcode;
  });
  if (!conflictingItem) return null;
  return `O código ${barcode} já pertence ao produto novo "${conflictingItem.productName}" nesta movimentação. Remova-o antes de adicionar o produto existente.`;
};

export const findScannedInlineProductDuplicateWarning = (
  items: StockMovementDraftItem[],
  barcode: string | null | undefined,
  ignoredIndex: number | null = null,
): string | null => {
  const normalizedBarcode = barcode?.trim();
  if (!normalizedBarcode) return null;
  const conflictingItem = withoutIgnoredIndex(items, ignoredIndex).find(
    (item) => item.newProductData?.barcode === normalizedBarcode,
  );
  if (!conflictingItem) return null;
  const productName =
    conflictingItem.newProductData?.name ?? conflictingItem.productName ?? "";
  return `O produto "${productName}" já está na lista de produtos da movimentação como um novo produto e não pode ser adicionado novamente.`;
};

export const hasExistingProductInItems = (
  items: StockMovementDraftItem[],
  productId: string,
): boolean => {
  return items.some((item) => item.productId === productId);
};

export const buildRepeatedProductBatchWarning = (productName: string): string => {
  return `${productName} já está na movimentação. Este lote será adicionado como um novo item.`;
};
