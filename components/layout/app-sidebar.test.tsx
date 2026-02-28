import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { AppSidebar } from "./app-sidebar";

type AuthMockState = {
  isLoading: boolean;
  isAdmin: boolean;
  permissions: string[];
};

const authMockState: AuthMockState = {
  isLoading: false,
  isAdmin: false,
  permissions: ["*"],
};

vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode; href: string }) => <a {...props}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/products",
}));

vi.mock("@/lib/contexts/auth-context", () => ({
  useAuth: () => ({
    user: { userId: "1", email: "test@test.com", fullName: "Test User" },
    isLoading: authMockState.isLoading,
    isAuthenticated: true,
    logout: vi.fn(),
    hasPermission: (permission: string) =>
      authMockState.permissions.includes("*") ||
      authMockState.permissions.includes(permission),
    hasRole: () => false,
    isAdmin: authMockState.isAdmin,
  }),
}));

afterEach(() => cleanup());

beforeEach(() => {
  authMockState.isLoading = false;
  authMockState.isAdmin = false;
  authMockState.permissions = ["*"];
});

describe("AppSidebar", () => {
  it("highlights the active route", () => {
    render(<AppSidebar />);

    const productsLink = screen.getByRole("link", { name: /produtos/i });
    const batchesLink = screen.getByRole("link", { name: /lotes/i });

    expect(productsLink.getAttribute("aria-current")).toBe("page");
    expect(batchesLink.getAttribute("aria-current")).toBeNull();
  });

  it("hides page links when user does not have read permission", () => {
    authMockState.permissions = ["products:read"];

    render(<AppSidebar />);

    expect(screen.queryByRole("link", { name: /dashboard/i })).toBeNull();
    expect(screen.getByRole("link", { name: /produtos/i })).toBeTruthy();
    expect(
      screen.queryByRole("link", { name: /lotes/i }),
    ).toBeNull();
    expect(
      screen.queryByRole("link", { name: /transferências/i }),
    ).toBeNull();
    expect(
      screen.queryByRole("link", { name: /marcas/i }),
    ).toBeNull();
    expect(
      screen.queryByRole("link", { name: /categorias/i }),
    ).toBeNull();
  });

  it("shows system link when user has system read permission", () => {
    authMockState.permissions = ["roles:read"];

    render(<AppSidebar />);

    expect(
      screen.getByRole("link", { name: /gerenciamento do sistema/i }),
    ).toBeTruthy();
  });

  it("shows dashboard only for admin", () => {
    authMockState.permissions = ["*"];
    authMockState.isAdmin = false;

    const { rerender } = render(<AppSidebar />);

    expect(screen.queryByRole("link", { name: /dashboard/i })).toBeNull();

    authMockState.isAdmin = true;
    rerender(<AppSidebar />);

    expect(screen.getByRole("link", { name: /dashboard/i })).toBeTruthy();
  });
});
