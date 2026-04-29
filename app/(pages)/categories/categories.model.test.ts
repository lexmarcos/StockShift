import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCategoriesModel } from "./categories.model";
import type {
  Category,
  CategoriesResponse,
  CreateCategoryResponse,
  UpdateCategoryResponse,
  DeleteCategoryResponse,
} from "./categories.types";
import type { CategoryFormData } from "./categories.schema";

type JsonResponse<T> = {
  json: () => Promise<T>;
};

type SwrState<T> = {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  mutate: () => void;
};

const createJsonResponse = <T>(payload: T): JsonResponse<T> => ({
  json: vi.fn(async () => payload),
});

const createRejectedJsonResponse = <T>(
  error: unknown,
): JsonResponse<T> => ({
  json: vi.fn(async () => {
    throw error;
  }),
});

const fakeApi = vi.hoisted(() => {
  class FakeApi {
    public readonly get = vi.fn<(url: string) => JsonResponse<unknown>>();
    public readonly post = vi.fn<
      (url: string, options: { json: CategoryFormData }) => JsonResponse<unknown>
    >();
    public readonly put = vi.fn<
      (url: string, options: { json: CategoryFormData }) => JsonResponse<unknown>
    >();
    public readonly delete = vi.fn<(url: string) => JsonResponse<unknown>>();
  }

  return new FakeApi();
});

const fakeToast = vi.hoisted(() => {
  class FakeToast {
    public readonly success = vi.fn<(message: string) => void>();
    public readonly error = vi.fn<(message: string) => void>();
  }

  return new FakeToast();
});

const fakeSWR = vi.hoisted(() => {
  class FakeSWR {
    private readonly responses = new Map<string | null, SwrState<unknown>>();
    private readonly defaultState: SwrState<unknown> = {
      data: null,
      error: null,
      isLoading: false,
      mutate: vi.fn(),
    };

    public readonly hook = vi.fn<
      (
        key: string | null,
        _fetcher?: unknown,
      ) => SwrState<unknown>
    >((key) => this.responses.get(key) ?? this.defaultState);

    public setState<T>(key: string | null, state: SwrState<T>): void {
      this.responses.set(key, state as SwrState<unknown>);
    }

    public reset(): void {
      this.responses.clear();
      this.defaultState.mutate.mockClear();
      this.hook.mockClear();
    }
  }

  return new FakeSWR();
});

vi.mock("swr", () => ({
  default: (
    ...args: Parameters<
      (key: string | null, fetcher?: unknown) => SwrState<unknown>
    >
  ) => fakeSWR.hook(...args),
}));

vi.mock("@/lib/api", () => ({
  api: fakeApi,
}));

vi.mock("sonner", () => ({
  toast: fakeToast,
}));

const baseCategories: Category[] = [
  {
    id: "category-alpha",
    name: "Alpha",
    description: null,
    parentCategoryId: null,
    parentCategoryName: null,
    attributesSchema: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "category-alpha-child",
    name: "Alpha Child",
    description: null,
    parentCategoryId: "category-alpha",
    parentCategoryName: "Alpha",
    attributesSchema: null,
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  },
  {
    id: "category-beta",
    name: "Beta",
    description: "Categoria Beta",
    parentCategoryId: null,
    parentCategoryName: null,
    attributesSchema: null,
    createdAt: "2026-01-03T00:00:00.000Z",
    updatedAt: "2026-01-03T00:00:00.000Z",
  },
  {
    id: "category-beta-child",
    name: "Beta Child",
    description: "Categoria filha",
    parentCategoryId: "category-beta",
    parentCategoryName: "Beta",
    attributesSchema: null,
    createdAt: "2026-01-04T00:00:00.000Z",
    updatedAt: "2026-01-04T00:00:00.000Z",
  },
];

const categoriesResponse: CategoriesResponse = {
  success: true,
  message: "Listadas",
  data: baseCategories,
};

const createCategorySuccess: CreateCategoryResponse = {
  success: true,
  message: "Categoria criada",
  data: baseCategories[0],
};

const createCategoryError: CreateCategoryResponse = {
  success: false,
  message: "Falha ao criar",
  data: baseCategories[0],
};

const updateCategorySuccess: UpdateCategoryResponse = {
  success: true,
  message: "Categoria atualizada",
  data: {
    ...baseCategories[0],
    name: "Nova Alpha",
  },
};

const updateCategoryError: UpdateCategoryResponse = {
  success: false,
  message: "Falha ao atualizar",
  data: {
    ...baseCategories[0],
    name: "Alpha",
  },
};

const deleteCategorySuccess: DeleteCategoryResponse = {
  success: true,
  message: "Categoria removida",
  data: null,
};

const deleteCategoryError: DeleteCategoryResponse = {
  success: false,
  message: "Falha ao remover",
  data: null,
};

let categoriesMutate: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  fakeSWR.reset();
  categoriesMutate = vi.fn();

  fakeSWR.setState("categories", {
    data: categoriesResponse,
    error: null,
    isLoading: false,
    mutate: categoriesMutate,
  });

  fakeApi.get.mockReturnValue(createJsonResponse(categoriesResponse));
  fakeApi.post.mockReturnValue(createJsonResponse(createCategorySuccess));
  fakeApi.put.mockReturnValue(createJsonResponse(updateCategorySuccess));
  fakeApi.delete.mockReturnValue(createJsonResponse(deleteCategorySuccess));
  fakeToast.success.mockClear();
  fakeToast.error.mockClear();
});

describe("useCategoriesModel", () => {
  it("constrói árvore e lista plana iniciais ordenadas por nome", () => {
    const { result } = renderHook(() => useCategoriesModel());

    expect(result.current.categoryTree).toHaveLength(2);
    expect(result.current.categoryTree[0].id).toBe("category-alpha");
    expect(result.current.categoryTree[0].children).toHaveLength(1);
    expect(result.current.categoryTree[0].children[0].id).toBe(
      "category-alpha-child",
    );
    expect(result.current.categoryTree[1].id).toBe("category-beta");

    const flatOrder = result.current.flatCategories.map((item) => item.id);
    expect(flatOrder).toEqual([
      "category-alpha",
      "category-alpha-child",
      "category-beta",
      "category-beta-child",
    ]);
    expect(result.current.categories).toEqual(result.current.categoryTree);
  });

  it("filtra por busca em árvore mantendo categoria pai", () => {
    const { result } = renderHook(() => useCategoriesModel());

    act(() => {
      result.current.setSearchQuery("child");
    });

    expect(result.current.viewMode).toBe("tree");
    expect(result.current.categories).toHaveLength(2);
    expect(result.current.categories[0].id).toBe("category-alpha");
    expect(result.current.categories[0].children[0].id).toBe(
      "category-alpha-child",
    );
    expect(result.current.categories[1].id).toBe("category-beta");
    expect(result.current.categories[1].children[0].id).toBe(
      "category-beta-child",
    );
  });

  it("filtra por busca em lista sem reter ancestrais", () => {
    const { result } = renderHook(() => useCategoriesModel());

    act(() => {
      result.current.setViewMode("flat");
      result.current.setSearchQuery("child");
    });

    const filtered = result.current.categories;
    expect(filtered).toHaveLength(2);
    expect(filtered.map((category) => category.id)).toEqual([
      "category-alpha-child",
      "category-beta-child",
    ]);
  });

  it("abre e fecha modal de criação com formulário limpo", () => {
    const { result } = renderHook(() => useCategoriesModel());

    act(() => {
      result.current.openEditModal(baseCategories[1]);
    });

    act(() => {
      result.current.openCreateModal();
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.selectedCategory).toBeNull();
    expect(result.current.form.getValues("name")).toBe("");
    expect(result.current.form.getValues("description")).toBe("");
    expect(result.current.form.getValues("parentCategoryId")).toBe(null);
    expect(result.current.form.getValues("attributesSchema")).toEqual({});

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.selectedCategory).toBeNull();
  });

  it("abre modal de edição preenchendo dados da categoria", () => {
    const { result } = renderHook(() => useCategoriesModel());

    act(() => {
      result.current.openEditModal(baseCategories[0]);
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.selectedCategory).toBe(baseCategories[0]);
    expect(result.current.form.getValues("name")).toBe("Alpha");
    expect(result.current.form.getValues("description")).toBe("");
    expect(result.current.form.getValues("parentCategoryId")).toBe(null);
  });

  it("altera ordenação do catálogo com handleSort", () => {
    const { result } = renderHook(() => useCategoriesModel());

    act(() => {
      result.current.handleSort("name");
    });
    expect(result.current.sortConfig).toEqual({ key: "name", direction: "desc" });

    act(() => {
      result.current.handleSort("createdAt");
    });
    expect(result.current.sortConfig).toEqual({
      key: "createdAt",
      direction: "asc",
    });
  });

  it("cria nova categoria, recarrega lista e fecha modal", async () => {
    const { result } = renderHook(() => useCategoriesModel());

    act(() => {
      result.current.openCreateModal();
    });

    const payload: CategoryFormData = {
      name: "Nova",
      description: "Nova categoria",
      parentCategoryId: null,
      attributesSchema: {
        origin: "manual",
      },
    };

    await act(async () => {
      await result.current.onSubmit(payload);
    });

    expect(fakeApi.post).toHaveBeenCalledWith("categories", { json: payload });
    expect(categoriesMutate).toHaveBeenCalledTimes(1);
    expect(fakeToast.success).toHaveBeenCalledWith("Categoria criada");
    expect(result.current.isModalOpen).toBe(false);
  });

  it("atualiza categoria existente e fecha modal", async () => {
    const { result } = renderHook(() => useCategoriesModel());

    act(() => {
      result.current.openEditModal(baseCategories[0]);
    });

    const payload: CategoryFormData = {
      name: "Alpha Atualizada",
      description: "Nova desc",
      parentCategoryId: null,
      attributesSchema: {
        updated: true,
      },
    };

    await act(async () => {
      await result.current.onSubmit(payload);
    });

    expect(fakeApi.put).toHaveBeenCalledWith("categories/category-alpha", {
      json: payload,
    });
    expect(categoriesMutate).toHaveBeenCalledTimes(1);
    expect(fakeToast.success).toHaveBeenCalledWith("Categoria atualizada");
    expect(result.current.isModalOpen).toBe(false);
  });

  it("não fecha modal nem recarrega ao falhar em create com sucesso false", async () => {
    const { result } = renderHook(() => useCategoriesModel());

    act(() => {
      result.current.openCreateModal();
    });

    fakeApi.post.mockReturnValueOnce(createJsonResponse(createCategoryError));

    const payload: CategoryFormData = {
      name: "Falha",
      description: "Descricao",
      parentCategoryId: null,
      attributesSchema: {},
    };

    await act(async () => {
      await result.current.onSubmit(payload);
    });

    expect(fakeApi.post).toHaveBeenCalledWith("categories", { json: payload });
    expect(categoriesMutate).not.toHaveBeenCalled();
    expect(fakeToast.success).not.toHaveBeenCalled();
    expect(result.current.isModalOpen).toBe(true);
  });

  it("mostra erro da API ao criar categoria", async () => {
    const { result } = renderHook(() => useCategoriesModel());

    act(() => {
      result.current.openCreateModal();
    });

    fakeApi.post.mockReturnValueOnce(
      createRejectedJsonResponse({
        response: { data: { message: "Falha ao criar" } },
      }),
    );

    await act(async () => {
      await result.current.onSubmit({
        name: "Nova",
        description: "Descricao",
        parentCategoryId: null,
        attributesSchema: {},
      });
    });

    expect(fakeToast.error).toHaveBeenCalledWith("Falha ao criar");
  });

  it("aplica mensagem padrão de erro ao criar sem retorno estruturado", async () => {
    const { result } = renderHook(() => useCategoriesModel());

    act(() => {
      result.current.openCreateModal();
    });

    fakeApi.post.mockReturnValueOnce(createRejectedJsonResponse(new Error("falhou")));

    await act(async () => {
      await result.current.onSubmit({
        name: "Outra",
        description: "Descricao",
        parentCategoryId: null,
        attributesSchema: {},
      });
    });

    expect(fakeToast.error).toHaveBeenCalledWith("Erro ao criar categoria");
  });

  it("mostra erro da API ao atualizar categoria", async () => {
    const { result } = renderHook(() => useCategoriesModel());

    act(() => {
      result.current.openEditModal(baseCategories[0]);
    });

    fakeApi.put.mockReturnValueOnce(
      createRejectedJsonResponse({
        response: { data: { message: "Falha ao atualizar" } },
      }),
    );

    await act(async () => {
      await result.current.onSubmit({
        name: "Alpha",
        description: "desc",
        parentCategoryId: null,
        attributesSchema: {},
      });
    });

    expect(fakeToast.error).toHaveBeenCalledWith("Falha ao atualizar");
    expect(fakeApi.put).toHaveBeenCalledWith("categories/category-alpha", {
      json: {
        name: "Alpha",
        description: "desc",
        parentCategoryId: null,
        attributesSchema: {},
      },
    });
  });

  it("fecha confirmação cedo quando não há categoria para remover", async () => {
    const { result } = renderHook(() => useCategoriesModel());

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(fakeApi.delete).not.toHaveBeenCalled();
    expect(fakeToast.error).not.toHaveBeenCalled();
    expect(result.current.categoryToDelete).toBeNull();
  });

  it("remove categoria com sucesso", async () => {
    const { result } = renderHook(() => useCategoriesModel());

    act(() => {
      result.current.openDeleteDialog(baseCategories[1]);
    });

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(fakeApi.delete).toHaveBeenCalledWith(
      "categories/category-alpha-child",
    );
    expect(categoriesMutate).toHaveBeenCalledTimes(1);
    expect(fakeToast.success).toHaveBeenCalledWith("Categoria removida");
    expect(result.current.categoryToDelete).toBeNull();
    expect(result.current.isDeleting).toBe(false);
  });

  it("não trata sucesso quando API retorna sucesso false na deleção", async () => {
    const { result } = renderHook(() => useCategoriesModel());

    act(() => {
      result.current.openDeleteDialog(baseCategories[1]);
    });
    fakeApi.delete.mockReturnValueOnce(createJsonResponse(deleteCategoryError));

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(fakeApi.delete).toHaveBeenCalledWith(
      "categories/category-alpha-child",
    );
    expect(fakeToast.success).not.toHaveBeenCalled();
    expect(categoriesMutate).not.toHaveBeenCalled();
    expect(result.current.categoryToDelete).toEqual(baseCategories[1]);
  });

  it("apresenta erro padrão quando deleção falha sem payload", async () => {
    const { result } = renderHook(() => useCategoriesModel());

    act(() => {
      result.current.openDeleteDialog(baseCategories[2]);
    });

    fakeApi.delete.mockReturnValueOnce(createRejectedJsonResponse(new Error("x")));
    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(fakeToast.error).toHaveBeenCalledWith("Erro ao deletar categoria");
    expect(result.current.isDeleting).toBe(false);
  });

  it("expande e recolhe nós da árvore", () => {
    const { result } = renderHook(() => useCategoriesModel());

    act(() => {
      result.current.expandAll();
    });
    expect(result.current.expandedNodes.size).toBe(4);
    expect(result.current.expandedNodes.has("category-beta")).toBe(true);

    act(() => {
      result.current.collapseAll();
    });
    expect(result.current.expandedNodes.size).toBe(0);
  });

  it("alterna expansão individual de nós", () => {
    const { result } = renderHook(() => useCategoriesModel());

    act(() => {
      result.current.toggleNode("category-alpha");
    });
    expect(result.current.expandedNodes.has("category-alpha")).toBe(true);

    act(() => {
      result.current.toggleNode("category-alpha");
    });
    expect(result.current.expandedNodes.has("category-alpha")).toBe(false);
  });
});
