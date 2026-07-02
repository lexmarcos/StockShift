import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import useSWR from "swr";
import { AuthProvider, useAuth } from "./auth-context";

const routeState = vi.hoisted(() => ({
  pathname: "/products",
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => routeState.pathname,
}));

// Mock SWR
const mockMeData = {
  success: true,
  data: {
    id: "user-123",
    tenantId: "tenant-456",
    email: "test@example.com",
    fullName: "Test User",
    mustChangePassword: false,
    roles: ["VENDEDOR", "ESTOQUISTA"],
    permissions: ["PRODUCT:READ:ALL", "PRODUCT:CREATE:ALL", "STOCK:UPDATE:OWN_WAREHOUSE"],
  },
};

vi.mock("swr", () => ({
  default: vi.fn(() => ({
    data: mockMeData,
    isLoading: false,
    mutate: vi.fn(),
  })),
  useSWRConfig: vi.fn(() => ({ mutate: vi.fn() })),
}));

// Mock api
vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(() => ({ json: () => Promise.resolve(mockMeData) })),
    post: vi.fn(() => Promise.resolve()),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeState.pathname = "/products";
    vi.mocked(useSWR).mockReturnValue({
      data: mockMeData,
      isLoading: false,
      mutate: vi.fn(),
      error: undefined,
      isValidating: false,
    } as ReturnType<typeof useSWR>);
  });

  describe("auth/me fetch", () => {
    it("should fetch complete user data on change-password route", async () => {
      routeState.pathname = "/change-password";

      renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        const calls = vi.mocked(useSWR).mock.calls;
        expect(calls.some(([key]) => key === "auth/me")).toBe(true);
      });
    });

    it("should not fetch complete user data on login route", async () => {
      routeState.pathname = "/login";

      renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith("user-data");
      });

      const calls = vi.mocked(useSWR).mock.calls;
      expect(calls.some(([key]) => key === "auth/me")).toBe(false);
    });

    it("should remove legacy user data from localStorage", async () => {
      renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith("user-data");
      });
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe("hasPermission", () => {
    it("should return true for existing permission", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasPermission("PRODUCT:READ:ALL")).toBe(true);
      expect(result.current.hasPermission("PRODUCT:CREATE:ALL")).toBe(true);
    });

    it("should return false for non-existing permission", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasPermission("USER:DELETE:ALL")).toBe(false);
    });

    it("should return true for any permission when user has wildcard (*)", async () => {
      vi.mocked(useSWR).mockReturnValue({
        data: {
          success: true,
          data: {
            ...mockMeData.data,
            roles: ["ADMIN"],
            permissions: ["*"],
          },
        },
        isLoading: false,
        mutate: vi.fn(),
        error: undefined,
        isValidating: false,
      } as ReturnType<typeof useSWR>);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasPermission("ANY:PERMISSION:HERE")).toBe(true);
      expect(result.current.hasPermission("USER:DELETE:ALL")).toBe(true);
    });
  });

  describe("hasRole", () => {
    it("should return true for existing role", async () => {
      vi.mocked(useSWR).mockReturnValue({
        data: mockMeData,
        isLoading: false,
        mutate: vi.fn(),
        error: undefined,
        isValidating: false,
      } as ReturnType<typeof useSWR>);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasRole("VENDEDOR")).toBe(true);
      expect(result.current.hasRole("ESTOQUISTA")).toBe(true);
    });

    it("should return false for non-existing role", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasRole("ADMIN")).toBe(false);
    });
  });

  describe("isAdmin", () => {
    it("should return false when user is not admin", async () => {
      vi.mocked(useSWR).mockReturnValue({
        data: mockMeData,
        isLoading: false,
        mutate: vi.fn(),
        error: undefined,
        isValidating: false,
      } as ReturnType<typeof useSWR>);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAdmin).toBe(false);
    });

    it("should return true when user has ADMIN role", async () => {
      vi.mocked(useSWR).mockReturnValue({
        data: {
          success: true,
          data: {
            ...mockMeData.data,
            roles: ["ADMIN"],
            permissions: ["*"],
          },
        },
        isLoading: false,
        mutate: vi.fn(),
        error: undefined,
        isValidating: false,
      } as ReturnType<typeof useSWR>);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAdmin).toBe(true);
    });
  });

  describe("isAuthenticated", () => {
    it("should return true when auth/me returns a user", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
    });

    it("should return false when auth/me has no user data", async () => {
      vi.mocked(useSWR).mockReturnValue({
        data: undefined,
        isLoading: false,
        mutate: vi.fn(),
        error: undefined,
        isValidating: false,
      } as ReturnType<typeof useSWR>);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
