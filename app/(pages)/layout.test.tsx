import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import PagesLayout from "./layout";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode; href: string }) => <a {...props}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/products",
}));

vi.mock("@/lib/contexts/auth-context", () => ({
  useAuth: () => ({
    user: { userId: "1", email: "test@test.com", fullName: "Test User" },
    isLoading: false,
    isAuthenticated: true,
    logout: vi.fn(),
    hasPermission: () => true,
    hasRole: () => false,
    isAdmin: false,
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
      isOpen: true,
      openMenu: vi.fn(),
      closeMenu: vi.fn(),
      toggleMenu: vi.fn(),
    }),
  }),
  { virtual: true }
);

afterEach(() => cleanup());

describe("PagesLayout", () => {
  it("renders the drawer when mobile menu context is open and removes local menu button", () => {
    render(
      <PagesLayout>
        <div>Child</div>
      </PagesLayout>
    );

    expect(screen.queryByLabelText(/abrir menu/i)).toBeNull();
    expect(screen.getByLabelText(/fechar menu/i)).toBeTruthy();
  });
});
