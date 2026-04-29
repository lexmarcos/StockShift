import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildCompanyConfigFormData,
  buildCompanyConfigPayload,
  useCompanyModel,
} from "./company.model";
import type {
  CompanyConfigData,
  InfinitePayConfigData,
  UpdateCompanyData,
} from "./company.types";

const mockSWR = vi.fn();
const mockMutate = vi.fn();
const mockApiPut = vi.fn();

let authIsAdmin = true;
let authIsLoading = false;
let swrCompanyLoading = false;
let swrInfinitePayLoading = false;

const companyConfig: CompanyConfigData = {
  businessName: "StockShift LTDA",
  document: "12345678901234",
  email: "contato@stockshift.com",
  phone: "(81) 99999-9999",
  logoUrl: "/logo.png",
  isActive: true,
};

const infinitePayConfig: InfinitePayConfigData = {
  handle: "stockshift",
  docNumber: "987654321",
  configured: true,
};

vi.mock("swr", () => ({
  default: (...args: unknown[]) => mockSWR(...args),
  mutate: (...args: unknown[]) => mockMutate(...args),
}));

vi.mock("@/lib/contexts/auth-context", () => ({
  useAuth: () => ({
    isAdmin: authIsAdmin,
    isLoading: authIsLoading,
    isAuthenticated: true,
    user: { userId: "u-1" },
    logout: vi.fn(),
    hasPermission: vi.fn(),
    hasRole: vi.fn(),
  }),
}));

vi.mock("@/lib/api", () => ({
  api: {
    put: (...args: unknown[]) => mockApiPut(...args),
  },
}));

const toJson = <T,>(value: T) => ({
  json: vi.fn(async () => value),
});

beforeEach(() => {
  vi.clearAllMocks();

  authIsAdmin = true;
  authIsLoading = false;
  swrCompanyLoading = false;
  swrInfinitePayLoading = false;

  mockSWR.mockImplementation((key: string | null) => {
    if (key === "tenants/me") {
      return {
        data: {
          success: true,
          data: companyConfig,
        },
        error: null,
        isLoading: swrCompanyLoading,
      };
    }

    if (key === "tenants/me/infinitepay") {
      return {
        data: {
          success: true,
          data: infinitePayConfig,
        },
        error: null,
        isLoading: swrInfinitePayLoading,
      };
    }

    return {
      data: undefined,
      error: null,
      isLoading: false,
    };
  });

  mockApiPut.mockImplementation((url: string) => {
    if (url === "tenants/me") {
      return toJson({
        success: true,
        data: companyConfig,
      });
    }

    if (url === "tenants/me/infinitepay") {
      return toJson({
        success: true,
        data: infinitePayConfig,
      });
    }

    return toJson({
      success: true,
      data: null,
    });
  });
});

describe("company model helpers", () => {
  it("builds company config payload without logo", () => {
    const payload = buildCompanyConfigPayload({
      businessName: "StockShift",
      document: "123",
      email: "contato@stockshift.com",
      phone: "85999999999",
      logo: new File(["logo"], "logo.svg", { type: "image/svg+xml" }),
    });

    expect(payload).toEqual({
      businessName: "StockShift",
      document: "123",
      email: "contato@stockshift.com",
      phone: "85999999999",
    });
  });

  it("builds multipart company config with logo", () => {
    const logo = new File(["logo"], "logo.svg", { type: "image/svg+xml" });
    const formData = buildCompanyConfigFormData({
      businessName: "StockShift",
      document: "123",
      email: "contato@stockshift.com",
      phone: "85999999999",
      logo,
    });

    const companyPart = formData.get("company");

    expect(formData.get("logo")).toBe(logo);
    expect(companyPart).toBeInstanceOf(Blob);
    expect((companyPart as Blob).type).toBe("application/json");
    expect((companyPart as Blob).size).toBeGreaterThan(0);
  });
});

describe("useCompanyModel", () => {
  it("retorna dados da empresa e InfinitePay para admin", () => {
    const { result } = renderHook(() => useCompanyModel());

    expect(result.current.companyConfig).toEqual(companyConfig);
    expect(result.current.infinitePayConfig).toEqual(infinitePayConfig);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockSWR).toHaveBeenCalledWith("tenants/me", expect.any(Function));
    expect(mockSWR).toHaveBeenCalledWith(
      "tenants/me/infinitepay",
      expect.any(Function),
    );
  });

  it("bloqueia as consultas quando usuário não é admin", () => {
    authIsAdmin = false;

    const { result } = renderHook(() => useCompanyModel());

    expect(result.current.companyConfig).toBeNull();
    expect(result.current.infinitePayConfig).toBeNull();
    expect(mockSWR).toHaveBeenCalledWith(null, expect.any(Function));
  });

  it("combina estado de carregamento do auth e SWR", () => {
    authIsLoading = true;
    swrCompanyLoading = false;
    swrInfinitePayLoading = true;

    const { result } = renderHook(() => useCompanyModel());

    expect(result.current.isLoading).toBe(true);
  });

  it("retorna erro quando qualquer consulta falha", () => {
    const apiError = new Error("Falha na API");

    mockSWR.mockImplementation((key: string | null) => {
      if (key === "tenants/me") {
        return {
          data: undefined,
          error: apiError,
          isLoading: false,
        };
      }

      if (key === "tenants/me/infinitepay") {
        return {
          data: undefined,
          error: new Error("Erro InfinitePay"),
          isLoading: false,
        };
      }

      return {
        data: undefined,
        error: null,
        isLoading: false,
      };
    });

    const { result } = renderHook(() => useCompanyModel());

    expect(result.current.error).toBe(apiError);
  });

  it("atualiza empresa sem logo via JSON e atualiza cache", async () => {
    const { result } = renderHook(() => useCompanyModel());

    const payload: UpdateCompanyData = {
      businessName: "StockShift Editada",
      document: "11122233344",
      email: "novo@stockshift.com",
      phone: "11911111111",
    };

    let response: unknown;
    await act(async () => {
      response = await result.current.updateCompany(payload);
    });

    expect(mockApiPut).toHaveBeenCalledWith(
      "tenants/me",
      expect.objectContaining({ json: expect.objectContaining(payload) }),
    );
    expect(mockMutate).toHaveBeenCalledWith(
      "tenants/me",
      response,
      false,
    );
    expect(response).toEqual({
      success: true,
      data: companyConfig,
    });
  });

  it("atualiza empresa com logo via FormData e atualiza cache", async () => {
    const { result } = renderHook(() => useCompanyModel());

    const logo = new File(["logo"], "logo.svg", { type: "image/svg+xml" });
    const payload: UpdateCompanyData = {
      businessName: "StockShift Editada",
      document: "11122233344",
      email: "novo@stockshift.com",
      phone: "11911111111",
      logo,
    };

    await act(async () => {
      await result.current.updateCompany(payload);
    });

    const lastCall = mockApiPut.mock.calls[mockApiPut.mock.calls.length - 1];
    expect(lastCall?.[0]).toBe("tenants/me");
    expect(lastCall?.[1]).toMatchObject({
      body: expect.any(FormData),
    });

    const formData = (lastCall?.[1] as { body: FormData }).body;
    expect(formData.get("logo")).toBe(logo);
    expect(formData.get("company")).toBeInstanceOf(Blob);

    expect(mockMutate).toHaveBeenCalledWith(
      "tenants/me",
      {
        success: true,
        data: companyConfig,
      },
      false,
    );
  });

  it("atualiza configuração do InfinitePay", async () => {
    const { result } = renderHook(() => useCompanyModel());

    let response: unknown;
    await act(async () => {
      response = await result.current.updateInfinitePay({
        handle: "stockshift-updated",
        docNumber: "44455566677",
      });
    });

    expect(mockApiPut).toHaveBeenCalledWith("tenants/me/infinitepay", {
      json: {
        handle: "stockshift-updated",
        docNumber: "44455566677",
      },
    });
    expect(mockMutate).toHaveBeenCalledWith(
      "tenants/me/infinitepay",
      response,
      false,
    );
    expect(response).toEqual({
      success: true,
      data: infinitePayConfig,
    });
  });
});
