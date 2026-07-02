import { act, renderHook } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WarehouseProvider, useWarehouse } from "./warehouse-context";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <WarehouseProvider>{children}</WarehouseProvider>
);

describe("useWarehouse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("reads a legacy localStorage warehouse once and removes it", () => {
    localStorage.setItem("selected-warehouse-id", "legacy-warehouse");

    const { result } = renderHook(() => useWarehouse(), { wrapper });

    expect(result.current.selectedWarehouseId).toBe("legacy-warehouse");
    expect(localStorage.getItem("selected-warehouse-id")).toBeNull();
  });

  it("stores selected warehouse in sessionStorage", () => {
    const { result } = renderHook(() => useWarehouse(), { wrapper });

    act(() => {
      result.current.setSelectedWarehouseId("warehouse-1");
    });

    expect(result.current.selectedWarehouseId).toBe("warehouse-1");
    expect(sessionStorage.getItem("selected-warehouse-id")).toBe("warehouse-1");
    expect(localStorage.getItem("selected-warehouse-id")).toBeNull();
    expect(mockPush).toHaveBeenCalledWith("/sales");
  });
});
