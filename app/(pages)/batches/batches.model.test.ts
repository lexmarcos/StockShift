import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  deriveBatchStatus,
  filterBatches,
  sortBatches,
  Batch,
  useBatchesModel,
} from "./batches.model";

const swrMock = vi.fn();

vi.mock("swr", () => ({
  default: (...args: unknown[]) => swrMock(...args),
}));

vi.mock("@/hooks/use-selected-warehouse", () => ({
  useSelectedWarehouse: vi.fn(),
}));

const baseBatch: Batch = {
  id: "b1",
  productId: "p1",
  productName: "Produto A",
  productSku: "SKU-A",
  warehouseId: "w1",
  warehouseName: "Central",
  warehouseCode: "WH-1",
  quantity: 12,
  batchNumber: "BATCH-001",
  expirationDate: "2026-01-20",
  costPrice: 10,
  sellingPrice: 18,
  notes: "",
  createdAt: "2026-01-01T10:00:00Z",
  updatedAt: "2026-01-01T10:00:00Z",
};

const setupSWRMocks = () => {
  swrMock.mockImplementation((key: string) => {
    if (key === "batches") {
      return {
        data: { data: [] },
        error: null,
        isLoading: false,
        mutate: vi.fn(),
      };
    }
    if (key === "warehouses") {
      return {
        data: { success: true, data: [] },
        isLoading: false,
      };
    }
    return { data: undefined, error: null, isLoading: false };
  });
};

beforeEach(() => {
  swrMock.mockReset();
  setupSWRMocks();
});

describe("batches model helpers", () => {
  it("marks expired when expiration is in the past", () => {
    const status = deriveBatchStatus(
      { ...baseBatch, expirationDate: "2020-01-01" },
      { today: new Date("2026-01-10"), lowStockThreshold: 10 }
    );
    expect(status.label).toBe("Expirado");
    expect(status.kind).toBe("expired");
  });

  it("marks expiring when expiration is within 30 days", () => {
    const inTenDays = "2026-01-20";
    const status = deriveBatchStatus(
      { ...baseBatch, expirationDate: inTenDays },
      { today: new Date("2026-01-10"), lowStockThreshold: 10 }
    );
    expect(status.kind).toBe("expiring");
  });

  it("filters by search and warehouse", () => {
    const batches: Batch[] = [
      baseBatch,
      { ...baseBatch, id: "b2", productName: "Produto B" },
    ];

    const filtered = filterBatches(batches, {
      searchQuery: "produto b",
      warehouseId: "w1",
      status: "all",
      lowStockThreshold: 10,
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("b2");
  });

  it("sorts by quantity desc", () => {
    const batches: Batch[] = [
      { ...baseBatch, id: "b1", quantity: 5 },
      { ...baseBatch, id: "b2", quantity: 20 },
    ];

    const sorted = sortBatches(batches, { key: "quantity", direction: "desc" });
    expect(sorted[0].id).toBe("b2");
  });
});

describe("useBatchesModel", () => {
  it("initializes warehouse filter from selected warehouse", async () => {
    const { useSelectedWarehouse } = await import("@/hooks/use-selected-warehouse");
    vi.mocked(useSelectedWarehouse).mockReturnValue({
      warehouseId: "wh-1",
      setWarehouseId: vi.fn(),
    });

    const { result } = renderHook(() => useBatchesModel());

    await waitFor(() => {
      expect(result.current.filters.warehouseId).toBe("wh-1");
    });
  });
});
