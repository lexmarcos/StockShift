import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  deriveSellingPriceSummary,
  useUpdateSellingPrice,
} from "./update-selling-price.model";
import type { ProductBatch } from "./product-batches.types";

vi.mock("@/lib/api", () => ({
  api: {
    patch: vi.fn(() => ({
      json: vi.fn(async () => ({
        success: true,
        message: "Selling price updated successfully",
        data: {
          message: "Successfully updated selling price for 3 batches",
          affectedCount: 3,
          productId: "prod-1",
          warehouseId: "wh-1",
        },
      })),
    })),
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const makeBatch = (overrides: Partial<ProductBatch> = {}): ProductBatch => ({
  id: "1",
  productName: "Test Product",
  batchCode: "B001",
  quantity: 10,
  costPrice: 1000,
  sellingPrice: 2000,
  manufacturedDate: "2026-01-01",
  expirationDate: "2026-12-31",
  createdAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

const renderModel = (batches: ProductBatch[], warehouseId: string | null = "wh-1") => {
  const onUpdated = vi.fn();
  const view = renderHook(() =>
    useUpdateSellingPrice({ warehouseId, productId: "prod-1", batches, onUpdated }),
  );
  return { ...view, onUpdated };
};

describe("deriveSellingPriceSummary", () => {
  it("returns no difference and no price for an empty list", () => {
    expect(deriveSellingPriceSummary([])).toEqual({
      hasDifferentPrices: false,
      currentUniformPrice: undefined,
    });
  });

  it("returns the shared price when all batches match", () => {
    const batches = [makeBatch({ sellingPrice: 1500 }), makeBatch({ sellingPrice: 1500 })];
    expect(deriveSellingPriceSummary(batches)).toEqual({
      hasDifferentPrices: false,
      currentUniformPrice: 1500,
    });
  });

  it("flags different prices and omits the prefill value", () => {
    const batches = [makeBatch({ sellingPrice: 1500 }), makeBatch({ sellingPrice: 1800 })];
    expect(deriveSellingPriceSummary(batches)).toEqual({
      hasDifferentPrices: true,
      currentUniformPrice: undefined,
    });
  });

  it("treats an all-null selling price as uniform with no prefill", () => {
    const batches = [makeBatch({ sellingPrice: null }), makeBatch({ sellingPrice: null })];
    expect(deriveSellingPriceSummary(batches)).toEqual({
      hasDifferentPrices: false,
      currentUniformPrice: undefined,
    });
  });
});

describe("useUpdateSellingPrice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens the modal prefilled with the uniform price", () => {
    const { result } = renderModel([makeBatch({ sellingPrice: 2500 })]);

    act(() => result.current.openModal());

    expect(result.current.isOpen).toBe(true);
    expect(result.current.form.getValues("sellingPrice")).toBe(2500);
  });

  it("opens the modal empty when prices differ and exposes the warning flag", () => {
    const { result } = renderModel([
      makeBatch({ sellingPrice: 2000 }),
      makeBatch({ sellingPrice: 3000 }),
    ]);

    act(() => result.current.openModal());

    expect(result.current.hasDifferentPrices).toBe(true);
    expect(result.current.form.getValues("sellingPrice")).toBeUndefined();
  });

  it("toggles the confirmation dialog", () => {
    const { result } = renderModel([makeBatch()]);

    act(() => result.current.requestConfirmation());
    expect(result.current.isConfirmOpen).toBe(true);

    act(() => result.current.closeConfirm());
    expect(result.current.isConfirmOpen).toBe(false);
  });

  it("closes the modal", () => {
    const { result } = renderModel([makeBatch()]);

    act(() => result.current.openModal());
    act(() => result.current.closeModal());

    expect(result.current.isOpen).toBe(false);
  });

  it("patches the new price, notifies and revalidates on confirm", async () => {
    const { result, onUpdated } = renderModel([makeBatch({ sellingPrice: 2000 })]);

    act(() => {
      result.current.openModal();
      result.current.form.setValue("sellingPrice", 1575);
      result.current.requestConfirmation();
    });

    await act(async () => {
      await result.current.confirmUpdate();
    });

    expect(api.patch).toHaveBeenCalledWith(
      "batches/warehouses/wh-1/products/prod-1/batches/selling-price",
      { json: { sellingPrice: 1575 } },
    );
    expect(toast.success).toHaveBeenCalledWith("Preço atualizado em 3 lote(s)");
    expect(onUpdated).toHaveBeenCalledTimes(1);
    expect(result.current.isOpen).toBe(false);
    expect(result.current.isConfirmOpen).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
  });

  it("does nothing but warns when no warehouse is selected", async () => {
    const { result, onUpdated } = renderModel([makeBatch({ sellingPrice: 2000 })], null);

    act(() => result.current.form.setValue("sellingPrice", 1575));

    await act(async () => {
      await result.current.confirmUpdate();
    });

    expect(api.patch).not.toHaveBeenCalled();
    expect(onUpdated).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      "Selecione um armazém para alterar o preço.",
    );
  });

  it("surfaces the API error message on failure", async () => {
    vi.mocked(api.patch).mockImplementationOnce(() => {
      throw new Error("Falha ao atualizar");
    });
    const { result, onUpdated } = renderModel([makeBatch({ sellingPrice: 2000 })]);

    act(() => result.current.form.setValue("sellingPrice", 1575));

    await act(async () => {
      await result.current.confirmUpdate();
    });

    expect(toast.error).toHaveBeenCalledWith("Falha ao atualizar");
    expect(onUpdated).not.toHaveBeenCalled();
    expect(result.current.isSubmitting).toBe(false);
  });
});
