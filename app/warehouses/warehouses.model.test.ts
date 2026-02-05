import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWarehousesModel } from "./warehouses.model";

// Mock SWR
vi.mock("swr", () => ({
  default: vi.fn(() => ({
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
  })),
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with empty state", () => {
    const { result } = renderHook(() => useWarehousesModel());

    expect(result.current.searchQuery).toBe("");
    expect(result.current.statusFilter).toBe("all");
    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.selectedWarehouse).toBeNull();
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
});
