import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useChangePasswordModel } from "./change-password.model";
import { changePasswordSchema, type ChangePasswordFormData } from "./change-password.schema";

type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

type FakeApiJsonResponseResult =
  | { type: "success"; value: unknown }
  | { type: "error"; value: unknown };

class FakeApiJsonResponse {
  public readonly json = vi.fn<() => Promise<unknown>>();

  public constructor(result: FakeApiJsonResponseResult) {
    if (result.type === "error") {
      this.json.mockRejectedValue(result.value);
      return;
    }

    this.json.mockResolvedValue(result.value);
  }
}

const fakeApi = vi.hoisted(() => {
  class FakeApi {
    public readonly post = vi.fn<
      (url: string, options: { json: ChangePasswordRequest }) => FakeApiJsonResponse
    >();
  }

  return new FakeApi();
});

const fakeRouter = vi.hoisted(() => {
  class FakeRouter {
    public readonly push = vi.fn<(url: string) => void>();
  }

  return new FakeRouter();
});

const fakeToast = vi.hoisted(() => {
  class FakeToast {
    public readonly success = vi.fn<(message: string) => void>();
    public readonly error = vi.fn<(message: string) => void>();
  }

  return new FakeToast();
});

const fakeSWR = vi.hoisted(() => {
  class FakeSWR {
    public readonly mutate = vi.fn<(key: string) => Promise<unknown> | void>();
  }

  return new FakeSWR();
});

vi.mock("next/navigation", () => ({
  useRouter: () => fakeRouter,
}));

vi.mock("@/lib/api", () => ({
  api: {
    post: (...args: Parameters<(typeof fakeApi)["post"]>) => fakeApi.post(...args),
  },
}));

vi.mock("sonner", () => ({
  toast: fakeToast,
}));

vi.mock("swr", () => ({
  mutate: (...args: Parameters<(typeof fakeSWR)["mutate"]>) =>
    fakeSWR.mutate(...args),
}));

describe("changePasswordSchema", () => {
  const basePayload: ChangePasswordFormData = {
    currentPassword: "old-password",
    newPassword: "new-password",
    confirmPassword: "new-password",
  };

  it("rejects empty current password", () => {
    const result = changePasswordSchema.safeParse({
      ...basePayload,
      currentPassword: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects short new password", () => {
    const result = changePasswordSchema.safeParse({
      ...basePayload,
      newPassword: "12345",
      confirmPassword: "12345",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty confirm password", () => {
    const result = changePasswordSchema.safeParse({
      ...basePayload,
      confirmPassword: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects mismatched confirmation", () => {
    const result = changePasswordSchema.safeParse({
      ...basePayload,
      confirmPassword: "different-password",
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid credentials", () => {
    const result = changePasswordSchema.safeParse(basePayload);

    expect(result.success).toBe(true);
  });
});

describe("useChangePasswordModel", () => {
  const validPayload: ChangePasswordFormData = {
    currentPassword: "senha-atual",
    newPassword: "nova-senha-123",
    confirmPassword: "nova-senha-123",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    fakeApi.post.mockReturnValue(new FakeApiJsonResponse({
      type: "success",
      value: { success: true },
    }));
  });

  it("initializes form defaults and loading state", () => {
    const { result } = renderHook(() => useChangePasswordModel());

    expect(result.current.form.getValues()).toEqual({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    expect(result.current.isLoading).toBe(false);
  });

  it("submits new password and redirects on success", async () => {
    const { result } = renderHook(() => useChangePasswordModel());

    await act(async () => {
      await result.current.onSubmit(validPayload);
    });

    expect(fakeApi.post).toHaveBeenCalledWith("auth/change-password", {
      json: {
        currentPassword: validPayload.currentPassword,
        newPassword: validPayload.newPassword,
      },
    });
    expect(fakeToast.success).toHaveBeenCalledWith("Senha alterada com sucesso!");
    expect(fakeSWR.mutate).toHaveBeenCalledWith("auth/me");
    expect(fakeRouter.push).toHaveBeenCalledWith("/warehouses");
    expect(result.current.isLoading).toBe(false);
  });

  it("does not send confirmPassword to API payload", async () => {
    const { result } = renderHook(() => useChangePasswordModel());

    await act(async () => {
      await result.current.onSubmit(validPayload);
    });

    const requestPayload = fakeApi.post.mock.calls[0][1].json;
    expect(requestPayload).toEqual({
      currentPassword: validPayload.currentPassword,
      newPassword: validPayload.newPassword,
    });
    expect(requestPayload).not.toHaveProperty("confirmPassword");
  });

  it("handles HTTP error with API message", async () => {
    const { HTTPError } = await import("ky");
    const response = new Response(JSON.stringify({ message: "Senha incorreta" }), {
      status: 400,
    });
    const httpError = new HTTPError(response, new Request("http://localhost"));

    fakeApi.post.mockReturnValue(
      new FakeApiJsonResponse({
        type: "error",
        value: httpError,
      }),
    );

    const { result } = renderHook(() => useChangePasswordModel());

    await act(async () => {
      await result.current.onSubmit(validPayload);
    });

    expect(fakeToast.error).toHaveBeenCalledWith("Senha incorreta");
    expect(fakeRouter.push).not.toHaveBeenCalled();
    expect(fakeSWR.mutate).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("falls back to generic message when HTTP error has no message", async () => {
    const { HTTPError } = await import("ky");
    const response = new Response("not-json", { status: 400 });
    const httpError = new HTTPError(response, new Request("http://localhost"));

    fakeApi.post.mockReturnValue(
      new FakeApiJsonResponse({
        type: "error",
        value: httpError,
      }),
    );

    const { result } = renderHook(() => useChangePasswordModel());

    await act(async () => {
      await result.current.onSubmit(validPayload);
    });

    expect(fakeToast.error).toHaveBeenCalledWith(
      "Não foi possível alterar a senha. Tente novamente.",
    );
  });

  it("handles non-HTTP errors with generic message", async () => {
    fakeApi.post.mockReturnValue(
      new FakeApiJsonResponse({
        type: "error",
        value: new Error("Network error"),
      }),
    );

    const { result } = renderHook(() => useChangePasswordModel());

    await act(async () => {
      await result.current.onSubmit(validPayload);
    });

    expect(fakeToast.error).toHaveBeenCalledWith(
      "Não foi possível alterar a senha. Tente novamente.",
    );
    expect(result.current.isLoading).toBe(false);
  });
});
