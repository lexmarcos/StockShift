import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHeaderModel } from "./header.model";

const toggleMenuMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/products",
}));

vi.mock("swr", () => ({
  default: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(() => ({
      json: vi.fn(async () => ({ success: true, data: [] })),
    })),
  },
}));

vi.mock("@/lib/contexts/auth-context", () => ({
  useAuth: () => ({
    user: null,
    logout: vi.fn(),
  }),
}));

vi.mock("@/lib/contexts/warehouse-context", () => ({
  useWarehouse: () => ({
    selectedWarehouseId: "wh-1",
    setSelectedWarehouseId: vi.fn(),
  }),
}));

vi.mock(
  "@/components/layout/mobile-menu-context",
  () => ({
    useMobileMenu: () => ({
      isOpen: false,
      openMenu: vi.fn(),
      closeMenu: vi.fn(),
      toggleMenu: toggleMenuMock,
    }),
  }),
  { virtual: true }
);

describe("useHeaderModel", () => {
  it("calls mobile menu toggle when opening menu", () => {
    const { result } = renderHook(() => useHeaderModel());

    act(() => {
      result.current.onToggleMobileMenu();
    });

    expect(toggleMenuMock).toHaveBeenCalled();
  });
});
