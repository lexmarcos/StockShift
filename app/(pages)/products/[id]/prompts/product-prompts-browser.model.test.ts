import { afterEach, describe, expect, it, vi } from "vitest";
import {
  copyProductPromptText,
  installProductPromptShareReturnRecovery,
  shareProductPromptAssets,
} from "./product-prompts.model";

const originalProductPromptCreateObjectUrl = URL.createObjectURL;
const originalProductPromptRevokeObjectUrl = URL.revokeObjectURL;

interface ProductPromptImageFetchOptions {
  logoStatus?: number;
  logoType?: string;
  productType?: string;
  productStatus?: number;
}

function createProductPromptImageFetch(
  options: ProductPromptImageFetchOptions = {}
) {
  return vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
    const requestUrl = String(input);
    const isLogoRequest = requestUrl.includes("logo");
    const status = isLogoRequest
      ? options.logoStatus ?? 200
      : options.productStatus ?? 200;
    if (status !== 200) return new Response(null, { status });
    const imageType = isLogoRequest
      ? options.logoType ?? "image/png"
      : options.productType ?? "image/png";
    return createProductPromptImageResponse(imageType);
  });
}

function createProductPromptImageResponse(imageType: string): Response {
  return new Response(new Blob(["img"], { type: imageType }), {
    headers: { "Content-Type": imageType },
    status: 200,
  });
}

function getFirstProductPromptShareData(calls: unknown[][]): ShareData {
  const firstCall = calls[0];
  if (!firstCall) {
    throw new Error(`Invalid share call count "${calls.length}". Expected one call.`);
  }
  const shareData = firstCall[0];
  if (!shareData || typeof shareData !== "object") {
    throw new Error(`Invalid share payload "${String(shareData)}". Expected object.`);
  }
  return shareData as ShareData;
}

async function waitForProductPromptShareCall(
  shareMock: ReturnType<typeof vi.fn>
): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (shareMock.mock.calls.length > 0) return;
    await Promise.resolve();
  }
  throw new Error("Expected Share Sheet to be called.");
}

type ProductPromptCanvasMock = ReturnType<typeof vi.fn>;

interface ProductPromptFakeCanvasContext {
  beginPath: ProductPromptCanvasMock;
  closePath: ProductPromptCanvasMock;
  drawImage: ProductPromptCanvasMock;
  fill: ProductPromptCanvasMock;
  fillRect: ProductPromptCanvasMock;
  fillStyle: string | CanvasGradient | CanvasPattern;
  lineTo: ProductPromptCanvasMock;
  moveTo: ProductPromptCanvasMock;
  quadraticCurveTo: ProductPromptCanvasMock;
  restore: ProductPromptCanvasMock;
  save: ProductPromptCanvasMock;
}

function stubProductPromptCanvasPngExport(): ProductPromptFakeCanvasContext {
  const originalCreateElement = document.createElement.bind(document);
  const fakeContext = createFakeProductPromptCanvasContext();
  const fakeCanvas = createFakeProductPromptCanvas(fakeContext);
  vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
    if (tagName === "canvas") return fakeCanvas as unknown as HTMLCanvasElement;
    return originalCreateElement(tagName);
  });
  vi.stubGlobal("Image", FakeProductPromptImage);
  stubProductPromptObjectUrl();
  return fakeContext;
}

function createFakeProductPromptCanvasContext(): ProductPromptFakeCanvasContext {
  return {
    beginPath: vi.fn(),
    closePath: vi.fn(),
    drawImage: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    fillStyle: "",
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    restore: vi.fn(),
    save: vi.fn(),
  };
}

function createFakeProductPromptCanvas(fakeContext: ProductPromptFakeCanvasContext) {
  return {
    width: 0,
    height: 0,
    getContext: vi.fn(() => fakeContext),
    toBlob: vi.fn((callback: BlobCallback, type?: string) => {
      callback(new Blob(["png"], { type: type ?? "image/png" }));
    }),
  };
}

class FakeProductPromptImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  width = 12;
  height = 8;
  naturalWidth = 12;
  naturalHeight = 8;

  set src(_value: string) {
    this.onload?.();
  }
}

function stubProductPromptObjectUrl(): void {
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:product-prompt-image"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
}

function stubProductPromptIosStandaloneMode(): () => void {
  const restorers = [
    defineProductPromptNavigatorValue("userAgent", "Mozilla/5.0 (iPhone)"),
    defineProductPromptNavigatorValue("platform", "iPhone"),
    defineProductPromptNavigatorValue("maxTouchPoints", 5),
    defineProductPromptNavigatorValue("standalone", true),
  ];
  return () => restorers.forEach((restore) => restore());
}

function stubProductPromptHardReload(): {
  calls: string[];
  restore: () => void;
} {
  const recoveryWindow = window as Window & {
    __stockShiftProductPromptHardReload?: (reloadUrl: string) => void;
  };
  const previousHardReload = recoveryWindow.__stockShiftProductPromptHardReload;
  const calls: string[] = [];
  recoveryWindow.__stockShiftProductPromptHardReload = (reloadUrl: string) => {
    calls.push(reloadUrl);
  };
  return {
    calls,
    restore: () => {
      if (previousHardReload) {
        recoveryWindow.__stockShiftProductPromptHardReload = previousHardReload;
        return;
      }
      Reflect.deleteProperty(
        recoveryWindow,
        "__stockShiftProductPromptHardReload"
      );
    },
  };
}

function defineProductPromptNavigatorValue(
  key: string,
  value: unknown
): () => void {
  const descriptor = Object.getOwnPropertyDescriptor(navigator, key);
  Object.defineProperty(navigator, key, { configurable: true, value });
  return () => {
    if (descriptor) {
      Object.defineProperty(navigator, key, descriptor);
      return;
    }
    Reflect.deleteProperty(navigator, key);
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  sessionStorage.clear();
  restoreProductPromptObjectUrl("createObjectURL", originalProductPromptCreateObjectUrl);
  restoreProductPromptObjectUrl("revokeObjectURL", originalProductPromptRevokeObjectUrl);
});

type ProductPromptObjectUrlFunction =
  | typeof URL.createObjectURL
  | typeof URL.revokeObjectURL;

function restoreProductPromptObjectUrl(
  key: "createObjectURL" | "revokeObjectURL",
  value: ProductPromptObjectUrlFunction
): void {
  if (typeof value === "function") {
    Object.defineProperty(URL, key, { configurable: true, value });
    return;
  }
  Reflect.deleteProperty(URL, key);
}

describe("product prompt browser helpers", () => {
  it("copia o prompt em texto para a área de transferência", async () => {
    const clipboardWriteText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: clipboardWriteText },
    });

    const result = await copyProductPromptText({ promptText: "Prompt final" });

    expect(result).toBe("text");
    expect(clipboardWriteText).toHaveBeenCalledWith("Prompt final");
  });

  it("retorna unsupported quando o navegador não copia texto", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });

    const result = await copyProductPromptText({ promptText: "Prompt final" });

    expect(result).toBe("unsupported");
  });

  it("retorna unsupported quando o Share Sheet não está disponível", async () => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });

    const result = await shareProductPromptAssets({
      productImageUrl: "https://example.com/product.png",
    });

    expect(result).toBe("unsupported");
  });

  it("compartilha somente a imagem do produto pelo Share Sheet", async () => {
    const shareMock = vi.fn(async () => undefined);
    vi.stubGlobal("fetch", createProductPromptImageFetch());
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: shareMock,
    });

    const result = await shareProductPromptAssets({
      productImageUrl: "https://example.com/product.png",
    });

    expect(result).toBe("shared");
    const shareData = getFirstProductPromptShareData(shareMock.mock.calls);
    expect(shareData.text).toBeUndefined();
    expect(shareData.files).toHaveLength(1);
    expect(shareData.files?.[0]?.name).toBe("produto.png");
  });

  it("monta PNG combinado localmente antes de compartilhar", async () => {
    const shareMock = vi.fn(async () => undefined);
    const fetchMock = createProductPromptImageFetch();
    const fakeContext = stubProductPromptCanvasPngExport();
    vi.stubGlobal("fetch", fetchMock);
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: shareMock,
    });

    const result = await shareProductPromptAssets({
      companyLogoUrl: "https://example.com/logo.png",
      productImageUrl: "https://example.com/product.png",
    });

    expect(result).toBe("shared");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://example.com/product.png"
    );
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe("https://example.com/logo.png");
    expect(fakeContext.fillStyle).toBe("#000000");
    expect(fakeContext.fillRect).toHaveBeenCalledWith(0, 0, 12, 96);
    expect(fakeContext.drawImage).toHaveBeenCalledTimes(2);
    expect(fakeContext.drawImage).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      0,
      96,
      12,
      8
    );
    const shareData = getFirstProductPromptShareData(shareMock.mock.calls);
    expect(shareData.files?.[0]?.name).toBe("produto-com-logo.jpg");
    expect(shareData.files?.[0]?.type).toBe("image/jpeg");
  });

  it("falha sem compartilhar produto puro quando a logo não pode ser preparada", async () => {
    const shareMock = vi.fn(async () => undefined);
    const fetchMock = createProductPromptImageFetch({
      logoStatus: 404,
    });
    vi.stubGlobal("fetch", fetchMock);
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: shareMock,
    });

    const result = await shareProductPromptAssets({
      companyLogoUrl: "https://example.com/logo.png",
      productImageUrl: "https://example.com/product.png",
    });

    expect(result).toBe("brand-image-failed");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(shareMock).not.toHaveBeenCalled();
  });

  it("ignora canShare falso e tenta abrir o Share Sheet com uma imagem", async () => {
    const shareMock = vi.fn(async () => undefined);
    vi.stubGlobal("fetch", createProductPromptImageFetch());
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: shareMock,
    });
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: vi.fn(() => false),
    });

    const result = await shareProductPromptAssets({
      productImageUrl: "https://example.com/product.png",
    });

    expect(result).toBe("shared");
    expect(shareMock).toHaveBeenCalledTimes(1);
  });

  it("destrava quando o Share Sheet do iOS fica pendente ao sair do PWA", async () => {
    const shareMock = vi.fn(() => new Promise<void>(() => undefined));
    vi.stubGlobal("fetch", createProductPromptImageFetch());
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: shareMock,
    });

    const resultPromise = shareProductPromptAssets({
      productImageUrl: "https://example.com/product.png",
    });
    await waitForProductPromptShareCall(shareMock);

    window.dispatchEvent(new Event("pagehide"));

    await expect(resultPromise).resolves.toBe("shared");
    expect(shareMock).toHaveBeenCalledTimes(1);
  });

  it("recarrega o iOS PWA quando volta do app externo após compartilhar", async () => {
    const restoreStandaloneMode = stubProductPromptIosStandaloneMode();
    const hardReload = stubProductPromptHardReload();
    const shareMock = vi.fn(() => new Promise<void>(() => undefined));
    vi.stubGlobal("fetch", createProductPromptImageFetch());
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: shareMock,
    });

    try {
      const resultPromise = shareProductPromptAssets({
        productImageUrl: "https://example.com/product.png",
        returnUrl: "/products/prod-1/prompts",
      });
      await waitForProductPromptShareCall(shareMock);

      window.dispatchEvent(new Event("pagehide"));
      await expect(resultPromise).resolves.toBe("shared");
      expect(hardReload.calls).toHaveLength(0);

      window.dispatchEvent(new Event("pageshow"));

      expect(hardReload.calls).toHaveLength(1);
      expect(hardReload.calls[0]).toContain("/products/prod-1/prompts");
      expect(hardReload.calls[0]).toContain("ss_share_return=");
    } finally {
      hardReload.restore();
      restoreStandaloneMode();
    }
  });

  it("recarrega o iOS PWA quando volta sem disparar pagehide", async () => {
    const restoreStandaloneMode = stubProductPromptIosStandaloneMode();
    const hardReload = stubProductPromptHardReload();
    let resolveShare: (() => void) | null = null;
    const shareMock = vi.fn(
      () => new Promise<void>((resolve) => {
        resolveShare = resolve;
      })
    );
    vi.stubGlobal("fetch", createProductPromptImageFetch());
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: shareMock,
    });

    try {
      const resultPromise = shareProductPromptAssets({
        productImageUrl: "https://example.com/product.png",
        returnUrl: "/products/prod-1/prompts",
      });
      await waitForProductPromptShareCall(shareMock);

      window.dispatchEvent(new Event("blur"));
      window.dispatchEvent(new Event("focus"));

      expect(hardReload.calls).toHaveLength(1);
      expect(hardReload.calls[0]).toContain("/products/prod-1/prompts");
      expect(hardReload.calls[0]).toContain("ss_share_return=");
      resolveShare?.();
      await expect(resultPromise).resolves.toBe("shared");
    } finally {
      hardReload.restore();
      restoreStandaloneMode();
    }
  });

  it("limpa travas de toque quando a página volta após a recarga de recuperação", async () => {
    const restoreStandaloneMode = stubProductPromptIosStandaloneMode();
    const hardReload = stubProductPromptHardReload();
    const shareMock = vi.fn(() => new Promise<void>(() => undefined));
    vi.stubGlobal("fetch", createProductPromptImageFetch());
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: shareMock,
    });

    try {
      const resultPromise = shareProductPromptAssets({
        productImageUrl: "https://example.com/product.png",
        returnUrl: "/products/prod-1/prompts",
      });
      await waitForProductPromptShareCall(shareMock);

      window.dispatchEvent(new Event("pagehide"));
      await expect(resultPromise).resolves.toBe("shared");
      window.dispatchEvent(new Event("pageshow"));
      expect(hardReload.calls).toHaveLength(1);
      expect(hardReload.calls[0]).toContain("/products/prod-1/prompts");

      document.body.style.pointerEvents = "none";
      document.body.style.overflow = "hidden";
      document.documentElement.style.touchAction = "none";
      const cleanupRecovery = installProductPromptShareReturnRecovery();
      window.dispatchEvent(new Event("pageshow"));

      expect(document.body.style.pointerEvents).toBe("");
      expect(document.body.style.overflow).toBe("");
      expect(document.documentElement.style.touchAction).toBe("");
      expect(hardReload.calls).toHaveLength(1);
      cleanupRecovery();
    } finally {
      hardReload.restore();
      restoreStandaloneMode();
    }
  });

  it("compõe localmente com imagens R2 buscadas pelo proxy de CORS", async () => {
    const shareMock = vi.fn(async () => undefined);
    const fetchMock = createProductPromptImageFetch();
    stubProductPromptCanvasPngExport();
    vi.stubGlobal("fetch", fetchMock);
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: shareMock,
    });

    const result = await shareProductPromptAssets({
      companyLogoUrl: "https://pub-test.r2.dev/company-logos/logo.png",
      productImageUrl: "https://pub-test.r2.dev/products/product.png",
    });

    expect(result).toBe("shared");
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      "/api/product-prompt-assets/image?"
    );
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      "url=https%3A%2F%2Fpub-test.r2.dev%2Fproducts%2Fproduct.png"
    );
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain(
      "/api/product-prompt-assets/image?"
    );
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain(
      "url=https%3A%2F%2Fpub-test.r2.dev%2Fcompany-logos%2Flogo.png"
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const shareData = getFirstProductPromptShareData(shareMock.mock.calls);
    expect(shareData.files?.[0]?.name).toBe("produto-com-logo.jpg");
    expect(shareData.files?.[0]?.type).toBe("image/jpeg");
  });

  it("converte imagem webp para jpeg comprimido antes de abrir o Share Sheet", async () => {
    const shareMock = vi.fn(async () => undefined);
    vi.stubGlobal("fetch", createProductPromptImageFetch({ productType: "image/webp" }));
    stubProductPromptCanvasPngExport();
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: shareMock,
    });

    const result = await shareProductPromptAssets({
      productImageUrl: "https://example.com/product.webp",
    });

    expect(result).toBe("shared");
    const shareData = getFirstProductPromptShareData(shareMock.mock.calls);
    expect(shareData.files?.[0]?.name).toBe("produto.jpg");
    expect(shareData.files?.[0]?.type).toBe("image/jpeg");
  });

  it("falha quando a imagem do produto não pode ser preparada", async () => {
    const shareMock = vi.fn(async () => undefined);
    vi.stubGlobal("fetch", createProductPromptImageFetch({ productStatus: 404 }));
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: shareMock,
    });

    const result = await shareProductPromptAssets({
      productImageUrl: "https://example.com/product.png",
    });

    expect(result).toBe("product-image-failed");
    expect(shareMock).not.toHaveBeenCalled();
  });
});
