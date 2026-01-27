import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useRegisterModel } from "./register.model";
import { registerSchema } from "./register.schema";

// Mock dependencies
const mockPush = vi.fn();
const mockSetUser = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("@/lib/contexts/auth-context", () => ({
  useAuth: () => ({
    setUser: mockSetUser,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockApiPost = vi.fn();
vi.mock("@/lib/api", () => ({
  api: {
    post: (...args: unknown[]) => mockApiPost(...args),
  },
}));

import { toast } from "sonner";

describe("registerSchema", () => {
  it("should reject empty company name", () => {
    const result = registerSchema.safeParse({
      companyName: "",
      email: "test@example.com",
      password: "123456",
      confirmPassword: "123456",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid email", () => {
    const result = registerSchema.safeParse({
      companyName: "Empresa",
      email: "invalid-email",
      password: "123456",
      confirmPassword: "123456",
    });
    expect(result.success).toBe(false);
  });

  it("should reject password with less than 6 characters", () => {
    const result = registerSchema.safeParse({
      companyName: "Empresa",
      email: "test@example.com",
      password: "12345",
      confirmPassword: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("should reject mismatched passwords", () => {
    const result = registerSchema.safeParse({
      companyName: "Empresa",
      email: "test@example.com",
      password: "123456",
      confirmPassword: "654321",
    });
    expect(result.success).toBe(false);
  });

  it("should accept valid data", () => {
    const result = registerSchema.safeParse({
      companyName: "Empresa Teste",
      email: "test@example.com",
      password: "123456",
      confirmPassword: "123456",
    });
    expect(result.success).toBe(true);
  });
});

describe("useRegisterModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useRegisterModel());

    expect(result.current.form.getValues()).toEqual({
      companyName: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    expect(result.current.isLoading).toBe(false);
  });

  it("should register successfully and redirect", async () => {
    const mockResponse = {
      success: true,
      message: "Registration successful",
      data: {
        tenantId: "tenant-123",
        businessName: "Empresa Teste",
        userId: "user-123",
        userEmail: "test@example.com",
        accessToken: "token-123",
        refreshToken: "refresh-123",
        tokenType: "Bearer",
        expiresIn: 3600000,
      },
    };

    mockApiPost.mockReturnValue({
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useRegisterModel());

    await act(async () => {
      await result.current.onSubmit({
        companyName: "Empresa Teste",
        email: "test@example.com",
        password: "123456",
        confirmPassword: "123456",
      });
    });

    expect(mockApiPost).toHaveBeenCalledWith("auth/register", {
      json: {
        companyName: "Empresa Teste",
        email: "test@example.com",
        password: "123456",
      },
    });

    expect(mockSetUser).toHaveBeenCalledWith({
      userId: "user-123",
      email: "test@example.com",
      fullName: "Empresa Teste",
    });

    expect(toast.success).toHaveBeenCalledWith("Empresa cadastrada com sucesso!");
    expect(mockPush).toHaveBeenCalledWith("/warehouses");
  });

  it("should handle API error with message", async () => {
    const { HTTPError } = await import("ky");

    const errorResponse = {
      message: "E-mail já cadastrado",
    };

    const httpError = new HTTPError(
      new Response(JSON.stringify(errorResponse), { status: 400 }),
      new Request("http://test.com"),
      {}
    );

    mockApiPost.mockReturnValue({
      json: () => Promise.reject(httpError),
    });

    const { result } = renderHook(() => useRegisterModel());

    await act(async () => {
      await result.current.onSubmit({
        companyName: "Empresa Teste",
        email: "existing@example.com",
        password: "123456",
        confirmPassword: "123456",
      });
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("E-mail já cadastrado");
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should handle generic error", async () => {
    mockApiPost.mockReturnValue({
      json: () => Promise.reject(new Error("Network error")),
    });

    const { result } = renderHook(() => useRegisterModel());

    await act(async () => {
      await result.current.onSubmit({
        companyName: "Empresa Teste",
        email: "test@example.com",
        password: "123456",
        confirmPassword: "123456",
      });
    });

    expect(toast.error).toHaveBeenCalledWith("Falha no cadastro. Tente novamente.");
  });

  it("should not send confirmPassword to API", async () => {
    mockApiPost.mockReturnValue({
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            tenantId: "tenant-123",
            businessName: "Empresa Teste",
            userId: "user-123",
            userEmail: "test@example.com",
          },
        }),
    });

    const { result } = renderHook(() => useRegisterModel());

    await act(async () => {
      await result.current.onSubmit({
        companyName: "Empresa Teste",
        email: "test@example.com",
        password: "123456",
        confirmPassword: "123456",
      });
    });

    const apiCallPayload = mockApiPost.mock.calls[0][1].json;
    expect(apiCallPayload).not.toHaveProperty("confirmPassword");
    expect(apiCallPayload).toEqual({
      companyName: "Empresa Teste",
      email: "test@example.com",
      password: "123456",
    });
  });

  it("should set isLoading to false after submission completes", async () => {
    mockApiPost.mockReturnValue({
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            tenantId: "tenant-123",
            businessName: "Empresa Teste",
            userId: "user-123",
            userEmail: "test@example.com",
          },
        }),
    });

    const { result } = renderHook(() => useRegisterModel());

    expect(result.current.isLoading).toBe(false);

    await act(async () => {
      await result.current.onSubmit({
        companyName: "Empresa Teste",
        email: "test@example.com",
        password: "123456",
        confirmPassword: "123456",
      });
    });

    expect(result.current.isLoading).toBe(false);
  });
});
