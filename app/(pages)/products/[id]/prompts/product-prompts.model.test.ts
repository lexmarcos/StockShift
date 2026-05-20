import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildGeneratePromptDefaults,
  buildProductPromptChatGptMessage,
  buildProductPromptCreateFormData,
  buildProductPromptPriceInstruction,
  buildProductPromptPricePreview,
  calculateProductPromptCashPriceCents,
  calculateProductPromptInstallmentBaseCents,
  calculateProductPromptInstallmentCents,
  formatProductPromptBrl,
  findLatestProductPromptBatch,
  getProductPromptPositionLabel,
  useProductPromptsModel,
} from "./product-prompts.model";
import { useProductPromptGeneratePageModel } from "./[promptId]/product-prompt-generate.model";
import type { Product, ProductBatch } from "../products-detail.types";
import type {
  ProductPromptAssetShareInput,
  ProductPromptAssetShareResult,
  ProductPromptBatchesResponse,
  ProductPromptBrowserActions,
  ProductPromptCompanyResponse,
  ProductPromptListResponse,
  ProductPromptProductResponse,
  ProductPromptTextCopyInput,
  ProductPromptTextCopyResult,
  SavedProductImagePrompt,
} from "./product-prompts.types";
import {
  productPromptGenerateSchema,
  type ProductPromptCreateFormData,
} from "./product-prompts.schema";

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  swr: vi.fn(),
  swrMutate: vi.fn(),
  useSelectedWarehouse: vi.fn(),
  toastSuccess: vi.fn(),
  toastInfo: vi.fn(),
  toastError: vi.fn(),
  routerPush: vi.fn(),
}));

vi.mock("swr", () => ({
  default: (...args: unknown[]) => mocks.swr(...args),
  mutate: (...args: unknown[]) => mocks.swrMutate(...args),
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: (...args: unknown[]) => mocks.apiGet(...args),
    post: (...args: unknown[]) => mocks.apiPost(...args),
  },
}));

vi.mock("@/components/breadcrumb", () => ({ useBreadcrumb: vi.fn() }));

vi.mock("@/hooks/use-selected-warehouse", () => ({
  useSelectedWarehouse: () => mocks.useSelectedWarehouse(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.routerPush }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mocks.toastSuccess(...args),
    info: (...args: unknown[]) => mocks.toastInfo(...args),
    error: (...args: unknown[]) => mocks.toastError(...args),
  },
}));

class FakeProductPromptBrowserActions implements ProductPromptBrowserActions {
  copiedPromptText: string | null = null;
  sharedCompanyLogoUrl: string | null | undefined = null;
  sharedProductImageUrl: string | null = null;
  copyResult: ProductPromptTextCopyResult = "text";
  shareResult: ProductPromptAssetShareResult = "shared";

  async copyPromptText(
    input: ProductPromptTextCopyInput
  ): Promise<ProductPromptTextCopyResult> {
    this.copiedPromptText = input.promptText;
    return this.copyResult;
  }

  async sharePromptAssets(
    input: ProductPromptAssetShareInput
  ): Promise<ProductPromptAssetShareResult> {
    this.sharedCompanyLogoUrl = input.companyLogoUrl;
    this.sharedProductImageUrl = input.productImageUrl;
    return this.shareResult;
  }
}

const product: Product = {
  id: "prod-1",
  name: "Produto Teste",
  description: null,
  imageUrl: "https://example.com/product.png",
  categoryId: null,
  categoryName: null,
  brand: null,
  barcode: null,
  barcodeType: null,
  sku: null,
  isKit: false,
  attributes: null,
  hasExpiration: false,
  active: true,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const olderBatch: ProductBatch = {
  id: "batch-old",
  productId: "prod-1",
  warehouseId: "wh-1",
  warehouseName: "Principal",
  quantity: 3,
  sellingPrice: 1800,
  createdAt: "2026-01-01T10:00:00Z",
  updatedAt: "2026-01-01T10:00:00Z",
};

const latestBatch: ProductBatch = {
  ...olderBatch,
  id: "batch-new",
  quantity: 8,
  sellingPrice: 2500,
  createdAt: "2026-01-02T10:00:00Z",
};

const savedPrompt: SavedProductImagePrompt = {
  id: "prompt-1",
  name: "Oferta premium",
  prompt: "Crie uma arte sofisticada com o produto em destaque.",
  imageUrl: "https://example.com/reference.png",
  createdAt: "2026-01-03T10:00:00Z",
  updatedAt: "2026-01-03T10:00:00Z",
};

const productResponse: ProductPromptProductResponse = {
  success: true,
  message: null,
  data: product,
};
const promptListResponse: ProductPromptListResponse = {
  success: true,
  message: null,
  data: [savedPrompt],
};
const batchesResponse: ProductPromptBatchesResponse = {
  success: true,
  message: null,
  data: [olderBatch, latestBatch],
};
const companyResponse: ProductPromptCompanyResponse = {
  success: true,
  message: null,
  data: {
    logoUrl: "https://example.com/company-logo.png",
  },
};
function readBlobText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

function expectGeneratePromptSchemaInvalid(
  result: ReturnType<typeof productPromptGenerateSchema.safeParse>
) {
  expect(result.success).toBe(false);
  if (result.success) {
    throw new Error("Expected generate prompt schema to be invalid.");
  }
  return result.error.issues;
}

function createDeferredProductPromptShareResult() {
  let resolve!: (value: ProductPromptAssetShareResult) => void;
  const promise = new Promise<ProductPromptAssetShareResult>((innerResolve) => {
    resolve = innerResolve;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useSelectedWarehouse.mockReturnValue({ warehouseId: "wh-1" });
  mocks.apiGet.mockReturnValue({ json: vi.fn(async () => companyResponse) });
  mocks.apiPost.mockReturnValue({
    json: vi.fn(async () => ({ success: true, message: null, data: savedPrompt })),
  });
  mocks.swr.mockImplementation((key: string | null) => {
    if (key === "products/prod-1") {
      return { data: productResponse, error: null, isLoading: false };
    }
    if (key === "product-prompts") {
      return { data: promptListResponse, error: null, isLoading: false };
    }
    if (key === "batches/warehouses/wh-1/products/prod-1/batches") {
      return { data: batchesResponse, error: null, isLoading: false };
    }
    return { data: undefined, error: null, isLoading: false };
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("product prompt price helpers", () => {
  it("formata valores em BRL", () => {
    expect(formatProductPromptBrl(35490)).toBe("R$ 354,90");
  });

  it("calcula preço à vista por desconto", () => {
    const cashPrice = calculateProductPromptCashPriceCents({
      normalPriceCents: 10000,
      showCashOffer: true,
      cashOfferMode: "discount-percent",
      cashDiscountPercent: 15,
      pricePosition: "top-center",
    });

    expect(cashPrice).toBe(8500);
  });

  it("monta prévia com oferta à vista por preço final", () => {
    const preview = buildProductPromptPricePreview({
      normalPriceCents: 35490,
      showCashOffer: true,
      cashOfferMode: "final-price",
      cashPriceCents: 23589,
      showInstallments: false,
      installmentBase: "normal-price",
      pricePosition: "top-center",
    });

    expect(preview).toBe("De: R$ 354,90\nPor: R$ 235,89 à vista");
  });

  it("calcula base própria e parcela", () => {
    const input = {
      normalPriceCents: 35490,
      showCashOffer: true,
      cashOfferMode: "final-price" as const,
      cashPriceCents: 23589,
      showInstallments: true,
      installments: 10,
      installmentBase: "custom-price" as const,
      installmentPriceCents: 28990,
      pricePosition: "bottom-right" as const,
    };

    expect(calculateProductPromptInstallmentBaseCents(input)).toBe(28990);
    expect(calculateProductPromptInstallmentCents(input)).toBe(2899);
  });

  it("monta prévia com preço normal e parcelamento", () => {
    const preview = buildProductPromptPricePreview({
      normalPriceCents: 10000,
      showCashOffer: false,
      cashOfferMode: "final-price",
      showInstallments: true,
      installments: 5,
      installmentBase: "normal-price",
      pricePosition: "middle-left",
    });

    expect(preview).toBe("Por: R$ 100,00\nOu em 5x de R$ 20,00 sem juros");
  });

  it("monta instrução final com regras de logo e preço", () => {
    const instruction = buildProductPromptPriceInstruction({
      normalPriceCents: 35490,
      showCashOffer: true,
      cashOfferMode: "final-price",
      cashPriceCents: 23589,
      showInstallments: true,
      installments: 10,
      installmentBase: "custom-price",
      installmentPriceCents: 28990,
      pricePosition: "top-center",
      savedPrompt: "Prompt base",
    });

    expect(instruction).toContain("Use a imagem enviada como referência");
    expect(instruction).toContain("Posicione a logo em: inferior centro");
    expect(instruction).toContain(
      "Adicione na imagem um bloco de preço estilizado na posição: Sup. centro."
    );
    expect(instruction).not.toContain("Texto do bloco:");
    expect(instruction).toContain("De: R$ 354,90");
    expect(instruction).toContain("Ou em 10x de R$ 28,99 sem juros");
    expect(instruction).toContain("proporção 9:16");
    expect(instruction).toContain("Use uma fonte serifada bold para o preço");
  });
});

describe("product prompt composition helpers", () => {
  it("concatena prompt salvo e instrução de preço sem URL da imagem", () => {
    const message = buildProductPromptChatGptMessage({
      savedPrompt: "Prompt base",
      normalPriceCents: 10000,
      showCashOffer: true,
      cashOfferMode: "discount-percent",
      cashDiscountPercent: 10,
      showInstallments: false,
      installmentBase: "normal-price",
      pricePosition: "top-left",
    });

    expect(message).toMatch(/^Prompt base\n\nUse a imagem enviada/);
    expect(message).not.toContain("Imagem do produto para referência:");
    expect(message).not.toContain("https://example.com/product.png");
  });
});

describe("product prompt form data", () => {
  it("monta multipart com JSON do prompt e arquivo de imagem", async () => {
    const imageFile = new File(["image"], "prompt.png", { type: "image/png" });
    const formData = buildProductPromptCreateFormData({
      imageFile,
      name: "  Nova arte  ",
      prompt: "  Prompt de teste  ",
    });

    const promptPart = formData.get("prompt");
    expect(promptPart).toBeInstanceOf(Blob);
    expect(JSON.parse(await readBlobText(promptPart as Blob))).toEqual({
      name: "Nova arte",
      prompt: "Prompt de teste",
    });
    expect(formData.get("image")).toBe(imageFile);
  });
});

describe("product prompt generate schema", () => {
  it("exige preço à vista quando oferta por preço final está ativa", () => {
    const result = productPromptGenerateSchema.safeParse({
      normalPriceCents: 10000,
      showCashOffer: true,
      cashOfferMode: "final-price",
      showInstallments: false,
      installmentBase: "normal-price",
      pricePosition: "top-center",
    });

    const issues = expectGeneratePromptSchemaInvalid(result);
    expect(issues.some((issue) => issue.path[0] === "cashPriceCents")).toBe(true);
  });

  it("bloqueia desconto maior que 100%", () => {
    const result = productPromptGenerateSchema.safeParse({
      normalPriceCents: 10000,
      showCashOffer: true,
      cashOfferMode: "discount-percent",
      cashDiscountPercent: 101,
      showInstallments: false,
      installmentBase: "normal-price",
      pricePosition: "top-center",
    });

    const issues = expectGeneratePromptSchemaInvalid(result);
    expect(issues.some((issue) => issue.path[0] === "cashDiscountPercent")).toBe(
      true
    );
  });

  it("exige parcelas maior que 1 quando parcelamento está ativo", () => {
    const result = productPromptGenerateSchema.safeParse({
      normalPriceCents: 10000,
      showCashOffer: false,
      cashOfferMode: "final-price",
      showInstallments: true,
      installments: 1,
      installmentBase: "normal-price",
      pricePosition: "top-center",
    });

    const issues = expectGeneratePromptSchemaInvalid(result);
    expect(issues.some((issue) => issue.path[0] === "installments")).toBe(true);
  });

  it("exige preço próprio quando essa é a base do parcelamento", () => {
    const result = productPromptGenerateSchema.safeParse({
      normalPriceCents: 10000,
      showCashOffer: false,
      cashOfferMode: "final-price",
      showInstallments: true,
      installments: 10,
      installmentBase: "custom-price",
      pricePosition: "top-center",
    });

    const issues = expectGeneratePromptSchemaInvalid(result);
    expect(issues.some((issue) => issue.path[0] === "installmentPriceCents")).toBe(
      true
    );
  });

  it("bloqueia base à vista quando a oferta à vista não existe", () => {
    const result = productPromptGenerateSchema.safeParse({
      normalPriceCents: 10000,
      showCashOffer: false,
      cashOfferMode: "final-price",
      showInstallments: true,
      installments: 10,
      installmentBase: "cash-price",
      pricePosition: "top-center",
    });

    const issues = expectGeneratePromptSchemaInvalid(result);
    expect(issues.some((issue) => issue.path[0] === "installmentBase")).toBe(true);
  });

  it("bloqueia base à vista quando a oferta está ativa mas sem preço calculado", () => {
    const result = productPromptGenerateSchema.safeParse({
      normalPriceCents: 10000,
      showCashOffer: true,
      cashOfferMode: "final-price",
      showInstallments: true,
      installments: 10,
      installmentBase: "cash-price",
      pricePosition: "top-center",
    });

    const issues = expectGeneratePromptSchemaInvalid(result);
    expect(issues.some((issue) => issue.path[0] === "installmentBase")).toBe(true);
  });
});

describe("product prompt batch helpers", () => {
  it("seleciona o lote mais recente por data de criação", () => {
    expect(findLatestProductPromptBatch([olderBatch, latestBatch])).toEqual(
      latestBatch
    );
  });

  it("usa preço do lote mais recente nos valores padrão", () => {
    expect(buildGeneratePromptDefaults(latestBatch).normalPriceCents).toBe(2500);
  });

  it("retorna label da posição escolhida", () => {
    expect(getProductPromptPositionLabel("middle-center")).toBe("Centro");
  });
});

describe("useProductPromptsModel", () => {
  it("carrega produto e prompts globais via SWR", async () => {
    const { result } = renderHook(() => useProductPromptsModel("prod-1"));

    await waitFor(() => expect(result.current.prompts).toEqual([savedPrompt]));
    expect(mocks.swr).toHaveBeenCalledWith("product-prompts", expect.any(Function));
    expect(result.current.product).toEqual(product);
  });

  it("cria prompt no backend com multipart e invalida product-prompts", async () => {
    const imageFile = new File(["image"], "prompt.png", { type: "image/png" });
    const payload: ProductPromptCreateFormData = {
      imageFile,
      name: "  Nova arte  ",
      prompt: "  Prompt de teste  ",
    };

    const { result } = renderHook(() => useProductPromptsModel("prod-1"));

    await act(async () => {
      await result.current.submitCreatePrompt(payload);
    });

    expect(mocks.apiPost).toHaveBeenCalledWith("product-prompts", {
      body: expect.any(FormData),
    });
    const body = (mocks.apiPost.mock.calls[0][1] as { body: FormData }).body;
    const promptPart = body.get("prompt");
    expect(JSON.parse(await readBlobText(promptPart as Blob))).toEqual({
      name: "Nova arte",
      prompt: "Prompt de teste",
    });
    expect(body.get("image")).toBe(imageFile);
    expect(mocks.swrMutate).toHaveBeenCalledWith("product-prompts");
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Prompt criado com sucesso.");
  });
});

describe("useProductPromptGeneratePageModel", () => {
  it("carrega o prompt escolhido e usa o preço do lote mais recente", async () => {
    const actions = new FakeProductPromptBrowserActions();

    const { result } = renderHook(() =>
      useProductPromptGeneratePageModel("prod-1", "prompt-1", {
        browserActions: actions,
      })
    );

    await waitFor(() => expect(result.current.selectedPrompt).toEqual(savedPrompt));
    expect(result.current.generatePromptForm.getValues("normalPriceCents")).toBe(2500);
  });

  it("copia o prompt e compartilha a imagem do produto com a logo", async () => {
    const actions = new FakeProductPromptBrowserActions();

    const { result } = renderHook(() =>
      useProductPromptGeneratePageModel("prod-1", "prompt-1", {
        browserActions: actions,
      })
    );

    await act(async () => {
      await result.current.submitGeneratePrompt({
        normalPriceCents: 10000,
        showCashOffer: true,
        cashOfferMode: "discount-percent",
        cashDiscountPercent: 10,
        showInstallments: true,
        installments: 10,
        installmentBase: "cash-price",
        pricePosition: "top-center",
      });
    });

    expect(actions.copiedPromptText).toContain(savedPrompt.prompt);
    expect(actions.copiedPromptText).toContain("Use a imagem enviada");
    expect(actions.copiedPromptText).toContain("Ou em 10x");
    expect(actions.copiedPromptText).not.toContain(product.imageUrl);
    expect(actions.sharedCompanyLogoUrl).toBe(companyResponse.data.logoUrl);
    expect(actions.sharedProductImageUrl).toBe(product.imageUrl);
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "Imagem do produto enviada para compartilhamento. Prompt copiado."
    );
    expect(mocks.toastSuccess).toHaveBeenCalledTimes(1);
  });

  it("marca preparação da imagem enquanto compartilha o arquivo composto", async () => {
    const shareDeferred = createDeferredProductPromptShareResult();
    const actions: ProductPromptBrowserActions = {
      copyPromptText: vi.fn(async () => "text" as ProductPromptTextCopyResult),
      sharePromptAssets: vi.fn(() => shareDeferred.promise),
    };

    const { result } = renderHook(() =>
      useProductPromptGeneratePageModel("prod-1", "prompt-1", {
        browserActions: actions,
      })
    );

    let submitPromise!: Promise<void>;
    act(() => {
      submitPromise = result.current.submitGeneratePrompt({
        normalPriceCents: 10000,
        showCashOffer: true,
        cashOfferMode: "discount-percent",
        cashDiscountPercent: 10,
        showInstallments: true,
        installments: 10,
        installmentBase: "cash-price",
        pricePosition: "top-center",
      });
    });

    await waitFor(() => expect(result.current.isPreparingShareImage).toBe(true));

    await act(async () => {
      shareDeferred.resolve("shared");
      await submitPromise;
    });

    expect(result.current.isPreparingShareImage).toBe(false);
  });

  it("mostra um único aviso quando compartilha mas o clipboard falha", async () => {
    const actions = new FakeProductPromptBrowserActions();
    actions.copyResult = "unsupported";

    const { result } = renderHook(() =>
      useProductPromptGeneratePageModel("prod-1", "prompt-1", {
        browserActions: actions,
      })
    );

    await act(async () => {
      await result.current.submitGeneratePrompt({
        normalPriceCents: 10000,
        showCashOffer: false,
        cashOfferMode: "final-price",
        showInstallments: false,
        installmentBase: "normal-price",
        pricePosition: "top-center",
      });
    });

    expect(actions.copiedPromptText).toContain(savedPrompt.prompt);
    expect(actions.sharedProductImageUrl).toBe(product.imageUrl);
    expect(mocks.toastInfo).toHaveBeenCalledWith(
      "Imagem do produto enviada. Copie o prompt manualmente."
    );
    expect(mocks.toastInfo).toHaveBeenCalledTimes(1);
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it("mostra um único erro quando copia o prompt mas a imagem falha", async () => {
    const actions = new FakeProductPromptBrowserActions();
    actions.shareResult = "product-image-failed";

    const { result } = renderHook(() =>
      useProductPromptGeneratePageModel("prod-1", "prompt-1", {
        browserActions: actions,
      })
    );

    await act(async () => {
      await result.current.submitGeneratePrompt({
        normalPriceCents: 10000,
        showCashOffer: false,
        cashOfferMode: "final-price",
        showInstallments: false,
        installmentBase: "normal-price",
        pricePosition: "top-center",
      });
    });

    expect(actions.copiedPromptText).toContain(savedPrompt.prompt);
    expect(mocks.toastError).toHaveBeenCalledWith(
      "Prompt copiado, mas a imagem do produto não pôde ser preparada."
    );
    expect(mocks.toastError).toHaveBeenCalledTimes(1);
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
  });

  it("não compartilha quando o produto está sem imagem", async () => {
    const actions = new FakeProductPromptBrowserActions();
    mocks.swr.mockImplementation((key: string | null) => {
      if (key === "products/prod-1") {
        return {
          data: { ...productResponse, data: { ...product, imageUrl: null } },
          error: null,
          isLoading: false,
        };
      }
      if (key === "product-prompts") {
        return { data: promptListResponse, error: null, isLoading: false };
      }
      if (key === "product-prompts/company-assets") {
        return { data: companyResponse, error: null, isLoading: false };
      }
      return { data: batchesResponse, error: null, isLoading: false };
    });

    const { result } = renderHook(() =>
      useProductPromptGeneratePageModel("prod-1", "prompt-1", {
        browserActions: actions,
      })
    );

    await act(async () => {
      await result.current.submitGeneratePrompt({
        normalPriceCents: 10000,
        showCashOffer: false,
        cashOfferMode: "final-price",
        showInstallments: false,
        installmentBase: "normal-price",
        pricePosition: "top-center",
      });
    });

    expect(actions.sharedProductImageUrl).toBeNull();
    expect(actions.copiedPromptText).toBeNull();
    expect(mocks.toastError).toHaveBeenCalledWith(
      "Produto sem imagem. Adicione uma imagem antes de gerar."
    );
  });
});
