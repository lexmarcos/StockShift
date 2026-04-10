import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDashboardModel } from "./dashboard.model";

const { mockMutate, mockSwr } = vi.hoisted(() => ({
  mockMutate: vi.fn(),
  mockSwr: vi.fn(() => ({
    data: undefined,
    error: undefined,
    isLoading: true,
    mutate: vi.fn(),
  })),
}));

vi.mock("swr", () => ({
  default: mockSwr,
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe("useDashboardModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSwr.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      mutate: mockMutate,
    });
  });

  it("should return isLoading true initially", () => {
    const { result } = renderHook(() => useDashboardModel());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it("should call SWR with reports/dashboard key", () => {
    renderHook(() => useDashboardModel());
    expect(mockSwr).toHaveBeenCalledWith(
      "reports/dashboard",
      expect.any(Function),
      expect.objectContaining({
        revalidateOnFocus: false,
        dedupingInterval: 300000,
      })
    );
  });

  it("should return onRetry that calls mutate", () => {
    const { result } = renderHook(() => useDashboardModel());
    result.current.onRetry();
    expect(mockMutate).toHaveBeenCalled();
  });
});
