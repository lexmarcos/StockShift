import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWarehousesModel } from "./warehouses.model";
import useSWR from "swr";
import { api } from "@/lib/api";
import { toast } from "sonner";

vi.mock("swr", () => ({
  default: vi.fn(),
}));

vi.mock("@/hooks/use-selected-warehouse", () => ({
  useSelectedWarehouse: () => ({
    warehouseId: "wh-1",
    setWarehouseId: vi.fn(),
  }),
}));

// Mock API
vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(() => ({
      json: vi.fn(async () => ({
        success: true,
        message: null,
        data: [],
      })),
    })),
    post: vi.fn(() => ({
      json: vi.fn(async () => ({
        success: true,
        message: "Warehouse created successfully",
        data: {},
      })),
    })),
    put: vi.fn(() => ({
      json: vi.fn(async () => ({
        success: true,
        message: "Warehouse updated successfully",
        data: {},
      })),
    })),
    delete: vi.fn(() => ({
      json: vi.fn(async () => ({
        success: true,
        message: "Warehouse deleted successfully",
        data: null,
      })),
    })),
  },
}));

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useWarehousesModel", () => {
  const useSWRMock = vi.mocked(useSWR);

  beforeEach(() => {
    vi.clearAllMocks();

    useSWRMock.mockImplementation(((key: unknown) => {
      const swrKey = typeof key === "string" ? key : "";

      if (swrKey === "warehouses-stock-summary") {
        return {
          data: {
            success: true,
            message: null,
            data: [
              {
                warehouseId: "1",
                productCount: 3,
                batchCount: 5,
                totalQuantity: 120,
              },
            ],
          },
          error: null,
          isLoading: false,
          mutate: vi.fn(),
        };
      }

      return {
        data: {
          success: true,
          message: null,
          data: [
            {
              id: "1",
              code: "WH-001",
              name: "Main Warehouse",
              description: "Primary storage",
              address: "123 Main St",
              city: "São Paulo",
              state: "SP",
              phone: "(11) 98765-4321",
              email: "main@warehouse.com",
              isActive: true,
              createdAt: "2025-01-01T00:00:00Z",
              updatedAt: "2025-01-01T00:00:00Z",
            },
            {
              id: "2",
              code: "WH-002",
              name: "Secondary Warehouse",
              description: "Secondary storage",
              address: "456 Secondary St",
              city: "Rio de Janeiro",
              state: "RJ",
              phone: "(11) 99876-5432",
              email: "secondary@warehouse.com",
              isActive: false,
              createdAt: "2025-01-02T00:00:00Z",
              updatedAt: "2025-01-02T00:00:00Z",
            },
          ],
        },
        error: null,
        isLoading: false,
        mutate: vi.fn(),
      };
    }) as unknown as typeof useSWR);
  });

  it("should initialize with empty state", () => {
    const { result } = renderHook(() => useWarehousesModel());

    expect(result.current.searchQuery).toBe("");
    expect(result.current.statusFilter).toBe("all");
    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.selectedWarehouse).toBeNull();
    expect(result.current.stockSummariesByWarehouseId["1"]).toEqual({
      warehouseId: "1",
      productCount: 3,
      batchCount: 5,
      totalQuantity: 120,
    });
  });

  it("should filter warehouses by status", () => {
    const { result } = renderHook(() => useWarehousesModel());

    act(() => {
      result.current.setStatusFilter("active");
    });

    expect(result.current.statusFilter).toBe("active");
    expect(result.current.warehouses).toHaveLength(1);
    expect(result.current.warehouses[0].isActive).toBe(true);
  });

  it("should filter warehouses by search query", () => {
    const { result } = renderHook(() => useWarehousesModel());

    act(() => {
      result.current.setSearchQuery("Main");
    });

    expect(result.current.searchQuery).toBe("Main");
    expect(result.current.warehouses).toHaveLength(1);
    expect(result.current.warehouses[0].name).toBe("Main Warehouse");
  });

  it("should search by name", () => {
    const { result } = renderHook(() => useWarehousesModel());

    act(() => {
      result.current.setSearchQuery("Secondary");
    });

    expect(result.current.warehouses).toHaveLength(1);
    expect(result.current.warehouses[0].name).toBe("Secondary Warehouse");
  });

  it("should open create modal", () => {
    const { result } = renderHook(() => useWarehousesModel());

    expect(result.current.isModalOpen).toBe(false);

    act(() => {
      result.current.openCreateModal();
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.selectedWarehouse).toBeNull();
  });

  it("should open edit modal with warehouse data", () => {
    const { result } = renderHook(() => useWarehousesModel());
    const warehouse = result.current.warehouses[0];

    act(() => {
      result.current.openEditModal(warehouse);
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.selectedWarehouse).toEqual(warehouse);
  });

  it("should close modal", () => {
    const { result } = renderHook(() => useWarehousesModel());

    act(() => {
      result.current.openCreateModal();
    });

    expect(result.current.isModalOpen).toBe(true);

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.selectedWarehouse).toBeNull();
  });

  it("should handle sort correctly", () => {
    const { result } = renderHook(() => useWarehousesModel());

    act(() => {
      result.current.handleSort("name");
    });

    expect(result.current.sortConfig.key).toBe("name");
    expect(result.current.sortConfig.direction).toBe("desc");

    act(() => {
      result.current.handleSort("name");
    });

    expect(result.current.sortConfig.direction).toBe("asc");
  });

  it("should handle delete dialog", () => {
    const { result } = renderHook(() => useWarehousesModel());
    const warehouse = result.current.warehouses[0];

    expect(result.current.warehouseToDelete).toBeNull();

    act(() => {
      result.current.openDeleteDialog(warehouse);
    });

    expect(result.current.warehouseToDelete).toEqual(warehouse);

    act(() => {
      result.current.closeDeleteDialog();
    });

    expect(result.current.warehouseToDelete).toBeNull();
  });

  it("should combine filters and search", () => {
    const { result } = renderHook(() => useWarehousesModel());

    act(() => {
      result.current.setStatusFilter("inactive");
      result.current.setSearchQuery("Secondary");
    });

    expect(result.current.warehouses).toHaveLength(1);
    expect(result.current.warehouses[0].name).toBe("Secondary Warehouse");
    expect(result.current.warehouses[0].isActive).toBe(false);
  });

  it("should reset search and filters correctly", () => {
    const { result } = renderHook(() => useWarehousesModel());

    act(() => {
      result.current.setStatusFilter("active");
      result.current.setSearchQuery("test");
    });

    expect(result.current.warehouses).toHaveLength(0);

    act(() => {
      result.current.setStatusFilter("all");
      result.current.setSearchQuery("");
    });

    expect(result.current.warehouses).toHaveLength(2);
  });

  it("should sort by created date and search by code", () => {
    const { result } = renderHook(() => useWarehousesModel());

    act(() => {
      result.current.setSearchQuery("WH-002");
      result.current.handleSort("createdAt");
    });

    expect(result.current.warehouses).toHaveLength(1);
    expect(result.current.warehouses[0].code).toBe("WH-002");
    expect(result.current.sortConfig).toEqual({
      key: "createdAt",
      direction: "asc",
    });
  });

  it("should create and update warehouse successfully", async () => {
    const { result } = renderHook(() => useWarehousesModel());
    const payload = {
      name: "Novo",
      address: "",
      city: "São Paulo",
      state: "SP",
      isActive: true,
    };

    act(() => {
      result.current.openCreateModal();
    });

    await act(async () => {
      await result.current.onSubmit(payload);
    });

    expect(api.post).toHaveBeenCalledWith("warehouses", { json: payload });
    expect(toast.success).toHaveBeenCalledWith("Warehouse created successfully");

    act(() => {
      result.current.openEditModal(result.current.warehouses[0]);
    });

    await act(async () => {
      await result.current.onSubmit(payload);
    });

    expect(api.put).toHaveBeenCalledWith("warehouses/1", { json: payload });
    expect(toast.success).toHaveBeenCalledWith("Warehouse updated successfully");
  });

  it("should show save fallback error when submit fails", async () => {
    vi.mocked(api.post).mockImplementationOnce(() => {
      throw {};
    });
    const { result } = renderHook(() => useWarehousesModel());

    await act(async () => {
      await result.current.onSubmit({
        name: "Novo",
        address: "",
        city: "São Paulo",
        state: "SP",
        isActive: true,
      });
    });

    expect(toast.error).toHaveBeenCalledWith("Erro ao salvar armazém. Tente novamente.");
  });

  it("should select warehouse and handle selection errors", async () => {
    const { result } = renderHook(() => useWarehousesModel());

    await act(async () => {
      await result.current.onSelectWarehouse("2");
    });

    expect(api.post).toHaveBeenCalledWith("auth/switch-warehouse", {
      json: { warehouseId: "2" },
    });
    expect(toast.success).toHaveBeenCalledWith("Warehouse created successfully");

    vi.mocked(api.post).mockImplementationOnce(() => {
      throw { response: { data: { message: "Sem acesso" } } };
    });

    await act(async () => {
      await result.current.onSelectWarehouse("blocked");
    });

    expect(toast.error).toHaveBeenCalledWith("Sem acesso");
  });

  it("should delete warehouse and handle blocked stock error", async () => {
    const { result } = renderHook(() => useWarehousesModel());

    act(() => {
      result.current.openDeleteDialog(result.current.warehouses[0]);
    });

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(api.delete).toHaveBeenCalledWith("warehouses/1");
    expect(toast.success).toHaveBeenCalledWith("Warehouse deleted successfully");
    expect(result.current.isDeleting).toBe(false);

    vi.mocked(api.delete).mockImplementationOnce(() => {
      throw {
        response: {
          status: 400,
          data: { message: "warehouse has stock" },
        },
      };
    });

    act(() => {
      result.current.openDeleteDialog(result.current.warehouses[1]);
    });

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(toast.error).toHaveBeenCalledWith(
      "warehouse has stock. Desative o armazém ou transfira o estoque primeiro.",
    );
    expect(result.current.isDeleting).toBe(false);
  });
});
