import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePdvModel } from "./pdv.model";
import { METHODS_WITH_INSTALLMENTS, type PdvSchema } from "./pdv.schema";
import type { ProductWithStock } from "./pdv.types";

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockMutate = vi.fn();
const mockSWR = vi.fn();
const toastError = vi.fn();
const toastSuccess = vi.fn();
const toastInfo = vi.fn();
const toastWarning = vi.fn();
const routerPush = vi.fn();

let activeWarehouseId: string | null = "warehouse-1";
let isMobileView = false;
let batchesByProduct: Record<string, Array<{
  id: string;
  batchCode: string;
  quantity: number;
  sellingPrice: number | null;
  expirationDate: string | null;
}>> = {};
let searchByBarcode: ProductWithStock[] = [];
let imageUrlByProduct: Record<string, string | null> = {};

const productWithImage: ProductWithStock = {
  id: "prod-1",
  name: "Cafe Torrado",
  sku: "CAF-01",
  barcode: "7890001111",
  imageUrl: "https://media.test/products/cafe.png",
  totalQuantity: 10,
};

const toJson = <T,>(value: T) => ({
  json: vi.fn(async () => value),
});

const salePayloadBase = {
  id: "sale-1",
  code: "SALE-001",
  paymentLink: null,
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPush,
  }),
}));

vi.mock("@/hooks/use-selected-warehouse", () => ({
  useSelectedWarehouse: () => ({
    warehouseId: activeWarehouseId,
    setWarehouseId: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => isMobileView,
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

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
    info: (...args: unknown[]) => toastInfo(...args),
    warning: (...args: unknown[]) => toastWarning(...args),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  activeWarehouseId = "warehouse-1";
  isMobileView = false;
  batchesByProduct = {};
  searchByBarcode = [];
  imageUrlByProduct = {};

  mockSWR.mockReturnValue({
    data: undefined,
    error: null,
    isLoading: false,
    mutate: mockMutate,
  });

  mockGet.mockImplementation((url: string) => {
    if (url.startsWith("batches/warehouses/warehouse-1/products/") && url.endsWith("/batches")) {
      const productId = url.replace("batches/warehouses/warehouse-1/products/", "").replace("/batches", "");
      return toJson({
        success: true,
        data: batchesByProduct[productId] || [],
      });
    }

    if (url.startsWith("warehouses/warehouse-1/products?search=")) {
      return toJson({
        success: true,
        data: { content: searchByBarcode },
      });
    }

    if (url.startsWith("products/")) {
      const productId = url.replace("products/", "");
      return toJson({
        success: true,
        data: {
          id: productId,
          imageUrl: imageUrlByProduct[productId] ?? null,
        },
      });
    }

    return toJson({ success: true, data: null });
  });

  mockPost.mockImplementation(() => toJson({
    success: true,
    data: { ...salePayloadBase },
  }));
});

describe("usePdvModel", () => {
  const submitData = (overrides: Partial<PdvSchema> = {}): PdvSchema => ({
    paymentMethod: "CASH",
    paymentMode: "DIRECT",
    installments: null,
    discountPercentage: null,
    ...overrides,
  });

  it("adds product with available batch into cart", async () => {
    batchesByProduct["prod-1"] = [
      {
        id: "batch-1",
        batchCode: "L-001",
        quantity: 5,
        sellingPrice: 500,
        expirationDate: null,
      },
    ];

    const { result } = renderHook(() => usePdvModel());

    act(() => {
      result.current.onSearchChange("caf" );
    });

    await act(async () => {
      await result.current.onAddProduct(productWithImage);
    });

    expect(result.current.searchQuery).toBe("");
    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].batchId).toBe("batch-1");
    expect(result.current.cart[0].unitPrice).toBe(500);
    expect(result.current.cart[0].quantity).toBe(1);
    expect(result.current.subtotal).toBe(500);
  });

  it("increases quantity when adding existing product again", async () => {
    batchesByProduct["prod-1"] = [
      {
        id: "batch-1",
        batchCode: "L-001",
        quantity: 5,
        sellingPrice: 500,
        expirationDate: null,
      },
    ];

    const { result } = renderHook(() => usePdvModel());

    await act(async () => {
      await result.current.onAddProduct(productWithImage);
      await result.current.onAddProduct(productWithImage);
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].quantity).toBe(2);
    expect(result.current.cart[0].totalPrice).toBe(1000);
    expect(result.current.subtotal).toBe(1000);
  });

  it("shows error when product has no available batches", async () => {
    batchesByProduct["prod-1"] = [];

    const { result } = renderHook(() => usePdvModel());

    await act(async () => {
      await result.current.onAddProduct(productWithImage);
    });

    expect(result.current.cart).toHaveLength(0);
    expect(toastError).toHaveBeenCalledWith("Sem estoque disponível para " + productWithImage.name);
  });

  it("changes cart line price when batch changes", async () => {
    batchesByProduct["prod-1"] = [
      {
        id: "batch-1",
        batchCode: "L-001",
        quantity: 5,
        sellingPrice: 500,
        expirationDate: null,
      },
      {
        id: "batch-2",
        batchCode: "L-002",
        quantity: 4,
        sellingPrice: 900,
        expirationDate: null,
      },
    ];

    const { result } = renderHook(() => usePdvModel());

    await act(async () => {
      await result.current.onAddProduct(productWithImage);
    });

    act(() => {
      result.current.onChangeBatch(0, "batch-2");
    });

    expect(result.current.cart[0].batchId).toBe("batch-2");
    expect(result.current.cart[0].batchCode).toBe("L-002");
    expect(result.current.cart[0].unitPrice).toBe(900);
    expect(result.current.cart[0].totalPrice).toBe(900);
  });

  it("updates item quantity and removes item when zero", async () => {
    batchesByProduct["prod-1"] = [
      {
        id: "batch-1",
        batchCode: "L-001",
        quantity: 5,
        sellingPrice: 350,
        expirationDate: null,
      },
    ];

    const { result } = renderHook(() => usePdvModel());

    await act(async () => {
      await result.current.onAddProduct(productWithImage);
      result.current.onUpdateQuantity(0, 4);
    });

    expect(result.current.cart[0].quantity).toBe(4);
    expect(result.current.cart[0].totalPrice).toBe(1400);

    await act(async () => {
      result.current.onUpdateQuantity(0, 0);
    });

    expect(result.current.cart).toHaveLength(0);
  });

  it("adds product from barcode scanning when product exists", async () => {
    const barcodeProduct: ProductWithStock = {
      id: "prod-barcode",
      name: "Leite UHT",
      sku: "L123",
      barcode: "123456",
      imageUrl: null,
      totalQuantity: 12,
    };

    searchByBarcode = [barcodeProduct];
    batchesByProduct["prod-barcode"] = [
      {
        id: "batch-9",
        batchCode: "L-009",
        quantity: 9,
        sellingPrice: 100,
        expirationDate: null,
      },
    ];
    imageUrlByProduct["prod-barcode"] = null;

    const { result } = renderHook(() => usePdvModel());

    await act(async () => {
      await result.current.onBarcodeScanned("123456");
    });

    expect(mockGet).toHaveBeenCalledWith(
      "warehouses/warehouse-1/products?search=123456&page=0&size=1",
    );
    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].productName).toBe("Leite UHT");
    expect(toastSuccess).toHaveBeenCalledWith("Leite UHT adicionado");
  });

  it("shows error when barcode has no match", async () => {
    searchByBarcode = [];

    const { result } = renderHook(() => usePdvModel());

    await act(async () => {
      await result.current.onBarcodeScanned("000999");
    });

    expect(toastError).toHaveBeenCalledWith("Produto não encontrado: 000999");
    expect(result.current.cart).toHaveLength(0);
  });

  it("blocks barcode scan without selected warehouse", async () => {
    activeWarehouseId = null;

    const { result } = renderHook(() => usePdvModel());

    await act(async () => {
      await result.current.onBarcodeScanned("000999");
    });

    expect(toastError).toHaveBeenCalledWith("Nenhum estoque selecionado");
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("submits direct sale and clears cart", async () => {
    batchesByProduct["prod-1"] = [
      {
        id: "batch-1",
        batchCode: "L-001",
        quantity: 10,
        sellingPrice: 500,
        expirationDate: null,
      },
    ];

    const { result } = renderHook(() => usePdvModel());

    await act(async () => {
      await result.current.onAddProduct(productWithImage);
    });

    expect(result.current.cart).toHaveLength(1);

    await act(async () => {
      await result.current.onSubmit(submitData());
    });

    expect(mockPost).toHaveBeenCalledWith(
      "sales",
      expect.objectContaining({
        json: expect.objectContaining({
          warehouseId: "warehouse-1",
          paymentMethod: "CASH",
          paymentMode: "DIRECT",
          installments: null,
          discountPercentage: null,
          items: [
            expect.objectContaining({
              productId: "prod-1",
              batchId: "batch-1",
              quantity: 1,
            }),
          ],
          useInfinitePay: false,
        }),
      }),
    );

    expect(toastSuccess).toHaveBeenCalledWith("Venda realizada com sucesso!");
    expect(result.current.cart).toHaveLength(0);
    expect(result.current.form.getValues("paymentMethod")).toBe("CASH");
    expect(result.current.form.getValues("paymentMode")).toBe("DIRECT");
  });

  it("opens link payment drawer when payment mode is LINK", async () => {
    batchesByProduct["prod-1"] = [
      {
        id: "batch-1",
        batchCode: "L-001",
        quantity: 10,
        sellingPrice: 500,
        expirationDate: null,
      },
    ];

    mockPost.mockImplementation(() => toJson({
      success: true,
      data: {
        id: "sale-1",
        code: "SALE-001",
        paymentLink: "https://pay.example/sale-1",
      },
    }));

    const { result } = renderHook(() => usePdvModel());

    await act(async () => {
      await result.current.onAddProduct(productWithImage);
    });

    expect(result.current.cart).toHaveLength(1);

    await act(async () => {
      await result.current.onSubmit(
        submitData({
          paymentMethod: "CREDIT_CARD",
          paymentMode: "LINK",
          installments: 2,
        }),
      );
    });

    expect(mockPost).toHaveBeenCalledWith(
      "sales",
      expect.objectContaining({
        json: expect.objectContaining({
          paymentMethod: "CREDIT_CARD",
          paymentMode: "LINK",
          installments: 2,
          useInfinitePay: false,
        }),
      }),
    );
    expect(result.current.saleDrawerStep).toBe("link-payment");
    expect(result.current.saleDrawerData).toEqual({
      saleCode: "SALE-001",
      total: 500,
      paymentLink: "https://pay.example/sale-1",
    });
    expect(result.current.cart).toHaveLength(0);
  });

  it("shows error message when sale submit fails", async () => {
    batchesByProduct["prod-1"] = [
      {
        id: "batch-1",
        batchCode: "L-001",
        quantity: 10,
        sellingPrice: 500,
        expirationDate: null,
      },
    ];

    mockPost.mockImplementation(() => ({
      json: vi.fn(async () => {
        throw new Error("Erro ao registrar venda.");
      }),
    }));

    const { result } = renderHook(() => usePdvModel());

    await act(async () => {
      await result.current.onAddProduct(productWithImage);
    });
    expect(result.current.cart).toHaveLength(1);

    await act(async () => {
      await result.current.onSubmit(submitData());
    });

    expect(toastError).toHaveBeenCalledWith("Erro ao registrar venda.");
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.cart).toHaveLength(1);
  });

  it("blocks submit without cart items", async () => {
    const { result } = renderHook(() => usePdvModel());

    await act(async () => {
      await result.current.onSubmit(submitData());
    });

    expect(toastWarning).toHaveBeenCalledWith("Adicione pelo menos um produto ao carrinho");
    expect(mockPost).not.toHaveBeenCalled();
    expect(result.current.cart).toHaveLength(0);
  });

  it("toggles sale drawer and clears checkout state on payment later", async () => {
    batchesByProduct["prod-1"] = [
      {
        id: "batch-1",
        batchCode: "L-001",
        quantity: 10,
        sellingPrice: 500,
        expirationDate: null,
      },
    ];

    const { result } = renderHook(() => usePdvModel());

    await act(async () => {
      await result.current.onAddProduct(productWithImage);
      result.current.onOpenSaleDrawer();
    });

    expect(result.current.saleDrawerOpen).toBe(true);
    expect(result.current.saleDrawerStep).toBe("sale-type");

    await act(async () => {
      result.current.onCheckPaymentLater();
    });

    expect(routerPush).toHaveBeenCalledWith("/sales");
    expect(result.current.saleDrawerOpen).toBe(false);
    expect(result.current.cart).toHaveLength(0);
  });

  it("calculates installments only for installment-capable methods", async () => {
    batchesByProduct["prod-1"] = [
      {
        id: "batch-1",
        batchCode: "L-001",
        quantity: 10,
        sellingPrice: 500,
        expirationDate: null,
      },
    ];

    const { result } = renderHook(() => usePdvModel());

    await act(async () => {
      await result.current.onAddProduct(productWithImage);
    });

    expect(result.current.cart).toHaveLength(1);

    await act(async () => {
      await result.current.onSubmit(
        submitData({
          paymentMethod: METHODS_WITH_INSTALLMENTS[0],
          paymentMode: "DIRECT",
          installments: 2,
        }),
      );
    });

    expect(mockPost).toHaveBeenCalledWith(
      "sales",
      expect.objectContaining({
        json: expect.objectContaining({ installments: 2 }),
      }),
    );

    await act(async () => {
      await result.current.onAddProduct(productWithImage);
    });

    expect(result.current.cart).toHaveLength(1);

    await act(async () => {
      await result.current.onSubmit(
        submitData({
          paymentMethod: "CASH",
          paymentMode: "DIRECT",
          installments: 2,
        }),
      );
    });

    expect(mockPost).toHaveBeenLastCalledWith(
      "sales",
      expect.objectContaining({
        json: expect.objectContaining({ installments: null }),
      }),
    );
  });
});
