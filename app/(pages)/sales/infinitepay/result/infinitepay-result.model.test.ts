import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useInfinitePayResultModel } from "./infinitepay-result.model";

const searchParamsGetMock = vi.fn();
const swrMock = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => searchParamsGetMock(key),
  }),
}));

vi.mock("swr", () => ({
  default: (...args: unknown[]) => swrMock(...args),
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(() => ({
      json: vi.fn(async () => ({ success: true, message: "ok", data: null })),
    })),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  swrMock.mockReturnValue({
    data: undefined,
    error: null,
    isLoading: false,
    mutate: vi.fn(),
  });
});

describe("useInfinitePayResultModel", () => {
  it("fetches sale summary when sale_id is present", () => {
    searchParamsGetMock.mockImplementation((key: string) => {
      const values: Record<string, string> = {
        status: "success",
        sale_id: "sale-123",
      };
      return values[key] || null;
    });

    renderHook(() => useInfinitePayResultModel());

    expect(swrMock).toHaveBeenCalledWith("sales/sale-123", expect.any(Function));
  });

  it("does not fetch sale summary without sale_id", () => {
    searchParamsGetMock.mockImplementation((key: string) => {
      return key === "status" ? "error" : null;
    });

    const { result } = renderHook(() => useInfinitePayResultModel());

    expect(swrMock).toHaveBeenCalledWith(null, expect.any(Function));
    expect(result.current.hasSaleId).toBe(false);
  });

  it("falls back to error status for unknown status values", () => {
    searchParamsGetMock.mockImplementation((key: string) => {
      return key === "status" ? "unexpected" : null;
    });

    const { result } = renderHook(() => useInfinitePayResultModel());

    expect(result.current.status).toBe("error");
  });
});
