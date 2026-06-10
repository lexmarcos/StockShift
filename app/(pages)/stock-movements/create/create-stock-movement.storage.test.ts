import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearStockMovementDraft,
  isStockMovementDraftRecoveredFromPreviousRuntime,
  mutateStockMovementDraft,
  readStockMovementDraft,
  STOCK_MOVEMENT_DRAFT_SCHEMA_VERSION,
  writeStockMovementDraft,
} from "./create-stock-movement.storage";
import type { WritableStockMovementDraft } from "./create-stock-movement.storage";

const STORE_NAME = "stockMovementDrafts";
const DRAFT_KEY = "current";

interface MutableRequest<T> {
  result: T;
  error: DOMException | null;
  onsuccess: ((this: IDBRequest<T>, event: Event) => unknown) | null;
  onerror: ((this: IDBRequest<T>, event: Event) => unknown) | null;
}

interface MutableOpenRequest extends MutableRequest<IDBDatabase> {
  onupgradeneeded:
    | ((this: IDBOpenDBRequest, event: IDBVersionChangeEvent) => unknown)
    | null;
}

const createMutableRequest = <T>(initialResult: T): MutableRequest<T> => ({
  result: initialResult,
  error: null,
  onsuccess: null,
  onerror: null,
});

const createMutableOpenRequest = (): MutableOpenRequest => ({
  ...createMutableRequest({} as IDBDatabase),
  onupgradeneeded: null,
});

class FakeObjectStore {
  public constructor(
    private readonly values: Map<string, unknown>,
    private readonly registerRequest: () => void,
    private readonly settleRequest: () => void,
  ) {}

  public get(key: IDBValidKey): IDBRequest<unknown> {
    const request = createMutableRequest<unknown>(undefined);
    this.registerRequest();
    queueMicrotask(() => {
      request.result = this.values.get(String(key));
      request.onsuccess?.call(request as IDBRequest<unknown>, new Event("success"));
      this.settleRequest();
    });
    return request as IDBRequest<unknown>;
  }

  public put(value: unknown, key?: IDBValidKey): IDBRequest<IDBValidKey> {
    const request = createMutableRequest<IDBValidKey>(key ?? DRAFT_KEY);
    this.registerRequest();
    queueMicrotask(() => {
      this.values.set(String(key ?? DRAFT_KEY), value);
      request.onsuccess?.call(request as IDBRequest<IDBValidKey>, new Event("success"));
      this.settleRequest();
    });
    return request as IDBRequest<IDBValidKey>;
  }

  public delete(key: IDBValidKey): IDBRequest<undefined> {
    const request = createMutableRequest<undefined>(undefined);
    this.registerRequest();
    queueMicrotask(() => {
      this.values.delete(String(key));
      request.onsuccess?.call(request as IDBRequest<undefined>, new Event("success"));
      this.settleRequest();
    });
    return request as IDBRequest<undefined>;
  }
}

class FakeTransaction {
  public error: DOMException | null = null;
  public oncomplete: ((this: IDBTransaction, event: Event) => unknown) | null =
    null;
  public onabort: ((this: IDBTransaction, event: Event) => unknown) | null =
    null;
  private pendingRequests = 0;
  private hasCompleted = false;

  public constructor(private readonly values: Map<string, unknown>) {}

  public objectStore(): IDBObjectStore {
    return new FakeObjectStore(
      this.values,
      () => {
        this.pendingRequests += 1;
      },
      () => {
        this.pendingRequests -= 1;
        if (this.pendingRequests > 0 || this.hasCompleted) return;
        this.hasCompleted = true;
        this.oncomplete?.call(this as unknown as IDBTransaction, new Event("complete"));
      },
    ) as unknown as IDBObjectStore;
  }
}

class FakeDatabase {
  public readonly objectStoreNames = {
    contains: (storeName: string) => this.stores.has(storeName),
  } as DOMStringList;

  public constructor(private readonly stores: Map<string, Map<string, unknown>>) {}

  public createObjectStore(storeName: string): IDBObjectStore {
    const values = new Map<string, unknown>();
    this.stores.set(storeName, values);
    return new FakeObjectStore(values, () => {}, () => {}) as unknown as IDBObjectStore;
  }

  public transaction(storeName: string): IDBTransaction {
    const values = this.stores.get(storeName);
    if (!values) throw new Error(`Object store ${storeName} não existe.`);
    return new FakeTransaction(values) as unknown as IDBTransaction;
  }

  public close(): void {}
}

class FakeIndexedDb {
  public shouldFailOpen = false;
  private readonly stores = new Map<string, Map<string, unknown>>();

  public open(): IDBOpenDBRequest {
    const request = createMutableOpenRequest();
    queueMicrotask(() => {
      if (this.shouldFailOpen) {
        request.error = new DOMException("IndexedDB indisponível", "AbortError");
        request.onerror?.call(
          request as unknown as IDBRequest<IDBDatabase>,
          new Event("error"),
        );
        return;
      }

      const database = new FakeDatabase(this.stores);
      request.result = database as unknown as IDBDatabase;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        request.onupgradeneeded?.call(
          request as unknown as IDBOpenDBRequest,
          new Event("upgradeneeded") as IDBVersionChangeEvent,
        );
      }
      request.onsuccess?.call(
        request as unknown as IDBRequest<IDBDatabase>,
        new Event("success"),
      );
    });
    return request as unknown as IDBOpenDBRequest;
  }

  public getStoredDraft(): unknown {
    return this.stores.get(STORE_NAME)?.get(DRAFT_KEY);
  }

  public putStoredDraft(value: unknown): void {
    const store = this.stores.get(STORE_NAME) ?? new Map<string, unknown>();
    store.set(DRAFT_KEY, value);
    this.stores.set(STORE_NAME, store);
  }
}

const createDraft = (): WritableStockMovementDraft => ({
  type: "PURCHASE_IN",
  warehouseId: "wh-1",
  notes: "Observação",
  selectedProductId: "product-1",
  itemQuantity: "3",
  items: [
    {
      quantity: 3,
      productName: "Produto inline",
      newProductData: {
        name: "Produto inline",
        image: {
          name: "produto.png",
          type: "image/png",
          blob: new Blob(["a"], { type: "image/png" }),
        },
      },
    },
  ],
});

let fakeIndexedDb: FakeIndexedDb;

beforeEach(async () => {
  fakeIndexedDb = new FakeIndexedDb();
  Object.defineProperty(window, "indexedDB", {
    configurable: true,
    value: fakeIndexedDb,
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
  await clearStockMovementDraft();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("create-stock-movement.storage", () => {
  it("grava, lê e limpa draft em IndexedDB", async () => {
    await writeStockMovementDraft(createDraft());

    const draft = await readStockMovementDraft();

    expect(draft).toMatchObject({
      schemaVersion: STOCK_MOVEMENT_DRAFT_SCHEMA_VERSION,
      type: "PURCHASE_IN",
      warehouseId: "wh-1",
      notes: "Observação",
      selectedProductId: "product-1",
      itemQuantity: "3",
      revision: 1,
    });
    expect(typeof draft?.updatedAt).toBe("string");
    expect(typeof draft?.runtimeId).toBe("string");

    await clearStockMovementDraft();
    expect(await readStockMovementDraft()).toBeNull();
  });

  it("incrementa a revisão a cada gravação", async () => {
    const firstWrite = await writeStockMovementDraft(createDraft());
    const secondWrite = await writeStockMovementDraft(createDraft());

    expect(firstWrite).toEqual({ status: "written", revision: 1 });
    expect(secondWrite).toEqual({ status: "written", revision: 2 });
    expect((await readStockMovementDraft())?.revision).toBe(2);
  });

  it("rejeita gravação com revisão esperada desatualizada", async () => {
    await writeStockMovementDraft(createDraft());
    await writeStockMovementDraft({ ...createDraft(), notes: "Mais nova" }, 1);

    const staleWrite = await writeStockMovementDraft(
      { ...createDraft(), notes: "Antiga" },
      1,
    );

    expect(staleWrite).toEqual({ status: "conflict", revision: 2 });
    expect((await readStockMovementDraft())?.notes).toBe("Mais nova");
  });

  it("aplica mutação atômica sobre o draft atual", async () => {
    await writeStockMovementDraft(createDraft());

    const mutatedDraft = await mutateStockMovementDraft((draft) => ({
      ...draft,
      items: [...draft.items, { quantity: 1, productName: "Novo item" }],
    }));

    expect(mutatedDraft?.items).toHaveLength(2);
    expect(mutatedDraft?.revision).toBe(2);
    expect((await readStockMovementDraft())?.items).toHaveLength(2);
  });

  it("não aplica mutação quando não há draft salvo", async () => {
    const mutatedDraft = await mutateStockMovementDraft((draft) => draft);

    expect(mutatedDraft).toBeNull();
    expect(await readStockMovementDraft()).toBeNull();
  });

  it("ignora JSON inválido e remove o valor salvo", async () => {
    fakeIndexedDb.putStoredDraft("{invalid-json");

    expect(await readStockMovementDraft()).toBeNull();
    expect(fakeIndexedDb.getStoredDraft()).toBeUndefined();
  });

  it("ignora draft com schema incompatível", async () => {
    fakeIndexedDb.putStoredDraft({
      schemaVersion: 1,
      type: "PURCHASE_IN",
      notes: "inválido",
      items: [],
      selectedProductId: "",
      itemQuantity: "",
      updatedAt: "2026-01-20T10:00:00.000Z",
    });

    expect(await readStockMovementDraft()).toBeNull();
    expect(fakeIndexedDb.getStoredDraft()).toBeUndefined();
  });

  it("ignora draft sem warehouseId ou sem revisão", async () => {
    fakeIndexedDb.putStoredDraft({
      schemaVersion: STOCK_MOVEMENT_DRAFT_SCHEMA_VERSION,
      type: "PURCHASE_IN",
      notes: "sem campos novos",
      items: [],
      selectedProductId: "",
      itemQuantity: "",
      updatedAt: "2026-01-20T10:00:00.000Z",
    });

    expect(await readStockMovementDraft()).toBeNull();
    expect(fakeIndexedDb.getStoredDraft()).toBeUndefined();
  });

  it("preserva imagem inline em blob", async () => {
    await writeStockMovementDraft(createDraft());

    const draft = await readStockMovementDraft();
    const savedImage = draft?.items[0].newProductData?.image;

    expect(savedImage).toBeDefined();
    expect(savedImage!.name).toBe("produto.png");
    expect(savedImage!.type).toBe("image/png");
    expect(savedImage!.blob).toBeInstanceOf(Blob);
  });

  it("rejeita draft com imagem cujo blob não é Blob", async () => {
    fakeIndexedDb.putStoredDraft({
      schemaVersion: STOCK_MOVEMENT_DRAFT_SCHEMA_VERSION,
      type: "PURCHASE_IN",
      warehouseId: "wh-1",
      revision: 1,
      notes: "draft inválido",
      items: [
        {
          quantity: 1,
          productName: "Produto quebrado",
          newProductData: {
            name: "Produto quebrado",
            image: {
              name: "foto.png",
              type: "image/png",
              blob: "not-a-blob",
            },
          },
        },
      ],
      selectedProductId: "",
      itemQuantity: "",
      updatedAt: "2026-01-20T10:00:00.000Z",
    });

    expect(await readStockMovementDraft()).toBeNull();
    expect(fakeIndexedDb.getStoredDraft()).toBeUndefined();
  });

  it("mantém fallback em memória quando IndexedDB falha", async () => {
    fakeIndexedDb.shouldFailOpen = true;

    const writeResult = await writeStockMovementDraft(createDraft());

    const draft = await readStockMovementDraft();

    expect(writeResult).toEqual({ status: "written", revision: 1 });
    expect(draft?.notes).toBe("Observação");
    expect(console.error).toHaveBeenCalled();
  });

  it("identifica rascunho do runtime atual e de runtime anterior", async () => {
    await writeStockMovementDraft(createDraft());
    const currentRuntimeDraft = await readStockMovementDraft();

    expect(currentRuntimeDraft).not.toBeNull();
    expect(
      isStockMovementDraftRecoveredFromPreviousRuntime(currentRuntimeDraft!),
    ).toBe(false);

    fakeIndexedDb.putStoredDraft({
      ...currentRuntimeDraft!,
      runtimeId: "runtime-anterior",
    });

    const previousRuntimeDraft = await readStockMovementDraft();
    expect(previousRuntimeDraft).not.toBeNull();
    expect(
      isStockMovementDraftRecoveredFromPreviousRuntime(previousRuntimeDraft!),
    ).toBe(true);
  });

  it("mantém compatibilidade com rascunho sem runtimeId", async () => {
    fakeIndexedDb.putStoredDraft({
      schemaVersion: STOCK_MOVEMENT_DRAFT_SCHEMA_VERSION,
      type: "PURCHASE_IN",
      warehouseId: "wh-1",
      revision: 1,
      notes: "legado",
      items: [],
      selectedProductId: "",
      itemQuantity: "",
      updatedAt: "2026-01-20T10:00:00.000Z",
    });

    const legacyDraft = await readStockMovementDraft();

    expect(legacyDraft?.notes).toBe("legado");
    expect(isStockMovementDraftRecoveredFromPreviousRuntime(legacyDraft!)).toBe(
      true,
    );
  });
});
