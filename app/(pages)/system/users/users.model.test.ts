import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUsersModel } from "./users.model";
import type { User } from "./users.types";
import type { CreateUserFormData, EditUserFormData } from "./users.schema";

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();
const mockSWR = vi.fn();
const mockMutateUsers = vi.fn();

const toastSuccess = vi.fn();
const toastError = vi.fn();

let authIsAdmin = true;
let authIsLoading = false;
let authUser: { userId: string; email: string; fullName: string } | null = {
  userId: "user-admin",
  email: "admin@stockshift.local",
  fullName: "Administrador",
};

const baseUsers = {
  success: true,
  message: null,
  data: [
    {
      id: "user-1",
      fullName: "Ana Souza",
      email: "ana@empresa.com",
      isActive: true,
      mustChangePassword: false,
      lastLogin: null,
      createdAt: "2025-01-01T00:00:00Z",
      roles: ["ADMIN"],
      warehouses: ["Almoxarifado Central"],
    } satisfies User,
    {
      id: "user-2",
      fullName: "Bruno Lima",
      email: "bruno@empresa.com",
      isActive: false,
      mustChangePassword: true,
      lastLogin: "2025-01-03T00:00:00Z",
      createdAt: "2025-01-02T00:00:00Z",
      roles: ["OPERATOR"],
      warehouses: ["Loja Matriz"],
    } satisfies User,
  ],
};

const baseRoles = {
  success: true,
  message: null,
  data: [
    { id: "role-1", name: "ADMIN", description: "Administrador", isSystemRole: true },
    { id: "role-2", name: "OPERATOR", description: "Operador", isSystemRole: false },
  ],
};

const baseWarehouses = {
  success: true,
  message: null,
  data: [
    { id: "wh-1", name: "Almoxarifado Central", isActive: true },
    { id: "wh-2", name: "Loja Matriz", isActive: true },
    { id: "wh-3", name: "Depósito Antigo", isActive: false },
  ],
};

const toJson = <T,>(value: T) => ({
  json: vi.fn(async () => value),
});

vi.mock("swr", () => ({
  default: (...args: unknown[]) => mockSWR(...args),
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    put: (...args: unknown[]) => mockPut(...args),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

vi.mock("@/lib/contexts/auth-context", () => ({
  useAuth: () => ({
    isAdmin: authIsAdmin,
    isLoading: authIsLoading,
    isAuthenticated: Boolean(authUser),
    user: authUser,
    logout: vi.fn(),
    hasPermission: () => true,
    hasRole: () => false,
    setUser: vi.fn(),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();

  mockSWR.mockImplementation((key: unknown) => {
    if (key === "users") {
      return {
        data: baseUsers,
        error: null,
        isLoading: false,
        mutate: mockMutateUsers,
      };
    }

    if (key === "roles") {
      return {
        data: baseRoles,
        error: null,
        isLoading: false,
        mutate: vi.fn(),
      };
    }

    if (key === "warehouses") {
      return {
        data: baseWarehouses,
        error: null,
        isLoading: false,
        mutate: vi.fn(),
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
    if (url === "users") return toJson(baseUsers);
    if (url === "roles") return toJson(baseRoles);
    if (url === "warehouses") return toJson(baseWarehouses);
    return toJson({ success: true, data: [] });
  });

  mockPost.mockImplementation(() => toJson({
    success: true,
    message: "Usuário criado com sucesso",
    data: {
      userId: "new-user-id",
      email: "new@empresa.com",
      fullName: "Novo Usuário",
      temporaryPassword: "tmp-123",
      mustChangePassword: true,
      roles: ["OPERATOR"],
      warehouses: ["Loja Matriz"],
    },
  }));

  mockPut.mockImplementation(() => toJson({
    success: true,
    message: "Usuário atualizado com sucesso",
    data: baseUsers.data[0],
  }));

  authIsAdmin = true;
  authIsLoading = false;
  authUser = {
    userId: "user-admin",
    email: "admin@stockshift.local",
    fullName: "Administrador",
  };
});

describe("useUsersModel", () => {
  it("loads users and filters by full name and email", () => {
    const { result } = renderHook(() => useUsersModel());

    expect(result.current.users).toHaveLength(2);
    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.onSearchChange("ana");
    });

    expect(result.current.users).toHaveLength(1);
    expect(result.current.users[0].fullName).toBe("Ana Souza");

    act(() => {
      result.current.onSearchChange("bruno@empresa.com");
    });

    expect(result.current.users).toHaveLength(1);
    expect(result.current.users[0].fullName).toBe("Bruno Lima");
  });

  it("opens and closes create modal with reset state", () => {
    const { result } = renderHook(() => useUsersModel());

    act(() => {
      result.current.createForm.setValue("fullName", "Dirty Name");
      result.current.createForm.setValue("email", "dirty@email.com");
      result.current.createForm.setValue("roleIds", ["role-1"]);
      result.current.createForm.setValue("warehouseIds", ["wh-1"]);
      result.current.openCreateModal();
    });

    expect(result.current.isCreateModalOpen).toBe(true);
    expect(result.current.createForm.getValues("fullName")).toBe("");
    expect(result.current.createForm.getValues("email")).toBe("");

    act(() => {
      result.current.closeCreateModal();
    });

    expect(result.current.isCreateModalOpen).toBe(false);
    expect(result.current.createForm.getValues("fullName")).toBe("");
  });

  it("populates edit form with selected user role and warehouse IDs", async () => {
    const userToEdit: User = {
      id: "user-1",
      fullName: "Ana Souza",
      email: "ana@empresa.com",
      isActive: true,
      mustChangePassword: false,
      lastLogin: null,
      createdAt: "2025-01-01T00:00:00Z",
      roles: ["OPERATOR"],
      warehouses: ["Almoxarifado Central"],
    };

    const { result } = renderHook(() => useUsersModel());

    await act(async () => {
      result.current.openEditModal(userToEdit);
    });

    expect(result.current.isEditModalOpen).toBe(true);
    expect(result.current.selectedUser?.id).toBe("user-1");

    expect(result.current.editForm.getValues("fullName")).toBe("Ana Souza");
    expect(result.current.editForm.getValues("isActive")).toBe(true);
    expect(result.current.editForm.getValues("roleIds")).toEqual(["role-2"]);
    expect(result.current.editForm.getValues("warehouseIds")).toEqual(["wh-1"]);
  });

  it("submits new user and stores temporary password metadata", async () => {
    const { result } = renderHook(() => useUsersModel());

    act(() => {
      result.current.openCreateModal();
    });

    const payload: CreateUserFormData = {
      fullName: "Novo",
      email: "novo@empresa.com",
      roleIds: ["role-2"],
      warehouseIds: ["wh-2"],
    };

    await act(async () => {
      await result.current.onCreateSubmit(payload);
    });

    expect(mockPost).toHaveBeenCalledWith(
      "users",
      expect.objectContaining({
        json: payload,
      }),
    );

    expect(toastSuccess).toHaveBeenCalledWith("Usuário criado com sucesso");
    expect(mockMutateUsers).toHaveBeenCalled();
    expect(result.current.isCreateModalOpen).toBe(false);
    expect(result.current.temporaryPassword).toBe("tmp-123");
    expect(result.current.createdUserEmail).toBe("new@empresa.com");
  });

  it("handles create error and clears submitting flag", async () => {
    mockPost.mockImplementation(() => ({
      json: vi.fn(async () => {
        throw new Error("Erro ao criar usuário");
      }),
    }));

    const { result } = renderHook(() => useUsersModel());

    const payload: CreateUserFormData = {
      fullName: "Novo",
      email: "novo@empresa.com",
      roleIds: ["role-2"],
      warehouseIds: ["wh-2"],
    };

    await act(async () => {
      await result.current.onCreateSubmit(payload);
    });

    expect(toastError).toHaveBeenCalledWith("Erro ao criar usuário");
    expect(result.current.isSubmitting).toBe(false);
  });

  it("returns early when editing without selected user", async () => {
    const { result } = renderHook(() => useUsersModel());

    const payload: EditUserFormData = {
      fullName: "Atualizado",
      isActive: true,
      roleIds: ["role-1"],
      warehouseIds: ["wh-1"],
    };

    await act(async () => {
      await result.current.onEditSubmit(payload);
    });

    expect(mockPut).not.toHaveBeenCalled();
  });

  it("submits edited user and closes edit modal on success", async () => {
    const { result } = renderHook(() => useUsersModel());

    act(() => {
      result.current.openEditModal(baseUsers.data[0]);
    });

    const payload: EditUserFormData = {
      fullName: "Ana Atualizada",
      isActive: true,
      roleIds: ["role-2"],
      warehouseIds: ["wh-2"],
    };

    await act(async () => {
      await result.current.onEditSubmit(payload);
    });

    expect(mockPut).toHaveBeenCalledWith(
      "users/user-1",
      expect.objectContaining({
        json: payload,
      }),
    );

    expect(toastSuccess).toHaveBeenCalledWith("Usuário atualizado com sucesso");
    expect(mockMutateUsers).toHaveBeenCalled();
    expect(result.current.isEditModalOpen).toBe(false);
    expect(result.current.selectedUser).toBeNull();
  });

  it("shows error on edit failure and does not close modal", async () => {
    mockPut.mockImplementation(() => ({
      json: vi.fn(async () => {
        throw new Error("Erro ao atualizar usuário");
      }),
    }));

    const { result } = renderHook(() => useUsersModel());

    act(() => {
      result.current.openEditModal(baseUsers.data[0]);
    });

    await act(async () => {
      await result.current.onEditSubmit({
        fullName: "Falha",
        isActive: false,
        roleIds: ["role-2"],
        warehouseIds: ["wh-2"],
      });
    });

    expect(toastError).toHaveBeenCalledWith("Erro ao atualizar usuário");
    expect(result.current.isEditModalOpen).toBe(true);
    expect(result.current.isSubmitting).toBe(false);
  });

  it("toggles user status and preserves mapped references", async () => {
    const { result } = renderHook(() => useUsersModel());

    act(() => {
      result.current.openEditModal(baseUsers.data[0]);
    });

    await act(async () => {
      await result.current.toggleUserStatus(baseUsers.data[0]);
    });

    expect(mockPut).toHaveBeenCalledWith(
      "users/user-1",
      expect.objectContaining({
        json: {
          fullName: "Ana Souza",
          isActive: false,
          roleIds: ["role-1"],
          warehouseIds: ["wh-1"],
        },
      }),
    );

    expect(toastSuccess).toHaveBeenCalledWith("Usuário desativado");
    expect(mockMutateUsers).toHaveBeenCalled();
  });

  it("closes password modal and clears temporary credentials", () => {
    const { result } = renderHook(() => useUsersModel());

    act(() => {
      result.current.closePasswordModal();
    });

    expect(result.current.temporaryPassword).toBeNull();
    expect(result.current.createdUserEmail).toBeNull();
  });

  it("reflects auth metadata from context", () => {
    const { result } = renderHook(() => useUsersModel());

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.currentUserId).toBe("user-admin");
  });

  it("isLoading uses auth loading when users are not yet available", () => {
    authIsLoading = true;

    mockSWR.mockImplementation((key: unknown) => {
      if (key === "users") {
        return {
          data: undefined,
          error: null,
          isLoading: false,
          mutate: mockMutateUsers,
        };
      }

      return {
        data: undefined,
        error: null,
        isLoading: false,
        mutate: vi.fn(),
      };
    });

    const { result } = renderHook(() => useUsersModel());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.users).toEqual([]);
  });
});
