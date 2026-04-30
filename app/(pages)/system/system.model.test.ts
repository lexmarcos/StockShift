import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSystemModel } from "./system.model";

interface UsersResponse {
  success: boolean;
  data: { isActive: boolean }[];
}

interface RolesResponse {
  success: boolean;
  data: unknown[];
}

const mockSWR = vi.fn();

let authIsAdmin = true;
let authIsLoading = false;

vi.mock("swr", () => ({
  default: (...args: unknown[]) => mockSWR(...args),
}));

vi.mock("@/lib/contexts/auth-context", () => ({
  useAuth: () => ({
    isAdmin: authIsAdmin,
    isLoading: authIsLoading,
    isAuthenticated: true,
    user: { userId: "u1" },
    logout: vi.fn(),
    hasPermission: vi.fn(),
    hasRole: vi.fn(),
  }),
}));

const usersResponse: UsersResponse = {
  success: true,
  data: [{ isActive: true }, { isActive: false }, { isActive: true }],
};

const rolesResponse: RolesResponse = {
  success: true,
  data: [{}, {}],
};

beforeEach(() => {
  vi.clearAllMocks();
  authIsAdmin = true;
  authIsLoading = false;

  mockSWR.mockImplementation((key: string | null) => {
    if (key === "users") {
      return {
        data: usersResponse,
        error: null,
        isLoading: false,
      };
    }

    if (key === "roles") {
      return {
        data: rolesResponse,
        error: null,
        isLoading: false,
      };
    }

    return {
      data: undefined,
      error: null,
      isLoading: false,
    };
  });
});

describe("useSystemModel", () => {
  it("calcula métricas da home de sistema para admin", () => {
    const { result } = renderHook(() => useSystemModel());

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.activeUsersCount).toBe(2);
    expect(result.current.rolesCount).toBe(2);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockSWR).toHaveBeenCalledWith("users", expect.any(Function));
    expect(mockSWR).toHaveBeenCalledWith("roles", expect.any(Function));
  });

  it("bloqueia chamadas de dados quando não é admin", () => {
    authIsAdmin = false;

    const { result } = renderHook(() => useSystemModel());

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.activeUsersCount).toBe(0);
    expect(result.current.rolesCount).toBe(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockSWR).toHaveBeenCalledWith(null, expect.any(Function));
  });

  it("propaga erro de usuários com prioridade", () => {
    const usersError = new Error("falha ao carregar usuários");

    mockSWR.mockImplementation((key: string | null) => {
      if (key === "users") {
        return {
          data: null,
          error: usersError,
          isLoading: false,
        };
      }

      if (key === "roles") {
        return {
          data: rolesResponse,
          error: new Error("falha ao carregar roles"),
          isLoading: false,
        };
      }

      return {
        data: undefined,
        error: null,
        isLoading: false,
      };
    });

    const { result } = renderHook(() => useSystemModel());

    expect(result.current.error).toBe(usersError);
    expect(result.current.activeUsersCount).toBe(0);
    expect(result.current.rolesCount).toBe(2);
  });

  it("combina estado de carregamento do auth e SWR", () => {
    authIsLoading = true;
    const usersLoading = false;
    const rolesLoading = true;

    mockSWR.mockImplementation((key: string | null) => {
      if (key === "users") {
        return {
          data: usersResponse,
          error: null,
          isLoading: usersLoading,
        };
      }

      if (key === "roles") {
        return {
          data: rolesResponse,
          error: null,
          isLoading: rolesLoading,
        };
      }

      return {
        data: undefined,
        error: null,
        isLoading: false,
      };
    });

    const { result } = renderHook(() => useSystemModel());

    expect(result.current.isLoading).toBe(true);
  });
});
