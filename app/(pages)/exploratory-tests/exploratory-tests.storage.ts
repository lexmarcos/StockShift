import type { ExploratoryTestProgress } from "./exploratory-tests.types";

const DATABASE_NAME = "stockshift_testing";
const DATABASE_VERSION = 1;
const STORE_NAME = "exploratoryTestProgress";
const STORAGE_KEY = "current";

const getBrowserIndexedDb = (): IDBFactory | null => {
  if (typeof window === "undefined") return null;
  return window.indexedDB ?? null;
};

const logStorageError = (operation: string, error: unknown): void => {
  console.error(`[exploratory-tests] Falha ao ${operation}`, error);
};

const openDatabase = (): Promise<IDBDatabase> => {
  const indexedDb = getBrowserIndexedDb();
  if (!indexedDb) {
    return Promise.reject(new Error("IndexedDB indisponível."));
  }
  return new Promise((resolve, reject) => {
    const request = indexedDb.open(DATABASE_NAME, DATABASE_VERSION);
    request.onerror = () => reject(new Error(`Falha ao abrir IndexedDB: ${request.error?.message}`));
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
};

const emptyProgress = (): ExploratoryTestProgress => ({
  completedTestIds: [],
  updatedAt: "",
});

let fallbackProgress: ExploratoryTestProgress = emptyProgress();

export const readProgress = async (): Promise<ExploratoryTestProgress> => {
  try {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(STORAGE_KEY);
      request.onerror = () => reject(new Error(`Falha ao ler progresso: ${request.error?.message}`));
      request.onsuccess = () => {
        const raw = request.result;
        if (raw && typeof raw === "object" && Array.isArray((raw as ExploratoryTestProgress).completedTestIds)) {
          fallbackProgress = raw as ExploratoryTestProgress;
          resolve(fallbackProgress);
        } else {
          resolve(emptyProgress());
        }
      };
      transaction.oncomplete = () => database.close();
      transaction.onabort = () => {
        database.close();
        reject(new Error("Transação de leitura abortada."));
      };
    });
  } catch (error) {
    logStorageError("ler progresso", error);
    return fallbackProgress;
  }
};

export const writeProgress = async (completedTestIds: string[]): Promise<void> => {
  const progress: ExploratoryTestProgress = {
    completedTestIds,
    updatedAt: new Date().toISOString(),
  };
  fallbackProgress = progress;
  try {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(progress, STORAGE_KEY);
      request.onerror = () => reject(new Error(`Falha ao gravar progresso: ${request.error?.message}`));
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onabort = () => {
        database.close();
        reject(new Error("Transação de gravação abortada."));
      };
    });
  } catch (error) {
    logStorageError("gravar progresso", error);
  }
};

export const clearProgress = async (): Promise<void> => {
  fallbackProgress = emptyProgress();
  try {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(STORAGE_KEY);
      request.onerror = () => reject(new Error(`Falha ao limpar progresso: ${request.error?.message}`));
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onabort = () => {
        database.close();
        reject(new Error("Transação de exclusão abortada."));
      };
    });
  } catch (error) {
    logStorageError("limpar progresso", error);
  }
};
