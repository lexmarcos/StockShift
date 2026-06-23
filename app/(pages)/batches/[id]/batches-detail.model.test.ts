import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBatchDetailModel } from "./batches-detail.model";
import {
  computeBatchStatus,
  computeExpirationDays,
  computeMarginClass,
  computeMarginLabel,
  formatCentsToBRL,
  formatCentsTotal,
  formatExpirationLabel,
  formatQuantityDisplay,
  resolveBatchDetailTitle,
} from "./batches-detail.model";
import type { BatchDetail, BatchDetailResponse } from "./batches-detail.types";

/* ─── Fakes ─── */

type JsonResponse<T> = {
  json: () => Promise<T>;
};

type SwrState<T> = {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  mutate: ReturnType<typeof vi.fn>;
};

const createJsonResponse = <T,>(payload: T): JsonResponse<T> => ({
  json: vi.fn(async () => payload),
});

const fakeApi = vi.hoisted(() => {
  class FakeBatchApi {
    public readonly get = vi.fn<(url: string) => JsonResponse<unknown>>();
    public readonly delete = vi.fn<(url: string) => JsonResponse<unknown>>();
  }

  return new FakeBatchApi();
});

const fakeRouter = vi.hoisted(() => {
  class FakeRouter {
    public readonly push = vi.fn<(path: string) => void>();
  }

  return new FakeRouter();
});

const fakeBreadcrumb = vi.hoisted(() => {
  class FakeBreadcrumb {
    public readonly invoke = vi.fn<
      (state: { title: string; backUrl: string }) => void
    >();
  }

  return new FakeBreadcrumb();
});

const fakeToast = vi.hoisted(() => {
  class FakeToast {
    public readonly success = vi.fn<(message: string) => void>();
    public readonly error = vi.fn<(message: string) => void>();
  }

  return new FakeToast();
});

const fakeSWR = vi.hoisted(() => {
  class FakeSWR {
    private readonly fallback: SwrState<unknown> = {
      data: null,
      error: null,
      isLoading: false,
      mutate: vi.fn(),
    };

    private readonly responses = new Map<string | null, SwrState<unknown>>();

    public readonly hook = vi.fn<
      (
        key: string | null,
        _fetcher?: unknown,
        _options?: unknown,
      ) => SwrState<unknown>
    >((key) => this.responses.get(key) ?? this.fallback);

    public setState<T>(key: string | null, state: SwrState<T>): void {
      this.responses.set(key, state as SwrState<unknown>);
    }

    public reset(): void {
      this.responses.clear();
      this.hook.mockClear();
    }
  }

  return new FakeSWR();
});

/* ─── Mocks ─── */

vi.mock("swr", () => ({
  default: (...args: Parameters<
    (
      key: string | null,
      fetcher?: unknown,
      options?: unknown,
    ) => SwrState<unknown>
  >) =>
    fakeSWR.hook(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: fakeRouter.push,
  }),
}));

vi.mock("@/lib/api", () => ({
  api: fakeApi,
}));

vi.mock("sonner", () => ({
  toast: fakeToast,
}));

vi.mock("@/components/breadcrumb", () => ({
  useBreadcrumb: fakeBreadcrumb.invoke,
}));

/* ─── Fixtures ─── */

const batchFixture: BatchDetail = {
  id: "batch-1",
  productId: "prod-1",
  productName: "Leite",
  warehouseId: "wh-1",
  warehouseName: "Central",
  originStockMovementItemId: null,
  originStockMovementId: null,
  originStockMovementCode: null,
  batchCode: "BATCH-2026-001",
  quantity: 12,
  manufacturedDate: null,
  expirationDate: "2026-12-31",
  costPrice: 100,
  sellingPrice: 250,
  createdAt: "2026-01-01T08:00:00.000Z",
  updatedAt: "2026-01-01T08:00:00.000Z",
};

const batchResponse: BatchDetailResponse = {
  success: true,
  message: null,
  data: batchFixture,
};

beforeEach(() => {
  vi.clearAllMocks();
  fakeSWR.reset();
  fakeSWR.setState("batches/batch-1", {
    data: batchResponse,
    error: null,
    isLoading: false,
    mutate: vi.fn(),
  });
});

/* ─── Pure Function Tests ─── */

describe("formatCentsToBRL", () => {
  it("formats cents to BRL currency", () => {
    expect(formatCentsToBRL(1050)).toMatch(/R\$\s?10,50/);
  });

  it("returns dash for null", () => {
    expect(formatCentsToBRL(null)).toBe("-");
  });

  it("returns dash for undefined", () => {
    expect(formatCentsToBRL(undefined)).toBe("-");
  });

  it("formats zero correctly", () => {
    expect(formatCentsToBRL(0)).toMatch(/R\$\s?0,00/);
  });
});

describe("formatCentsTotal", () => {
  it("multiplies unit price by quantity", () => {
    expect(formatCentsTotal(1000, 5)).toMatch(/R\$\s?50,00/);
  });

  it("does not prefix the formatted total value", () => {
    expect(formatCentsTotal(2000, 2)).not.toContain("Total:");
  });

  it("returns dash when price is null", () => {
    expect(formatCentsTotal(null, 10)).toBe("-");
  });
});

describe("computeMarginLabel", () => {
  it("computes positive margin percentage", () => {
    expect(computeMarginLabel(100, 250)).toBe("150%");
  });

  it("returns dash when cost is null", () => {
    expect(computeMarginLabel(null, 250)).toBe("-");
  });

  it("returns dash when selling is null", () => {
    expect(computeMarginLabel(100, null)).toBe("-");
  });
});

describe("computeMarginClass", () => {
  it("returns emerald for positive margin", () => {
    expect(computeMarginClass(100, 250)).toBe("text-emerald-400");
  });

  it("returns rose for negative margin", () => {
    expect(computeMarginClass(250, 100)).toBe("text-rose-400");
  });

  it("returns neutral when values missing", () => {
    expect(computeMarginClass(null, null)).toBe("text-neutral-500");
  });
});



describe("formatExpirationLabel", () => {
  it("handles null (no expiration)", () => {
    expect(formatExpirationLabel(null)).toBe("Sem validade cadastrada");
  });

  it("handles expired", () => {
    expect(formatExpirationLabel(-5)).toBe("Venceu há 5 dia(s)");
  });

  it("handles today", () => {
    expect(formatExpirationLabel(0)).toBe("Vence hoje");
  });

  it("handles future", () => {
    expect(formatExpirationLabel(15)).toBe("Vence em 15 dia(s)");
  });
});

describe("formatQuantityDisplay", () => {
  it("displays integer without decimals", () => {
    expect(formatQuantityDisplay(42)).toBe("42");
  });

  it("displays decimal with two places", () => {
    expect(formatQuantityDisplay(12.5)).toBe("12.50");
  });
});

describe("resolveBatchDetailTitle", () => {
  it("uses batch code when batch exists", () => {
    expect(resolveBatchDetailTitle(batchFixture, false, false)).toBe(
      "BATCH-2026-001",
    );
  });

  it("uses loading title only while request is loading without error", () => {
    expect(resolveBatchDetailTitle(null, false, true)).toBe("Carregando...");
  });

  it("uses not found title when request fails", () => {
    expect(resolveBatchDetailTitle(null, true, true)).toBe(
      "Lote não encontrado",
    );
  });
});

describe("computeExpirationDays", () => {
  it("returns null for null input", () => {
    expect(computeExpirationDays(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(computeExpirationDays(undefined)).toBeNull();
  });

  it("returns a number for valid date", () => {
    const result = computeExpirationDays("2030-12-31");
    expect(typeof result).toBe("number");
    expect(result).toBeGreaterThan(0);
  });
});

describe("computeBatchStatus", () => {
  it("returns expired for past expiration", () => {
    const status = computeBatchStatus(50, -5, "2020-01-01");
    expect(status.kind).toBe("expired");
  });

  it("returns expiring for near expiration", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    const status = computeBatchStatus(50, 15, futureDate.toISOString());
    expect(status.kind).toBe("expiring");
  });

  it("returns low_stock for low quantity", () => {
    const status = computeBatchStatus(5, null, null);
    expect(status.kind).toBe("low_stock");
  });

  it("returns ok for healthy batch", () => {
    const status = computeBatchStatus(50, 60, "2030-12-31");
    expect(status.kind).toBe("ok");
  });
});

/* ─── Hook Tests ─── */

describe("useBatchDetailModel", () => {
  it("loads batch and registers breadcrumb", () => {
    renderHook(() => useBatchDetailModel("batch-1"));

    expect(fakeSWR.hook).toHaveBeenCalledWith(
      "batches/batch-1",
      expect.any(Function),
      expect.objectContaining({
        shouldRetryOnError: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }),
    );
    expect(fakeBreadcrumb.invoke).toHaveBeenCalledWith({
      title: "BATCH-2026-001",
      backUrl: "/products",
    });
  });

  it("uses empty state when no id", () => {
    renderHook(() => useBatchDetailModel(""));

    expect(fakeSWR.hook).toHaveBeenCalledWith(
      null,
      expect.any(Function),
      expect.objectContaining({
        shouldRetryOnError: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }),
    );
    expect(fakeBreadcrumb.invoke).toHaveBeenCalledWith({
      title: "Lote não encontrado",
      backUrl: "/products",
    });
  });

  it("stops loading and registers not found breadcrumb when request fails", () => {
    fakeSWR.setState("batches/missing", {
      data: null,
      error: new Error("Not found"),
      isLoading: true,
      mutate: vi.fn(),
    });

    const { result } = renderHook(() => useBatchDetailModel("missing"));

    expect(result.current.batch).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(fakeBreadcrumb.invoke).toHaveBeenCalledWith({
      title: "Lote não encontrado",
      backUrl: "/products",
    });
  });

  it("exposes formatted derived values", () => {
    const { result } = renderHook(() => useBatchDetailModel("batch-1"));

    expect(result.current.batch).toEqual(batchFixture);
    expect(result.current.formattedCostPrice).toMatch(/R\$\s?1,00/);
    expect(result.current.formattedSellingPrice).toMatch(/R\$\s?2,50/);
    expect(result.current.status?.kind).toBeDefined();

  });

  it("deletes batch and redirects to listing", async () => {
    fakeApi.delete.mockReturnValueOnce(createJsonResponse({ success: true }));
    const mutate = vi.fn();
    fakeSWR.setState("batches/batch-1", {
      data: batchResponse,
      error: null,
      isLoading: false,
      mutate,
    });

    const { result } = renderHook(() => useBatchDetailModel("batch-1"));

    act(() => {
      result.current.onDeleteOpenChange(true);
    });
    expect(result.current.isDeleteOpen).toBe(true);

    await act(async () => {
      await result.current.onDelete();
    });

    expect(fakeApi.delete).toHaveBeenCalledWith("batches/batch-1");
    expect(fakeToast.success).toHaveBeenCalledWith("Lote removido com sucesso");
    expect(fakeRouter.push).toHaveBeenCalledWith("/batches");
    expect(mutate).not.toHaveBeenCalled();
    expect(result.current.isDeleteOpen).toBe(false);
    expect(result.current.isDeleting).toBe(false);
  });

  it("handles API error on delete with cleanup", async () => {
    fakeApi.delete.mockReturnValueOnce({
      json: vi.fn(async () => {
        throw new Error("Falha ao remover");
      }),
    });
    const mutate = vi.fn();
    fakeSWR.setState("batches/batch-1", {
      data: batchResponse,
      error: null,
      isLoading: false,
      mutate,
    });

    const { result } = renderHook(() => useBatchDetailModel("batch-1"));

    await act(async () => {
      await result.current.onDelete();
    });

    expect(fakeToast.error).toHaveBeenCalledWith("Falha ao remover");
    expect(mutate).toHaveBeenCalled();
    expect(result.current.isDeleting).toBe(false);
  });

  it("uses fallback message for non-Error throws", async () => {
    fakeApi.delete.mockReturnValueOnce({
      json: vi.fn(async () => {
        throw "kaboom";
      }),
    });
    const mutate = vi.fn();
    fakeSWR.setState("batches/batch-1", {
      data: batchResponse,
      error: null,
      isLoading: false,
      mutate,
    });

    const { result } = renderHook(() => useBatchDetailModel("batch-1"));

    await act(async () => {
      await result.current.onDelete();
    });

    expect(fakeToast.error).toHaveBeenCalledWith("Erro ao remover lote");
    expect(mutate).toHaveBeenCalled();
  });

  it("does not trigger delete when id is empty", async () => {
    const { result } = renderHook(() => useBatchDetailModel(""));

    await act(async () => {
      await result.current.onDelete();
    });

    expect(fakeApi.delete).not.toHaveBeenCalled();
  });
});
