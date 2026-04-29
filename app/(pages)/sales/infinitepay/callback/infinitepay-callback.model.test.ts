import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildInfinitePayConfirmParams,
  buildInfinitePayResultPath,
  useInfinitePayCallbackModel,
} from "./infinitepay-callback.model";
import type { InfinitePayConfirmResponse } from "./infinitepay-callback.types";

type JsonResponse<T> = {
  json: () => Promise<T>;
};

const createJsonResponse = <T>(payload: T): JsonResponse<T> => ({
  json: vi.fn(async () => payload),
});

const createRejectedJsonResponse = (error: unknown): JsonResponse<never> => ({
  json: vi.fn(async () => {
    throw error;
  }),
});

const fakeApi = vi.hoisted(() => {
  class FakeInfinitePayCallbackApi {
    public readonly get = vi.fn<
      (url: string, options: { searchParams: URLSearchParams }) => JsonResponse<unknown>
    >();
  }

  return new FakeInfinitePayCallbackApi();
});

const fakeRouter = vi.hoisted(() => {
  class FakeInfinitePayCallbackRouter {
    public readonly replace = vi.fn<(path: string) => void>();
  }

  return new FakeInfinitePayCallbackRouter();
});

const fakeSearchParams = vi.hoisted(() => {
  class FakeInfinitePayCallbackSearchParams {
    private query = "";

    public setQuery(value: string): void {
      this.query = value;
    }

    public toString(): string {
      return this.query;
    }
  }

  return new FakeInfinitePayCallbackSearchParams();
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: fakeRouter.replace,
  }),
  useSearchParams: () => fakeSearchParams,
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: (...args: Parameters<typeof fakeApi.get>) => fakeApi.get(...args),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  fakeSearchParams.setQuery("order_id=sale-123");
  fakeApi.get.mockReturnValue(
    createJsonResponse<InfinitePayConfirmResponse>({
      success: true,
      message: "ok",
      data: {
        status: "success",
        saleId: "sale-123",
        message: null,
      },
    }),
  );
});

describe("buildInfinitePayConfirmParams", () => {
  it("keeps only InfinitePay callback parameters", () => {
    const params = buildInfinitePayConfirmParams(
      "order_id=sale-123&nsu=abc&aut=999&card_brand=visa&ignored=value",
    );

    expect(params.get("order_id")).toBe("sale-123");
    expect(params.get("nsu")).toBe("abc");
    expect(params.get("aut")).toBe("999");
    expect(params.get("card_brand")).toBe("visa");
    expect(params.has("ignored")).toBe(false);
  });
});

describe("buildInfinitePayResultPath", () => {
  it("builds success result URL with sale id", () => {
    const path = buildInfinitePayResultPath({
      status: "success",
      saleId: "sale-123",
      message: null,
    });

    expect(path).toBe("/sales/infinitepay/result?status=success&sale_id=sale-123");
  });

  it("builds error result URL with message", () => {
    const path = buildInfinitePayResultPath({
      status: "error",
      saleId: null,
      message: "invalid_order",
    });

    expect(path).toBe("/sales/infinitepay/result?status=error&message=invalid_order");
  });
});

describe("useInfinitePayCallbackModel", () => {
  it("confirma pagamento com sucesso e navega para página de resultado", async () => {
    fakeSearchParams.setQuery(
      "order_id=sale-123&nsu=abc&aut=999&card_brand=visa",
    );

    const { result } = renderHook(() => useInfinitePayCallbackModel());

    await waitFor(() => {
      expect(fakeApi.get).toHaveBeenCalledTimes(1);
    });

    expect(fakeApi.get).toHaveBeenCalledWith(
      "sales/infinitepay/confirm",
      expect.objectContaining({
        searchParams: expect.any(URLSearchParams),
      }),
    );

    const [, requestOptions] = fakeApi.get.mock.calls[0] as [
      string,
      { searchParams: URLSearchParams },
    ];
    expect(requestOptions.searchParams.toString()).toBe(
      "order_id=sale-123&nsu=abc&aut=999&card_brand=visa",
    );
    expect(fakeRouter.replace).toHaveBeenCalledWith(
      "/sales/infinitepay/result?status=success&sale_id=sale-123",
    );
    expect(result.current.isConfirming).toBe(true);
    expect(result.current.hasError).toBe(false);
  });

  it("redireciona para erro quando order_id estiver ausente", async () => {
    fakeSearchParams.setQuery("nsu=abc&aut=999");

    renderHook(() => useInfinitePayCallbackModel());

    await waitFor(() => {
      expect(fakeRouter.replace).toHaveBeenCalledWith(
        "/sales/infinitepay/result?status=error&message=invalid_order",
      );
    });

    expect(fakeApi.get).not.toHaveBeenCalled();
  });

  it("define estado de erro quando confirmação falha", async () => {
    fakeSearchParams.setQuery("order_id=sale-fail");
    fakeApi.get.mockImplementation(() => createRejectedJsonResponse(new Error("network")));

    const { result } = renderHook(() => useInfinitePayCallbackModel());

    await waitFor(() => {
      expect(fakeApi.get).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(result.current.hasError).toBe(true);
    });

    expect(result.current.isConfirming).toBe(false);
    expect(fakeRouter.replace).not.toHaveBeenCalled();
  });

  it("reexecuta confirmação quando retryConfirmation é chamado", async () => {
    fakeSearchParams.setQuery("order_id=sale-123");
    let attempts = 0;
    fakeApi.get.mockImplementation(() => {
      attempts += 1;
      if (attempts <= 2) {
        return createRejectedJsonResponse(new Error("network"));
      }

      return createJsonResponse<InfinitePayConfirmResponse>({
        success: true,
        message: "ok",
        data: { status: "success", saleId: "sale-123", message: null },
      });
    });

    const { result } = renderHook(() => useInfinitePayCallbackModel());

    await waitFor(() => {
      expect(fakeApi.get).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(result.current.hasError).toBe(true);
    });

    await act(async () => {
      await result.current.retryConfirmation();
    });

    await waitFor(() => {
      expect(result.current.hasError).toBe(false);
    });

    expect(fakeRouter.replace).toHaveBeenCalledWith(
      "/sales/infinitepay/result?status=success&sale_id=sale-123",
    );
  });
});
