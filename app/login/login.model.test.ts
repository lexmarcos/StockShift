import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useLoginModel } from "./login.model";
import { loginSchema } from "./login.schema";

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

vi.mock("@hcaptcha/react-hcaptcha", () => ({
  __esModule: true,
  default: vi.fn().mockImplementation(() => null),
}));

import { toast } from "sonner";

const successfulLoginResponse = {
  success: true,
  message: null,
  data: {
    tokenType: "Bearer",
    expiresIn: 3600,
    userId: "user-123",
    email: "user@example.com",
    fullName: "User Name",
    requiresCaptcha: false,
    mustChangePassword: false,
  },
};

describe("loginSchema", () => {
  it("should reject invalid email", () => {
    const result = loginSchema.safeParse({
      email: "invalid",
      password: "123456",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("should accept valid credentials", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "123456",
    });
    expect(result.success).toBe(true);
  });
});

describe("useLoginModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("should initialize with default form values and state", () => {
    const { result } = renderHook(() => useLoginModel());

    expect(result.current.form.getValues()).toEqual({
      email: "",
      password: "",
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.requiresCaptcha).toBe(false);
  });

  it("should login successfully and redirect to /warehouses", async () => {
    mockApiPost.mockReturnValue({
      json: () => Promise.resolve(successfulLoginResponse),
    });

    const { result } = renderHook(() => useLoginModel());

    await act(async () => {
      await result.current.onSubmit({
        email: "user@example.com",
        password: "123456",
      });
    });

    expect(mockApiPost).toHaveBeenCalledWith("auth/login", {
      json: {
        email: "user@example.com",
        password: "123456",
      },
    });

    expect(mockSetUser).toHaveBeenCalledWith({
      userId: "user-123",
      email: "user@example.com",
      fullName: "User Name",
    });

    expect(toast.success).toHaveBeenCalledWith("Login realizado com sucesso!");
    expect(mockPush).toHaveBeenCalledWith("/warehouses");
    expect(result.current.isLoading).toBe(false);
  });

  it("should clear stale selected warehouse after successful login", async () => {
    localStorage.setItem("selected-warehouse-id", "old-warehouse");
    mockApiPost.mockReturnValue({
      json: () => Promise.resolve(successfulLoginResponse),
    });

    const { result } = renderHook(() => useLoginModel());

    await act(async () => {
      await result.current.onSubmit({
        email: "user@example.com",
        password: "123456",
      });
    });

    expect(localStorage.getItem("selected-warehouse-id")).toBeNull();
  });

  it("should redirect to /change-password when mustChangePassword is true", async () => {
    const response = {
      ...successfulLoginResponse,
      data: {
        ...successfulLoginResponse.data,
        mustChangePassword: true,
      },
    };

    mockApiPost.mockReturnValue({
      json: () => Promise.resolve(response),
    });

    const { result } = renderHook(() => useLoginModel());

    await act(async () => {
      await result.current.onSubmit({
        email: "user@example.com",
        password: "123456",
      });
    });

    expect(mockPush).toHaveBeenCalledWith("/change-password");
    expect(mockPush).not.toHaveBeenCalledWith("/warehouses");
  });

  it("should handle HTTP error with message from API", async () => {
    const { HTTPError } = await import("ky");

    const errorData = { message: "Credenciais inválidas" };
    const httpError = new HTTPError(
      new Response(JSON.stringify(errorData), { status: 401 }),
      new Request("http://test.com"),
      {}
    );

    mockApiPost.mockReturnValue({
      json: () => Promise.reject(httpError),
    });

    const { result } = renderHook(() => useLoginModel());

    await act(async () => {
      await result.current.onSubmit({
        email: "user@example.com",
        password: "wrong",
      });
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Credenciais inválidas");
    });

    expect(result.current.errorMessage).toBe("Credenciais inválidas");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should enable captcha when backend returns 'Captcha token is required'", async () => {
    const { HTTPError } = await import("ky");

    const errorData = { message: "Captcha token is required" };
    const httpError = new HTTPError(
      new Response(JSON.stringify(errorData), { status: 400 }),
      new Request("http://test.com"),
      {}
    );

    mockApiPost.mockReturnValue({
      json: () => Promise.reject(httpError),
    });

    const { result } = renderHook(() => useLoginModel());

    await act(async () => {
      await result.current.onSubmit({
        email: "user@example.com",
        password: "123456",
      });
    });

    await waitFor(() => {
      expect(result.current.requiresCaptcha).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith("Captcha token is required");
  });

  it("should show error when captcha is required but not solved", async () => {
    const { HTTPError } = await import("ky");

    const errorData = { message: "Captcha token is required" };
    const httpError = new HTTPError(
      new Response(JSON.stringify(errorData), { status: 400 }),
      new Request("http://test.com"),
      {}
    );

    mockApiPost.mockReturnValue({
      json: () => Promise.reject(httpError),
    });

    const { result } = renderHook(() => useLoginModel());

    await act(async () => {
      await result.current.onSubmit({
        email: "user@example.com",
        password: "123456",
      });
    });

    await waitFor(() => {
      expect(result.current.requiresCaptcha).toBe(true);
    });

    vi.clearAllMocks();

    await act(async () => {
      await result.current.onSubmit({
        email: "user@example.com",
        password: "123456",
      });
    });

    expect(toast.error).toHaveBeenCalledWith("Por favor, resolva o captcha.");
    expect(result.current.errorMessage).toBe("Por favor, resolva o captcha.");
  });

  it("should send captchaToken when captcha is required and solved", async () => {
    const { HTTPError } = await import("ky");

    const errorData = { message: "Captcha token is required" };
    const httpError = new HTTPError(
      new Response(JSON.stringify(errorData), { status: 400 }),
      new Request("http://test.com"),
      {}
    );

    mockApiPost.mockReturnValue({
      json: () => Promise.reject(httpError),
    });

    const { result } = renderHook(() => useLoginModel());

    await act(async () => {
      await result.current.onSubmit({
        email: "user@example.com",
        password: "123456",
      });
    });

    await waitFor(() => {
      expect(result.current.requiresCaptcha).toBe(true);
    });

    const responseWithCaptcha = {
      ...successfulLoginResponse,
      data: { ...successfulLoginResponse.data, requiresCaptcha: true },
    };

    mockApiPost.mockReturnValue({
      json: () => Promise.resolve(responseWithCaptcha),
    });

    act(() => {
      result.current.onCaptchaVerify("captcha-token-123");
    });

    await act(async () => {
      await result.current.onSubmit({
        email: "user@example.com",
        password: "123456",
      });
    });

    expect(mockApiPost).toHaveBeenCalledWith("auth/login", {
      json: {
        email: "user@example.com",
        password: "123456",
        captchaToken: "captcha-token-123",
      },
    });
  });

  it("should clear captcha token on expire", async () => {
    const { HTTPError } = await import("ky");

    const errorData = { message: "Captcha token is required" };
    const httpError = new HTTPError(
      new Response(JSON.stringify(errorData), { status: 400 }),
      new Request("http://test.com"),
      {}
    );

    mockApiPost.mockReturnValue({
      json: () => Promise.reject(httpError),
    });

    const { result } = renderHook(() => useLoginModel());

    await act(async () => {
      await result.current.onSubmit({
        email: "user@example.com",
        password: "123456",
      });
    });

    await waitFor(() => {
      expect(result.current.requiresCaptcha).toBe(true);
    });

    act(() => {
      result.current.onCaptchaVerify("some-token");
    });

    act(() => {
      result.current.onCaptchaExpire();
    });

    vi.clearAllMocks();

    await act(async () => {
      await result.current.onSubmit({
        email: "user@example.com",
        password: "123456",
      });
    });

    expect(result.current.errorMessage).toBe("Por favor, resolva o captcha.");
    expect(toast.error).toHaveBeenCalledWith("Por favor, resolva o captcha.");
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("should handle HTTP error with unparseable response body", async () => {
    const { HTTPError } = await import("ky");

    const httpError = new HTTPError(
      new Response("not json", { status: 500 }),
      new Request("http://test.com"),
      {}
    );

    mockApiPost.mockReturnValue({
      json: () => Promise.reject(httpError),
    });

    const { result } = renderHook(() => useLoginModel());

    await act(async () => {
      await result.current.onSubmit({
        email: "user@example.com",
        password: "123456",
      });
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBeTruthy();
    });

    expect(toast.error).toHaveBeenCalled();
  });

  it("should handle non-HTTP error gracefully", async () => {
    mockApiPost.mockReturnValue({
      json: () => Promise.reject(new Error("Network failure")),
    });

    const { result } = renderHook(() => useLoginModel());

    await act(async () => {
      await result.current.onSubmit({
        email: "user@example.com",
        password: "123456",
      });
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBe(
        "Falha no login. Verifique suas credenciais."
      );
    });

    expect(toast.error).toHaveBeenCalledWith(
      "Falha no login. Verifique suas credenciais."
    );
  });

  it("should set isLoading to false after error", async () => {
    mockApiPost.mockReturnValue({
      json: () => Promise.reject(new Error("fail")),
    });

    const { result } = renderHook(() => useLoginModel());

    await act(async () => {
      await result.current.onSubmit({
        email: "user@example.com",
        password: "123456",
      });
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("should not call API when captcha is required and not solved", async () => {
    const { HTTPError } = await import("ky");

    const errorData = { message: "Captcha token is required" };
    const httpError = new HTTPError(
      new Response(JSON.stringify(errorData), { status: 400 }),
      new Request("http://test.com"),
      {}
    );

    mockApiPost.mockReturnValue({
      json: () => Promise.reject(httpError),
    });

    const { result } = renderHook(() => useLoginModel());

    await act(async () => {
      await result.current.onSubmit({
        email: "user@example.com",
        password: "123456",
      });
    });

    await waitFor(() => {
      expect(result.current.requiresCaptcha).toBe(true);
    });

    vi.clearAllMocks();

    await act(async () => {
      await result.current.onSubmit({
        email: "user@example.com",
        password: "123456",
      });
    });

    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("should clear errorMessage on new submission attempt", async () => {
    mockApiPost.mockReturnValue({
      json: () => Promise.reject(new Error("fail")),
    });

    const { result } = renderHook(() => useLoginModel());

    await act(async () => {
      await result.current.onSubmit({
        email: "user@example.com",
        password: "wrong",
      });
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBeTruthy();
    });

    mockApiPost.mockReturnValue({
      json: () => Promise.resolve(successfulLoginResponse),
    });

    await act(async () => {
      await result.current.onSubmit({
        email: "user@example.com",
        password: "123456",
      });
    });

    expect(result.current.errorMessage).toBeNull();
  });

  it("should set requiresCaptcha from successful response", async () => {
    const response = {
      ...successfulLoginResponse,
      data: { ...successfulLoginResponse.data, requiresCaptcha: true },
    };

    mockApiPost.mockReturnValue({
      json: () => Promise.resolve(response),
    });

    const { result } = renderHook(() => useLoginModel());

    await act(async () => {
      await result.current.onSubmit({
        email: "user@example.com",
        password: "123456",
      });
    });

    expect(result.current.requiresCaptcha).toBe(true);
  });
});
