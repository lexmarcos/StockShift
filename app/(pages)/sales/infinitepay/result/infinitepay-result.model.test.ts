import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useInfinitePayResultModel } from "./infinitepay-result.model";

const swrMock = vi.fn();

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
    renderHook(() =>
      useInfinitePayResultModel({
        status: "success",
        saleId: "sale-123",
      }),
    );

    expect(swrMock).toHaveBeenCalledWith("sales/sale-123", expect.any(Function));
  });

  it("does not fetch sale summary without sale_id", () => {
    const { result } = renderHook(() =>
      useInfinitePayResultModel({ status: "error" }),
    );

    expect(swrMock).toHaveBeenCalledWith(null, expect.any(Function));
    expect(result.current.hasSaleId).toBe(false);
  });

  it("falls back to error status for unknown status values", () => {
    const { result } = renderHook(() =>
      useInfinitePayResultModel({ status: "unexpected" }),
    );

    expect(result.current.status).toBe("error");
  });
});
