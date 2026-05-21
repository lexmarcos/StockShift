import type {
  InlineProductImageData,
  StockMovementDraftItem,
} from "./create-stock-movement.types";
import { isManualMovementType } from "../stock-movements.constants";
import type { ManualMovementType } from "../stock-movements.constants";

const DRAFT_DATABASE_NAME = "stockshift";
const DRAFT_DATABASE_VERSION = 1;
const DRAFT_STORE_NAME = "stockMovementDrafts";
const DRAFT_STORAGE_KEY = "current";
export const STOCK_MOVEMENT_DRAFT_SCHEMA_VERSION = 1;

const createStockMovementDraftRuntimeId = (): string => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  const timestamp = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).slice(2);
  return `runtime-${timestamp}-${randomSuffix}`;
};

const STOCK_MOVEMENT_DRAFT_RUNTIME_ID = createStockMovementDraftRuntimeId();

export interface StockMovementDraft {
  schemaVersion: typeof STOCK_MOVEMENT_DRAFT_SCHEMA_VERSION;
  updatedAt: string;
  type: ManualMovementType;
  notes: string;
  items: StockMovementDraftItem[];
  selectedProductId: string;
  itemQuantity: string;
  inlineProductBarcode?: string;
  runtimeId?: string;
}

export type WritableStockMovementDraft = Omit<
  StockMovementDraft,
  "schemaVersion" | "updatedAt"
> &
  Partial<Pick<StockMovementDraft, "schemaVersion" | "updatedAt">>;

let fallbackDraft: StockMovementDraft | null = null;

const logDraftStorageError = (operation: string, error: unknown): void => {
  console.error(`Falha ao ${operation} rascunho da movimentação`, error);
};

const getBrowserIndexedDb = (): IDBFactory | null => {
  if (typeof window === "undefined") return null;
  return window.indexedDB ?? null;
};

const createRequestError = (operation: string, error: unknown): Error => {
  if (error instanceof Error) return error;
  return new Error(`Falha ao ${operation} rascunho da movimentação.`);
};

const openDraftDatabase = (): Promise<IDBDatabase> => {
  const indexedDb = getBrowserIndexedDb();
  if (!indexedDb) {
    return Promise.reject(new Error("IndexedDB indisponível para rascunhos."));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDb.open(
      DRAFT_DATABASE_NAME,
      DRAFT_DATABASE_VERSION,
    );
    request.onerror = () =>
      reject(createRequestError("abrir", request.error));
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(DRAFT_STORE_NAME)) {
        database.createObjectStore(DRAFT_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
};

const readDraftFromIndexedDb = async (): Promise<unknown> => {
  const database = await openDraftDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(DRAFT_STORE_NAME, "readonly");
    const store = transaction.objectStore(DRAFT_STORE_NAME);
    const request = store.get(DRAFT_STORAGE_KEY);
    request.onerror = () => reject(createRequestError("ler", request.error));
    request.onsuccess = () => resolve(request.result);
    transaction.oncomplete = () => database.close();
    transaction.onabort = () => {
      database.close();
      reject(createRequestError("ler", transaction.error));
    };
  });
};

const writeDraftToIndexedDb = async (
  draft: StockMovementDraft,
): Promise<void> => {
  const database = await openDraftDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(DRAFT_STORE_NAME, "readwrite");
    const store = transaction.objectStore(DRAFT_STORE_NAME);
    const request = store.put(draft, DRAFT_STORAGE_KEY);
    request.onerror = () => reject(createRequestError("gravar", request.error));
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onabort = () => {
      database.close();
      reject(createRequestError("gravar", transaction.error));
    };
  });
};

const clearDraftFromIndexedDb = async (): Promise<void> => {
  const database = await openDraftDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(DRAFT_STORE_NAME, "readwrite");
    const store = transaction.objectStore(DRAFT_STORE_NAME);
    const request = store.delete(DRAFT_STORAGE_KEY);
    request.onerror = () => reject(createRequestError("limpar", request.error));
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onabort = () => {
      database.close();
      reject(createRequestError("limpar", transaction.error));
    };
  });
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isOptionalString = (value: unknown): value is string | undefined => {
  return value === undefined || typeof value === "string";
};

const isOptionalBoolean = (value: unknown): value is boolean | undefined => {
  return value === undefined || typeof value === "boolean";
};

const isOptionalNumber = (value: unknown): value is number | undefined => {
  return value === undefined || typeof value === "number";
};

const isInlineProductImageData = (
  value: unknown,
): value is InlineProductImageData => {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    typeof value.type === "string" &&
    typeof value.dataUrl === "string"
  );
};

const isInlineProductData = (
  value: unknown,
): value is StockMovementDraftItem["newProductData"] => {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    isOptionalString(value.description) &&
    isOptionalString(value.barcode) &&
    isOptionalString(value.categoryId) &&
    isOptionalString(value.brandId) &&
    isOptionalBoolean(value.isKit) &&
    isOptionalBoolean(value.hasExpiration) &&
    isOptionalBoolean(value.active) &&
    isOptionalString(value.manufacturedDate) &&
    isOptionalString(value.expirationDate) &&
    isOptionalNumber(value.costPrice) &&
    isOptionalNumber(value.sellingPrice) &&
    (value.image === undefined || isInlineProductImageData(value.image))
  );
};

const isDraftItem = (value: unknown): value is StockMovementDraftItem => {
  return (
    isRecord(value) &&
    typeof value.quantity === "number" &&
    Number.isFinite(value.quantity) &&
    isOptionalString(value.productId) &&
    isOptionalString(value.productName) &&
    isOptionalString(value.manufacturedDate) &&
    isOptionalString(value.expirationDate) &&
    isOptionalNumber(value.costPrice) &&
    isOptionalNumber(value.sellingPrice) &&
    (value.newProductData === undefined || isInlineProductData(value.newProductData))
  );
};

const parseStoredDraft = (storedDraft: unknown): unknown => {
  if (typeof storedDraft !== "string") return storedDraft;
  try {
    return JSON.parse(storedDraft) as unknown;
  } catch {
    return null;
  }
};

const normalizeStoredDraft = (
  storedDraft: unknown,
): StockMovementDraft | null => {
  const parsedDraft = parseStoredDraft(storedDraft);
  if (!isRecord(parsedDraft)) return null;
  if (parsedDraft.schemaVersion !== STOCK_MOVEMENT_DRAFT_SCHEMA_VERSION) return null;
  if (!isManualMovementType(String(parsedDraft.type))) return null;
  if (typeof parsedDraft.updatedAt !== "string") return null;
  if (typeof parsedDraft.notes !== "string") return null;
  if (!Array.isArray(parsedDraft.items) || !parsedDraft.items.every(isDraftItem)) {
    return null;
  }
  if (typeof parsedDraft.selectedProductId !== "string") return null;
  if (typeof parsedDraft.itemQuantity !== "string") return null;
  if (!isOptionalString(parsedDraft.inlineProductBarcode)) return null;
  if (!isOptionalString(parsedDraft.runtimeId)) return null;
  return parsedDraft as unknown as StockMovementDraft;
};

const buildPersistedDraft = (
  draft: WritableStockMovementDraft,
): StockMovementDraft => ({
  ...draft,
  schemaVersion: STOCK_MOVEMENT_DRAFT_SCHEMA_VERSION,
  updatedAt: new Date().toISOString(),
  runtimeId: STOCK_MOVEMENT_DRAFT_RUNTIME_ID,
});

export const isStockMovementDraftRecoveredFromPreviousRuntime = (
  draft: StockMovementDraft,
): boolean => draft.runtimeId !== STOCK_MOVEMENT_DRAFT_RUNTIME_ID;

export const readStockMovementDraft =
  async (): Promise<StockMovementDraft | null> => {
    try {
      const storedDraft = await readDraftFromIndexedDb();
      if (storedDraft === undefined) return fallbackDraft;

      const draft = normalizeStoredDraft(storedDraft);
      if (!draft) {
        await clearStockMovementDraft();
        return null;
      }
      fallbackDraft = draft;
      return draft;
    } catch (error) {
      logDraftStorageError("ler", error);
      return fallbackDraft;
    }
  };

export const writeStockMovementDraft = async (
  draft: WritableStockMovementDraft,
): Promise<void> => {
  const persistedDraft = buildPersistedDraft(draft);
  fallbackDraft = persistedDraft;
  try {
    await writeDraftToIndexedDb(persistedDraft);
  } catch (error) {
    logDraftStorageError("gravar", error);
  }
};

export const clearStockMovementDraft = async (): Promise<void> => {
  fallbackDraft = null;
  try {
    await clearDraftFromIndexedDb();
  } catch (error) {
    logDraftStorageError("limpar", error);
  }
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
