import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBrandsModel } from "./brands.model";
import { Brand, BrandsResponse } from "./brands.types";
import { BrandFormData } from "./brands.schema";

type BrandApiError = { response?: { json: () => Promise<{ message: string }> } };

const mockMutate = vi.fn();
const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();

const toastSuccess = vi.fn();
const toastError = vi.fn();

const baseBrands: Brand[] = [
  {
    id: "brand-1",
    name: "Zeta",
    logoUrl: "https://example.com/zeta.png",
    createdAt: "2025-01-01T12:00:00Z",
    updatedAt: "2025-01-01T12:00:00Z",
  },
  {
    id: "brand-2",
    name: "Alfa",
    logoUrl: "",
    createdAt: "2024-12-01T12:00:00Z",
    updatedAt: "2024-12-01T12:00:00Z",
  },
];

const toJson = <T,>(value: T) => ({
  json: vi.fn(async () => value),
});

const brandApiError = (message: string): BrandApiError => ({
  response: {
    json: async () => ({ message }),
  },
});

let swrData: BrandsResponse = {
  success: true,
  message: null,
  data: baseBrands,
};

let swrError: Error | null = null;
let swrLoading = false;

vi.mock("swr", () => ({
  default: vi.fn(() => ({
    data: swrData,
    error: swrError,
    isLoading: swrLoading,
    mutate: mockMutate,
  })),
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

beforeEach(() => {
  vi.clearAllMocks();

  swrData = {
    success: true,
    message: null,
    data: baseBrands,
  };
  swrError = null;
  swrLoading = false;

  mockGet.mockImplementation(() =>
    toJson({ success: true, message: null, data: baseBrands })
  );

  mockPost.mockImplementation(() =>
    toJson({
      success: true,
      message: "Marca criada com sucesso!",
      data: baseBrands[0],
    })
  );

  mockPut.mockImplementation(() =>
    toJson({
      success: true,
      message: "Marca atualizada com sucesso!",
      data: baseBrands[0],
    })
  );

  mockDelete.mockImplementation(() =>
    toJson({ success: true, message: "Marca deletada com sucesso!", data: null })
  );
});

describe("useBrandsModel", () => {
  it("carrega marcas e filtra por nome", () => {
    const { result } = renderHook(() => useBrandsModel());

    expect(result.current.brands).toHaveLength(2);
    expect(result.current.brands[0].name).toBe("Alfa");
    expect(result.current.brands[1].name).toBe("Zeta");

    act(() => {
      result.current.setSearchQuery("ze");
    });

    expect(result.current.brands).toHaveLength(1);
    expect(result.current.brands[0].name).toBe("Zeta");
  });

  it("ordena por nome e data com direção", () => {
    const { result } = renderHook(() => useBrandsModel());

    expect(result.current.sortConfig.key).toBe("name");
    expect(result.current.sortConfig.direction).toBe("asc");

    act(() => {
      result.current.handleSort("name");
    });

    expect(result.current.sortConfig.direction).toBe("desc");
    expect(result.current.brands[0].name).toBe("Zeta");
    expect(result.current.brands[1].name).toBe("Alfa");

    act(() => {
      result.current.handleSort("createdAt");
    });

    expect(result.current.sortConfig.key).toBe("createdAt");
    expect(result.current.sortConfig.direction).toBe("asc");
    expect(result.current.brands[0].id).toBe("brand-2");

    act(() => {
      result.current.handleSort("createdAt");
    });

    expect(result.current.sortConfig.key).toBe("createdAt");
    expect(result.current.sortConfig.direction).toBe("desc");
    expect(result.current.brands[0].id).toBe("brand-1");
  });

  it("abre modal de criação com formulário limpo", () => {
    const { result } = renderHook(() => useBrandsModel());

    act(() => {
      result.current.form.setValue("name", "Suja");
      result.current.form.setValue("logoUrl", "https://example.com");
      result.current.openCreateModal();
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.selectedBrand).toBeNull();
    expect(result.current.form.getValues("name")).toBe("");
    expect(result.current.form.getValues("logoUrl")).toBe("");
  });

  it("abre e fecha modal de edição com dados pré-preenchidos", async () => {
    const { result } = renderHook(() => useBrandsModel());
    const target = baseBrands[0];

    act(() => {
      result.current.openEditModal(target);
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.selectedBrand).toEqual(target);
    expect(result.current.form.getValues("name")).toBe(target.name);
    expect(result.current.form.getValues("logoUrl")).toBe(target.logoUrl);

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.selectedBrand).toBeNull();
    expect(result.current.form.getValues("name")).toBe("");
  });

  it("cria marca com sucesso e fecha modal", async () => {
    const { result } = renderHook(() => useBrandsModel());
    const payload: BrandFormData = {
      name: "Nova Marca",
      logoUrl: "",
    };

    act(() => {
      result.current.openCreateModal();
    });

    await act(async () => {
      await result.current.onSubmit(payload);
    });

    expect(mockPost).toHaveBeenCalledWith("brands", {
      json: { name: "Nova Marca", logoUrl: undefined },
    });
    expect(mockMutate).toHaveBeenCalled();
    expect(toastSuccess).toHaveBeenCalledWith("Marca criada com sucesso!");
    expect(result.current.isModalOpen).toBe(false);
  });

  it("atualiza marca com sucesso e fecha modal", async () => {
    const { result } = renderHook(() => useBrandsModel());
    const payload: BrandFormData = {
      name: "Marca Atualizada",
      logoUrl: "https://example.com/logo.png",
    };

    act(() => {
      result.current.openEditModal(baseBrands[1]);
    });

    await act(async () => {
      await result.current.onSubmit(payload);
    });

    expect(mockPut).toHaveBeenCalledWith("brands/brand-2", {
      json: payload,
    });
    expect(mockMutate).toHaveBeenCalled();
    expect(toastSuccess).toHaveBeenCalledWith("Marca atualizada com sucesso!");
    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.selectedBrand).toBeNull();
  });

  it("aplica erro de validação de nome já existente no formulário", async () => {
    const { result } = renderHook(() => useBrandsModel());
    const payload: BrandFormData = {
      name: "Nome Duplicado",
      logoUrl: "",
    };

    mockPost.mockImplementationOnce(() => ({
      json: vi.fn(async () => {
        throw brandApiError("Já existe uma marca com este nome");
      }),
    }));

    act(() => {
      result.current.openCreateModal();
    });

    await act(async () => {
      await result.current.onSubmit(payload);
    });

    expect(mockPost).toHaveBeenCalledWith("brands", {
      json: { name: "Nome Duplicado", logoUrl: undefined },
    });
    expect(result.current.form.formState.errors.name?.message).toBe(
      "Já existe uma marca com este nome"
    );
  });

  it("aplica erro genérico ao criar marca quando API retorna mensagem", async () => {
    const { result } = renderHook(() => useBrandsModel());
    const payload: BrandFormData = {
      name: "Nova Marca",
      logoUrl: "",
    };

    mockPost.mockImplementationOnce(() => {
      throw brandApiError("Falha ao salvar marca");
    });

    act(() => {
      result.current.openCreateModal();
    });

    await act(async () => {
      await result.current.onSubmit(payload);
    });

    expect(toastError).toHaveBeenCalledWith("Falha ao salvar marca");
    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.form.formState.errors.name?.message).toBeUndefined();
  });

  it("mostra erro de conexão ao criar marca quando API falha sem resposta", async () => {
    const { result } = renderHook(() => useBrandsModel());

    mockPost.mockImplementationOnce(() => {
      throw new Error("rede instável");
    });

    act(() => {
      result.current.openCreateModal();
    });

    await act(async () => {
      await result.current.onSubmit({ name: "Rede", logoUrl: "" });
    });

    expect(toastError).toHaveBeenCalledWith(
      "Erro de conexão. Tente novamente."
    );
    expect(result.current.isModalOpen).toBe(true);
  });

  it("abre e fecha diálogo de exclusão e remove a marca ao confirmar", async () => {
    const { result } = renderHook(() => useBrandsModel());

    act(() => {
      result.current.openDeleteDialog(baseBrands[1]);
    });

    expect(result.current.brandToDelete?.id).toBe("brand-2");

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(mockDelete).toHaveBeenCalledWith("brands/brand-2");
    expect(toastSuccess).toHaveBeenCalledWith("Marca deletada com sucesso!");
    expect(mockMutate).toHaveBeenCalled();
    expect(result.current.brandToDelete).toBeNull();
    expect(result.current.isDeleting).toBe(false);
  });

  it("não tenta excluir quando nenhuma marca está selecionada", async () => {
    const { result } = renderHook(() => useBrandsModel());

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(mockDelete).not.toHaveBeenCalled();
    expect(result.current.brandToDelete).toBeNull();
  });

  it("exibe mensagem específica quando a marca possui produtos vinculados", async () => {
    const { result } = renderHook(() => useBrandsModel());
    const errorMessage =
      "Não é possível deletar marca com produtos vinculados";

    mockDelete.mockImplementationOnce(() => ({
      json: vi.fn(async () => {
      throw brandApiError(errorMessage);
      }),
    }));

    act(() => {
      result.current.openDeleteDialog(baseBrands[0]);
    });

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(toastError).toHaveBeenCalledWith(
      "Esta marca possui produtos. Remova-os primeiro."
    );
    expect(result.current.brandToDelete).toEqual(baseBrands[0]);
    expect(result.current.isDeleting).toBe(false);
  });

  it("fecha o diálogo de exclusão ao cancelar", () => {
    const { result } = renderHook(() => useBrandsModel());

    act(() => {
      result.current.openDeleteDialog(baseBrands[1]);
    });

    expect(result.current.brandToDelete).toEqual(baseBrands[1]);

    act(() => {
      result.current.closeDeleteDialog();
    });

    expect(result.current.brandToDelete).toBeNull();
  });

  it("exibe erro genérico ao excluir marca quando API retorna mensagem de erro", async () => {
    const { result } = renderHook(() => useBrandsModel());

    mockDelete.mockImplementationOnce(() => {
      throw brandApiError("Não foi possível remover a marca");
    });

    act(() => {
      result.current.openDeleteDialog(baseBrands[0]);
    });

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(toastError).toHaveBeenCalledWith("Não foi possível remover a marca");
    expect(result.current.brandToDelete).toEqual(baseBrands[0]);
    expect(result.current.isDeleting).toBe(false);
  });

  it("exibe erro de conexão ao excluir marca quando API falha sem resposta", async () => {
    const { result } = renderHook(() => useBrandsModel());

    mockDelete.mockImplementationOnce(() => {
      throw new Error("timed out");
    });

    act(() => {
      result.current.openDeleteDialog(baseBrands[1]);
    });

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(toastError).toHaveBeenCalledWith(
      "Erro de conexão. Tente novamente."
    );
    expect(result.current.brandToDelete).toEqual(baseBrands[1]);
    expect(result.current.isDeleting).toBe(false);
  });

  it("exibe estado carregando vindo do SWR", () => {
    swrData = {
      success: true,
      message: null,
      data: [],
    };
    swrLoading = true;
    const { result } = renderHook(() => useBrandsModel());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.brands).toEqual([]);
  });
});
