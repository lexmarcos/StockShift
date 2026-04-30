import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRolesModel } from "./roles.model";
import type { Permission, Role } from "./roles.types";
import type { RoleFormData } from "./roles.schema";

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();
const mockSWR = vi.fn();
const mockMutateRoles = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

let authIsAdmin = true;
let authIsLoading = false;

const basePermissions: Permission[] = [
  {
    id: "perm-products-create",
    code: "products:create",
    description: "products:create",
  },
  {
    id: "perm-products-update",
    code: "products:update",
    description: "products:update",
  },
  {
    id: "perm-users-read",
    code: "users:read",
    description: "users:read",
  },
];

const permissionsResponse = {
  success: true,
  message: null,
  data: basePermissions,
};

const baseRoles: Role[] = [
  {
    id: "role-admin",
    name: "Admin",
    description: "Administrador",
    isSystemRole: true,
    permissions: [basePermissions[0], basePermissions[1]],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "role-op",
    name: "Operador",
    description: "Usuário operacional",
    isSystemRole: false,
    permissions: [basePermissions[2]],
    createdAt: "2026-01-02T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
  },
];

const rolesResponse = {
  success: true,
  message: null,
  data: baseRoles,
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
    delete: (...args: unknown[]) => mockDelete(...args),
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
    isAuthenticated: true,
    user: { userId: "u1" },
    logout: vi.fn(),
    hasPermission: vi.fn(),
    hasRole: vi.fn(),
  }),
}));

let swrRolesLoading = false;
let swrPermissionsLoading = false;

beforeEach(() => {
  vi.clearAllMocks();

  authIsAdmin = true;
  authIsLoading = false;
  swrRolesLoading = false;
  swrPermissionsLoading = false;

  mockSWR.mockImplementation((key: string | null) => {
    if (key === "roles") {
      return {
        data: rolesResponse,
        error: null,
        isLoading: swrRolesLoading,
        mutate: mockMutateRoles,
      };
    }

    if (key === "permissions") {
      return {
        data: permissionsResponse,
        error: null,
        isLoading: swrPermissionsLoading,
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
    if (url === "roles") return toJson(rolesResponse);
    if (url === "permissions") return toJson(permissionsResponse);
    return toJson({ success: true, message: null, data: [] });
  });

  mockPost.mockImplementation(() =>
    toJson({
      success: true,
      message: "Role criada com sucesso",
      data: baseRoles[0],
    }),
  );

  mockPut.mockImplementation(() =>
    toJson({
      success: true,
      message: "Role atualizada com sucesso",
      data: baseRoles[0],
    }),
  );

  mockDelete.mockImplementation(() =>
    toJson({
      success: true,
      message: "Role deletada com sucesso",
      data: null,
    }),
  );
});

describe("useRolesModel", () => {
  it("carrega roles e filtra por nome e descrição", async () => {
    const { result } = renderHook(() => useRolesModel());

    expect(result.current.roles).toHaveLength(2);
    expect(result.current.isLoading).toBe(false);
    act(() => {
      result.current.openCreateModal();
    });

    await waitFor(() => {
      expect(result.current.groupedPermissions.size).toBe(2);
    });

    act(() => {
      result.current.onSearchChange("admin");
    });

    expect(result.current.roles).toHaveLength(1);
    expect(result.current.roles[0].name).toBe("Admin");

    act(() => {
      result.current.onSearchChange("operacional");
    });

    expect(result.current.roles).toHaveLength(1);
    expect(result.current.roles[0].name).toBe("Operador");
  });

  it("agrupa permissões por recurso corretamente", async () => {
    const { result } = renderHook(() => useRolesModel());

    act(() => {
      result.current.openCreateModal();
    });

    await waitFor(() => {
      expect(result.current.groupedPermissions.has("Products")).toBe(true);
      expect(result.current.groupedPermissions.has("Users")).toBe(true);
      expect(result.current.groupedPermissions.get("Products")).toHaveLength(2);
    });
  });

  it("abre e fecha modal de criação limpando estado", () => {
    const { result } = renderHook(() => useRolesModel());

    act(() => {
      result.current.createForm.setValue("name", "Dirty");
      result.current.createForm.setValue("description", "dirty desc");
      result.current.createForm.setValue("permissionIds", ["perm-products-create"]);
      result.current.openCreateModal();
    });

    expect(result.current.isCreateModalOpen).toBe(true);
    expect(result.current.createForm.getValues("name")).toBe("");
    expect(result.current.createForm.getValues("description")).toBe("");
    expect(result.current.createForm.getValues("permissionIds")).toEqual([]);

    act(() => {
      result.current.closeCreateModal();
    });

    expect(result.current.isCreateModalOpen).toBe(false);
  });

  it("abre modal de edição e popula formulário com dados da role", async () => {
    const { result } = renderHook(() => useRolesModel());

    act(() => {
      result.current.openEditModal(baseRoles[1]);
    });

    await waitFor(() => {
      expect(result.current.isEditModalOpen).toBe(true);
      expect(result.current.editForm.getValues("name")).toBe("Operador");
      expect(result.current.editForm.getValues("permissionIds")).toEqual([
        "perm-users-read",
      ]);
    });
  });

  it("abre e fecha modal de permissões agrupando a role selecionada", () => {
    const { result } = renderHook(() => useRolesModel());

    expect(result.current.isPermissionsModalOpen).toBe(false);
    expect(result.current.roleToViewPermissions).toBeNull();

    act(() => {
      result.current.openPermissionsModal(baseRoles[0]);
    });

    expect(result.current.isPermissionsModalOpen).toBe(true);
    expect(result.current.roleToViewPermissions?.id).toBe("role-admin");
    expect(result.current.viewedRoleGroupedPermissions.get("Products")).toHaveLength(2);

    act(() => {
      result.current.closePermissionsModal();
    });

    expect(result.current.isPermissionsModalOpen).toBe(false);
    expect(result.current.roleToViewPermissions).toBeNull();
    expect(result.current.viewedRoleGroupedPermissions.size).toBe(0);
  });

  it("cria role com sucesso e fecha modal", async () => {
    const { result } = renderHook(() => useRolesModel());

    act(() => {
      result.current.openCreateModal();
    });

    const payload: RoleFormData = {
      name: "Novo Cargo",
      description: "Cargo novo",
      permissionIds: ["perm-products-create"],
    };

    await act(async () => {
      await result.current.onCreateSubmit(payload);
    });

    expect(mockPost).toHaveBeenCalledWith(
      "roles",
      expect.objectContaining({ json: payload }),
    );
    expect(toastSuccess).toHaveBeenCalledWith("Role criada com sucesso");
    expect(mockMutateRoles).toHaveBeenCalledTimes(1);
    expect(result.current.isCreateModalOpen).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
  });

  it("trata erro ao criar role", async () => {
    mockPost.mockImplementation(() => ({
      json: vi.fn(async () => {
        throw new Error("Erro ao criar role");
      }),
    }));

    const { result } = renderHook(() => useRolesModel());
    act(() => {
      result.current.openCreateModal();
    });

    await act(async () => {
      await result.current.onCreateSubmit({
        name: "Falha",
        permissionIds: [],
      });
    });

    expect(toastError).toHaveBeenCalledWith("Erro ao criar role");
    expect(mockMutateRoles).not.toHaveBeenCalled();
    expect(result.current.isSubmitting).toBe(false);
  });

  it("retorna cedo no submit de edição sem role selecionada", async () => {
    const { result } = renderHook(() => useRolesModel());

    await act(async () => {
      await result.current.onEditSubmit({
        name: "Sem role",
        description: "Sem role",
        permissionIds: ["perm-products-create"],
      });
    });

    expect(mockPut).not.toHaveBeenCalled();
  });

  it("atualiza role com sucesso e fecha modal", async () => {
    const { result } = renderHook(() => useRolesModel());

    act(() => {
      result.current.openEditModal(baseRoles[0]);
    });

    await waitFor(() => {
      expect(result.current.editForm.getValues("name")).toBe("Admin");
    });

    await act(async () => {
      await result.current.onEditSubmit({
        name: "Admin alterado",
        description: "Administrador atualiz",
        permissionIds: ["perm-products-update"],
      });
    });

    expect(mockPut).toHaveBeenCalledWith(
      "roles/role-admin",
      expect.objectContaining({
        json: {
          name: "Admin alterado",
          description: "Administrador atualiz",
          permissionIds: ["perm-products-update"],
        },
      }),
    );
    expect(toastSuccess).toHaveBeenCalledWith("Role atualizada com sucesso");
    expect(mockMutateRoles).toHaveBeenCalledTimes(1);
    expect(result.current.isEditModalOpen).toBe(false);
    expect(result.current.selectedRole).toBeNull();
  });

  it("trata erro ao editar role e mantém modal aberto", async () => {
    mockPut.mockImplementation(() => ({
      json: vi.fn(async () => {
        throw new Error("Erro ao atualizar role");
      }),
    }));

    const { result } = renderHook(() => useRolesModel());

    act(() => {
      result.current.openEditModal(baseRoles[0]);
    });

    await waitFor(() => {
      expect(result.current.isEditModalOpen).toBe(true);
    });

    await act(async () => {
      await result.current.onEditSubmit({
        name: "Falha na atualização",
        permissionIds: ["perm-products-create"],
      });
    });

    expect(toastError).toHaveBeenCalledWith("Erro ao atualizar role");
    expect(result.current.isEditModalOpen).toBe(true);
    expect(result.current.isSubmitting).toBe(false);
  });

  it("deleta role com sucesso e fecha modal", async () => {
    const { result } = renderHook(() => useRolesModel());

    act(() => {
      result.current.openDeleteModal(baseRoles[0]);
    });

    expect(result.current.isDeleteModalOpen).toBe(true);
    expect(result.current.roleToDelete?.id).toBe("role-admin");

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(mockDelete).toHaveBeenCalledWith("roles/role-admin");
    expect(toastSuccess).toHaveBeenCalledWith("Role deletada com sucesso");
    expect(mockMutateRoles).toHaveBeenCalledTimes(1);
    expect(result.current.isDeleteModalOpen).toBe(false);
    expect(result.current.roleToDelete).toBeNull();
  });

  it("fecha modal de delete sem role selecionada", async () => {
    const { result } = renderHook(() => useRolesModel());

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(mockDelete).not.toHaveBeenCalled();
    expect(result.current.isDeleteModalOpen).toBe(false);
  });

  it("considera loading de permissões quando modal de criação está aberto", async () => {
    swrPermissionsLoading = true;
    const { result } = renderHook(() => useRolesModel());

    act(() => {
      result.current.openCreateModal();
    });

    expect(result.current.isLoadingPermissions).toBe(true);
  });

  it("considera loading do contexto de auth mesmo sem dados iniciais", () => {
    authIsLoading = true;
    mockSWR.mockImplementation((key: string | null) => {
      if (key === "roles") {
        return {
          data: rolesResponse,
          error: null,
          isLoading: false,
          mutate: mockMutateRoles,
        };
      }

      if (key === "permissions") {
        return {
          data: permissionsResponse,
          error: null,
          isLoading: false,
        };
      }

      return {
        data: undefined,
        error: null,
        isLoading: false,
        mutate: vi.fn(),
      };
    });

    const { result } = renderHook(() => useRolesModel());

    expect(result.current.isLoadingAdmin).toBe(true);
    expect(result.current.isLoading).toBe(true);
  });
});
