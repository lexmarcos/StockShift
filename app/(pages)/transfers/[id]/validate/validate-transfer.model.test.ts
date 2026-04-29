import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useValidateTransferModel } from "./validate-transfer.model";
import type { ValidationLogEntry } from "../../transfers.types";

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockSWR = vi.fn();
const mockMutateLogs = vi.fn();
const routerPush = vi.fn();
const mockUseBreadcrumb = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

const transferId = "transfer-123";

const transferResponse = {
  success: true,
  message: null,
  data: {
    id: transferId,
    code: "TR-001",
    sourceWarehouseId: "wh-1",
    sourceWarehouseName: "Almoxarifado Central",
    destinationWarehouseId: "wh-2",
    destinationWarehouseName: "Loja Matriz",
    status: "PENDING_VALIDATION",
    notes: null,
    items: [
      {
        id: "item-1",
        sourceBatchId: "batch-1",
        quantitySent: 5,
        quantity: 5,
        productName: "Leite",
        batchCode: "L-1",
      },
      {
        id: "item-2",
        sourceBatchId: "batch-2",
        quantitySent: 3,
        quantity: 3,
        productName: "Pão",
        batchCode: "B-2",
      },
    ],
    createdAt: "2025-01-01T00:00:00Z",
  },
};

const logsData = {
  success: true,
  message: null,
  data: [
    {
      id: "log-1",
      transferItemId: "item-1",
      barcode: "7891001",
      validatedByUserId: "user-1",
      validatedAt: "2025-01-01T01:00:00Z",
      valid: true,
    } satisfies ValidationLogEntry,
    {
      id: "log-2",
      transferItemId: "item-1",
      barcode: "7891002",
      validatedByUserId: "user-1",
      validatedAt: "2025-01-01T01:01:00Z",
      valid: true,
    } satisfies ValidationLogEntry,
    {
      id: "log-3",
      transferItemId: "item-2",
      barcode: "7892001",
      validatedByUserId: "user-1",
      validatedAt: "2025-01-01T01:02:00Z",
      valid: false,
    } satisfies ValidationLogEntry,
  ],
};

const transferResponseWithZeroExpected = {
  success: true,
  message: null,
  data: {
    id: transferId,
    code: "TR-002",
    sourceWarehouseId: "wh-1",
    sourceWarehouseName: "Almoxarifado Central",
    destinationWarehouseId: "wh-2",
    destinationWarehouseName: "Loja Matriz",
    status: "PENDING_VALIDATION",
    notes: null,
    items: [
      {
        id: "item-3",
        sourceBatchId: "batch-3",
        quantitySent: 0,
        quantity: 0,
        productName: "",
        batchCode: "",
      },
    ],
    createdAt: "2025-01-01T00:00:00Z",
  },
};

const toJson = <T,>(value: T) => ({
  json: vi.fn(async () => value),
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPush,
  }),
}));

vi.mock("swr", () => ({
  default: (...args: unknown[]) => mockSWR(...args),
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

vi.mock("@/components/breadcrumb", () => ({
  useBreadcrumb: (...args: unknown[]) => mockUseBreadcrumb(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  routerPush.mockReset();

  mockSWR.mockImplementation((key: string | null) => {
    if (key === `transfers/${transferId}`) {
      return {
        data: transferResponse,
        error: null,
        isLoading: false,
        mutate: vi.fn(),
      };
    }

    if (key === `transfers/${transferId}/validation-logs`) {
      return {
        data: logsData,
        error: null,
        isLoading: false,
        mutate: mockMutateLogs,
      };
    }

    return {
      data: undefined,
      error: null,
      isLoading: false,
      mutate: vi.fn(),
    };
  });

  mockGet.mockImplementation((url: string) => {
    if (url === `transfers/${transferId}`) return toJson(transferResponse);
    if (url === `transfers/${transferId}/validation-logs`) {
      return toJson(logsData);
    }
    return toJson({ success: true, data: null });
  });

  mockPost.mockImplementation(() => toJson({
    success: true,
    message: "ok",
    data: {
      valid: true,
      message: "Item válido",
      warning: null,
      productName: "Leite",
      productBarcode: "7891001",
      quantitySent: 5,
      quantityReceived: 1,
    },
  }));
});

describe("useValidateTransferModel", () => {
  it("loads transfer details and validation logs and builds expected items + progress", () => {
    const { result } = renderHook(() => useValidateTransferModel(transferId));

    expect(mockSWR).toHaveBeenCalledWith(
      `transfers/${transferId}`,
      expect.any(Function),
    );
    expect(mockSWR).toHaveBeenCalledWith(
      `transfers/${transferId}/validation-logs`,
      expect.any(Function),
    );
    expect(mockUseBreadcrumb).toHaveBeenCalledWith({
      title: "Validação TR-001",
      backUrl: `/transfers/${transferId}`,
      section: "Transferências",
      subsection: "Validação",
    });

    expect(result.current.transfer?.code).toBe("TR-001");
    expect(result.current.expectedItems).toHaveLength(2);
    expect(result.current.expectedItems[0]).toMatchObject({
      id: "item-1",
      productName: "Leite",
      batchCode: "L-1",
      expectedQuantity: 5,
      scannedQuantity: 2,
    });
    expect(result.current.expectedItems[1]).toMatchObject({
      id: "item-2",
      expectedQuantity: 3,
      scannedQuantity: 0,
    });

    // progress = (2 + 0) / (5 + 3) * 100 = 25
    expect(result.current.progress).toBe(25);
  });

  it("calcula progresso como 100 quando o total esperado é zero", () => {
    mockSWR.mockImplementation((key: string | null) => {
      if (key === `transfers/${transferId}`) {
        return {
          data: transferResponseWithZeroExpected,
          error: null,
          isLoading: false,
          mutate: vi.fn(),
        };
      }

      if (key === `transfers/${transferId}/validation-logs`) {
        return {
          data: {
            ...logsData,
            data: [],
          },
          error: null,
          isLoading: false,
          mutate: mockMutateLogs,
        };
      }

      return {
        data: undefined,
        error: null,
        isLoading: false,
        mutate: vi.fn(),
      };
    });

    const { result } = renderHook(() => useValidateTransferModel(transferId));

    expect(result.current.expectedItems).toEqual([
      {
        id: "item-3",
        productName: "Produto desconhecido",
        batchCode: "Sem lote",
        expectedQuantity: 0,
        scannedQuantity: 0,
      },
    ]);
    expect(result.current.progress).toBe(100);
  });

  it("updates barcode with onBarcodeChange", () => {
    const { result } = renderHook(() => useValidateTransferModel(transferId));

    act(() => {
      result.current.onBarcodeChange("  7891001  ");
    });

    expect(result.current.barcode).toBe("  7891001  ");
  });

  it("does not scan when barcode is empty", async () => {
    const { result } = renderHook(() => useValidateTransferModel(transferId));

    await act(async () => {
      await result.current.onScan();
    });

    expect(mockPost).not.toHaveBeenCalled();
  });

  it("does not scan when transfer id is missing", async () => {
    const { result } = renderHook(() => useValidateTransferModel(""));

    act(() => {
      result.current.onBarcodeChange("7891001");
    });

    await act(async () => {
      await result.current.onScan();
    });

    expect(mockPost).not.toHaveBeenCalled();
  });

  it("submits barcode, stores scan result and refreshes logs", async () => {
    const { result } = renderHook(() => useValidateTransferModel(transferId));

    act(() => {
      result.current.onBarcodeChange("7891001");
    });

    await act(async () => {
      await result.current.onScan();
    });

    expect(mockPost).toHaveBeenCalledWith(
      `transfers/${transferId}/scan`,
      expect.objectContaining({
        json: { barcode: "7891001" },
      }),
    );
    expect(result.current.lastScanResult).toMatchObject({
      valid: true,
      productName: "Leite",
      quantitySent: 5,
      quantityReceived: 1,
    });
    expect(mockMutateLogs).toHaveBeenCalled();
    expect(result.current.isProcessing).toBe(false);
  });

  it("shows validation error on invalid scan response", async () => {
    mockPost.mockImplementation(() => toJson({
      success: false,
      message: "Inválido",
      data: {
        valid: false,
        message: "Item não pertence à transferência",
        warning: null,
        productName: "Desconhecido",
        productBarcode: "invalid",
        quantitySent: 0,
        quantityReceived: 0,
      },
    }));

    const { result } = renderHook(() => useValidateTransferModel(transferId));

    act(() => {
      result.current.onBarcodeChange("invalid");
    });

    await act(async () => {
      await result.current.onScan();
    });

    expect(toastError).toHaveBeenCalledWith("Item não pertence à transferência");
    expect(result.current.lastScanResult).toMatchObject({
      valid: false,
      productName: "Desconhecido",
    });
  });

  it("handles scan failure and sets fallback scan result", async () => {
    mockPost.mockImplementation(() => ({
      json: vi.fn(async () => {
        throw new Error("Erro ao comunicar com servidor");
      }),
    }));

    const { result } = renderHook(() => useValidateTransferModel(transferId));

    act(() => {
      result.current.onBarcodeChange("7891001");
    });

    await act(async () => {
      await result.current.onScan();
    });

    expect(toastError).toHaveBeenCalledWith("Erro ao comunicar com servidor");
    expect(result.current.lastScanResult).toMatchObject({
      valid: false,
      message: "Falha na comunicação com o servidor",
      productName: "Erro de leitura",
      productBarcode: "7891001",
    });
  });

  it("builds discrepancies and opens finish modal", () => {
    const { result } = renderHook(() => useValidateTransferModel(transferId));

    act(() => {
      result.current.onFinish();
    });

    expect(result.current.showFinishModal).toBe(true);
    expect(result.current.discrepancies).toHaveLength(2);
    expect(result.current.discrepancies).toEqual([
      {
        productName: "Leite",
        quantitySent: 5,
        quantityReceived: 2,
        difference: -3,
        discrepancyType: "SHORTAGE",
      },
      {
        productName: "Pão",
        quantitySent: 3,
        quantityReceived: 0,
        difference: -3,
        discrepancyType: "SHORTAGE",
      },
    ]);
  });

  it("confirms finish and navigates to transfer detail on success", async () => {
    mockPost.mockImplementation(() => ({
      json: vi.fn(async () => undefined),
    }));

    const { result } = renderHook(() => useValidateTransferModel(transferId));

    await act(async () => {
      await result.current.onConfirmFinish();
    });

    expect(mockPost).toHaveBeenNthCalledWith(
      1,
      `transfers/${transferId}/complete-validation`,
    );
    expect(toastSuccess).toHaveBeenCalledWith("Validação concluída com sucesso!");
    expect(result.current.showFinishModal).toBe(false);
    expect(routerPush).toHaveBeenCalledWith(`/transfers/${transferId}`);
    expect(result.current.isFinishing).toBe(false);
  });

  it("handles finish confirmation errors", async () => {
    mockPost.mockImplementation(() => ({
      json: vi.fn(async () => {
        throw new Error("Não foi possível concluir validação");
      }),
    }));

    const { result } = renderHook(() => useValidateTransferModel(transferId));

    await act(async () => {
      await result.current.onConfirmFinish();
    });

    expect(toastError).toHaveBeenCalledWith("Não foi possível concluir validação");
    expect(result.current.isFinishing).toBe(false);
    expect(routerPush).not.toHaveBeenCalled();
  });
});
