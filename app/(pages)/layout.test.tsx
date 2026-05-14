import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { act, render, screen, cleanup } from "@testing-library/react";
import PagesLayout from "./layout";

const mobileMenuMock = vi.hoisted(() => ({
  isOpen: true,
  openMenu: vi.fn(),
  closeMenu: vi.fn(),
  toggleMenu: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode; href: string }) => <a {...props}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/products",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
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
    useMobileMenu: () => mobileMenuMock,
  }),
  { virtual: true }
);

const getClassTokens = (element: Element | null): string[] =>
  element?.getAttribute("class")?.split(/\s+/) ?? [];

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

beforeEach(() => {
  mobileMenuMock.isOpen = true;
  vi.clearAllMocks();
});

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

  it("keeps the mobile menu logo mounted while the drawer is closed", () => {
    mobileMenuMock.isOpen = false;

    const { container } = render(
      <PagesLayout>
        <div>Child</div>
      </PagesLayout>
    );

    const mobileMenu = container.querySelector('[data-slot="mobile-menu"]');

    expect(mobileMenu).toBeTruthy();
    expect(getClassTokens(mobileMenu)).toContain("hidden");
    expect(mobileMenu?.getAttribute("aria-hidden")).toBe("true");
    expect(mobileMenu?.hasAttribute("inert")).toBe(true);
    expect(mobileMenu?.querySelector('img[alt="StockShift"]')).toBeTruthy();
  });

  it("keeps the drawer visible while the close animation runs", () => {
    vi.useFakeTimers();

    const { container, rerender } = render(
      <PagesLayout>
        <div>Child</div>
      </PagesLayout>
    );

    mobileMenuMock.isOpen = false;
    rerender(
      <PagesLayout>
        <div>Child</div>
      </PagesLayout>
    );

    const mobileMenu = container.querySelector('[data-slot="mobile-menu"]');
    const panel = container.querySelector('[data-slot="mobile-menu-panel"]');

    expect(mobileMenu?.className).toContain("animate-out");
    expect(mobileMenu?.className).not.toContain("animate-in");
    expect(mobileMenu?.className).toContain("fill-mode-forwards");
    expect(getClassTokens(mobileMenu)).not.toContain("hidden");
    expect(panel?.className).toContain("slide-out-to-left-8");
    expect(panel?.className).toContain("fill-mode-forwards");

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(getClassTokens(mobileMenu)).toContain("hidden");
  });
});
