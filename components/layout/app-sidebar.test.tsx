import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { AppSidebar } from "./app-sidebar";

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

afterEach(() => cleanup());

describe("AppSidebar", () => {
  it("highlights the active route", () => {
    render(<AppSidebar />);

    const productsLink = screen.getByRole("link", { name: /produtos/i });
    const batchesLink = screen.getByRole("link", { name: /batches/i });

    expect(productsLink.getAttribute("aria-current")).toBe("page");
    expect(batchesLink.getAttribute("aria-current")).toBeNull();
  });
});
