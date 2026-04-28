import {
  InlineProductImageData,
  InlineProductData,
  StockMovementDraftItem,
} from "./create-stock-movement.types";
import { ManualMovementType } from "../stock-movements.constants";

const DRAFT_STORAGE_KEY = "stockMovementCreate:draft";
const INLINE_PRODUCT_ITEMS_STORAGE_KEY = "stockMovementCreate:inlineProductItems";

export interface StockMovementDraft {
  type: ManualMovementType;
  notes: string;
  items: StockMovementDraftItem[];
  selectedProductId: string;
  itemQuantity: string;
  inlineProductBarcode?: string;
}

export interface InlineProductDraftItem {
  product: InlineProductData;
  quantity: number;
}

export const readStockMovementDraft = (): StockMovementDraft | null => {
  if (typeof window === "undefined") return null;
  const rawDraft = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
  if (!rawDraft) return null;
  return JSON.parse(rawDraft) as StockMovementDraft;
};

export const writeStockMovementDraft = (draft: StockMovementDraft): void => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
};

export const clearStockMovementDraft = (): void => {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
};

export const readInlineProductItems = (): InlineProductDraftItem[] => {
  if (typeof window === "undefined") return [];
  const rawItems = window.sessionStorage.getItem(INLINE_PRODUCT_ITEMS_STORAGE_KEY);
  if (!rawItems) return [];
  return JSON.parse(rawItems) as InlineProductDraftItem[];
};

export const appendInlineProductItem = (
  item: InlineProductDraftItem,
): void => {
  if (typeof window === "undefined") return;
  const items = readInlineProductItems();
  window.sessionStorage.setItem(
    INLINE_PRODUCT_ITEMS_STORAGE_KEY,
    JSON.stringify([...items, item]),
  );
};

export const clearInlineProductItems = (): void => {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(INLINE_PRODUCT_ITEMS_STORAGE_KEY);
};

export const fileToInlineProductImage = (
  file: File,
): Promise<InlineProductImageData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Falha ao ler a imagem ${file.name}`));
    reader.onload = () => {
      resolve({
        name: file.name,
        type: file.type,
        dataUrl: String(reader.result),
      });
    };
    reader.readAsDataURL(file);
  });
};

export const inlineProductImageToFile = (
  image: InlineProductImageData,
): File => {
  const [metadata, base64] = image.dataUrl.split(",");
  const mime = metadata.match(/data:(.*);base64/)?.[1] || image.type;
  const bytes = window.atob(base64);
  const buffer = new Uint8Array(bytes.length);
  for (let index = 0; index < bytes.length; index += 1) {
    buffer[index] = bytes.charCodeAt(index);
  }
  return new File([buffer], image.name, { type: mime });
};
