import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSaleDetailModel } from "./sales-detail.model";
import { SaleDetailResponse } from "../sales.types";

const mockSWR = vi.fn();
const mockGet = vi.fn();
const mockPut = vi.fn();
const mockMutate = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

const saleDetailResponse: SaleDetailResponse = {
  success: true,
  message: "ok",
  data: {
    id: "sale-1",
    code: "V-001",
    warehouseId: "wh-1",
    warehouseName: "CD Central",
    paymentMethod: "CASH",
    installments: null,
    discountPercentage: 10,
    subtotal: 1000,
    discountAmount: 100,
    total: 900,
    status: "COMPLETED",
    cancelledByUserId: null,
    cancelledAt: null,
    cancellationReason: null,
    createdByUserId: "user-1",
    createdAt: "2026-01-01T12:00:00Z",
    items: [
      {
        id: "item-1",
        productId: "prod-1",
        productName: "Cafe Torrado",
        productSku: "CAF-01",
        batchId: "batch-1",
        batchCode: "L001",
        quantity: 2,
        unitPrice: 500,
        totalPrice: 1000,
      },
    ],
    paymentMode: "DIRECT",
    paymentLink: null,
  },
};

let swrData: SaleDetailResponse | null = saleDetailResponse;
let swrError: Error | null = null;
let swrLoading = false;

const toJson = <T,>(value: T) => ({
  json: vi.fn(async () => value),
});

vi.mock("swr", () => ({
  default: (...args: unknown[]) => mockSWR(...args),
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    put: (...args: unknown[]) => mockPut(...args),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  swrData = saleDetailResponse;
  swrError = null;
  swrLoading = false;
  mockMutate.mockClear();

  mockSWR.mockImplementation((key: unknown) => {
    if (key === "sales/sale-1") {
      return {
        data: swrData,
        error: swrError,
        isLoading: swrLoading,
        mutate: mockMutate,
      };
    }

    return { data: null, error: null, isLoading: false, mutate: vi.fn() };
  });

  mockGet.mockImplementation(() =>
    toJson({
      success: true,
      message: "ok",
      data: saleDetailResponse.data,
    }),
  );
  mockPut.mockImplementation(() =>
    toJson({
      success: true,
      message: "cancelado",
      data: null,
    }),
  );
});

describe("useSaleDetailModel", () => {
  it("carrega detalhes de venda pelo id", () => {
    const { result } = renderHook(() => useSaleDetailModel("sale-1"));

    expect(result.current.sale).toEqual(saleDetailResponse.data);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isCancelling).toBe(false);
    expect(result.current.cancelDialogOpen).toBe(false);
  });

  it("exibe estado vazio sem id", () => {
    const { result } = renderHook(() => useSaleDetailModel(""));

    expect(result.current.sale).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(mockSWR).toHaveBeenCalledWith(null, expect.any(Function));
  });

  it("propaga erro vindo do SWR", () => {
    swrData = null;
    swrError = new Error("Falha ao carregar venda");

    const { result } = renderHook(() => useSaleDetailModel("sale-1"));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Falha ao carregar venda");
    expect(result.current.sale).toBeNull();
  });

  it("mantém estado de carregamento", () => {
    swrLoading = true;

    const { result } = renderHook(() => useSaleDetailModel("sale-1"));

    expect(result.current.isLoading).toBe(true);
  });

  it("cancela venda com sucesso e fecha diálogo", async () => {
    const { result } = renderHook(() => useSaleDetailModel("sale-1"));

    act(() => {
      result.current.setCancelDialogOpen(true);
    });

    expect(result.current.cancelDialogOpen).toBe(true);

    await act(async () => {
      await result.current.handleCancel("Cliente desistiu");
    });

    expect(mockPut).toHaveBeenCalledWith("sales/sale-1/cancel", {
      json: { cancellationReason: "Cliente desistiu" },
    });
    expect(toastSuccess).toHaveBeenCalledWith("Venda cancelada com sucesso!");
    expect(result.current.cancelDialogOpen).toBe(false);
    expect(result.current.isCancelling).toBe(false);
    expect(mockMutate).toHaveBeenCalledTimes(1);
  });

  it("exibe erro ao falhar no cancelamento", async () => {
    mockPut.mockRejectedValueOnce(new Error("Erro ao cancelar venda."));

    const { result } = renderHook(() => useSaleDetailModel("sale-1"));
    act(() => {
      result.current.setCancelDialogOpen(true);
    });

    await act(async () => {
      await result.current.handleCancel("Falha");
    });

    expect(toastError).toHaveBeenCalledWith("Erro ao cancelar venda.");
    expect(result.current.cancelDialogOpen).toBe(true);
    expect(result.current.isCancelling).toBe(false);
    expect(mockMutate).not.toHaveBeenCalled();
  });
});
