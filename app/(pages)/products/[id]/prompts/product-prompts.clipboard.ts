import type {
  ProductPromptAssetShareInput,
  ProductPromptAssetShareResult,
  ProductPromptTextCopyInput,
  ProductPromptTextCopyResult,
} from "./product-prompts.types";

type ProductPromptDrawableImage = HTMLImageElement | ImageBitmap;

const PRODUCT_PROMPT_CANVAS_JPEG_QUALITY = 0.82;
const PRODUCT_PROMPT_CANVAS_MAX_LONG_EDGE = 1600;
const PRODUCT_PROMPT_SHARE_RECOVERY_TIMEOUT_MS = 15000;
const PRODUCT_PROMPT_SHARE_RETURN_FALLBACK_MS = 2500;
const PRODUCT_PROMPT_SHARE_RETURN_MAX_AGE_MS = 10 * 60 * 1000;
const PRODUCT_PROMPT_SHARE_RETURN_RELOAD_TIMEOUT_MS = 120000;
const PRODUCT_PROMPT_SHARE_RETURN_STORAGE_KEY =
  "stockshift:product-prompt-share-return";
const PRODUCT_PROMPT_SHARE_RETURN_URL_PARAM = "ss_share_return";
let productPromptShareReturnReloadCleanup: (() => void) | null = null;

interface ProductPromptShareReturnGuard {
  cleanup: () => void;
  markExternalAppOpened: () => void;
  reloadAfterReturn: () => void;
}

interface ProductPromptShareReturnListenerInput {
  markExternalAppOpened: () => void;
  reloadOnce: () => void;
}

interface ProductPromptShareReturnDomListeners {
  handleBlur: () => void;
  handlePageHide: () => void;
  handleVisibilityChange: () => void;
  reloadOnce: () => void;
}

interface ProductPromptShareReturnState {
  fallbackTimeoutId?: ReturnType<typeof globalThis.setTimeout>;
  hasExternalAppSignal: boolean;
  hasReloaded: boolean;
}

interface ProductPromptShareReturnSession {
  reloadAttempted: boolean;
  returnUrl?: string;
  startedAt: number;
}

interface ProductPromptShareRecoveryWindow extends Window {
  __stockShiftProductPromptHardReload?: (reloadUrl: string) => void;
}

export async function copyProductPromptText(
  input: ProductPromptTextCopyInput
): Promise<ProductPromptTextCopyResult> {
  if (!canWriteProductPromptClipboardText()) return "unsupported";
  try {
    await globalThis.navigator.clipboard.writeText(input.promptText);
    return "text";
  } catch {
    return "copy-failed";
  }
}

export async function shareProductPromptAssets(
  input: ProductPromptAssetShareInput
): Promise<ProductPromptAssetShareResult> {
  if (shouldUseProductPromptIosPwaShareFallback()) {
    return "ios-pwa-file-share-blocked";
  }
  if (!canShareProductPromptAssets()) return "unsupported";
  const shareFileResult = await buildProductPromptShareFile(input);
  if (shareFileResult.result !== "ready") return shareFileResult.result;
  return callProductPromptShare([shareFileResult.file], input.returnUrl);
}

export function installProductPromptShareReturnRecovery(): () => void {
  if (typeof globalThis.window === "undefined") return () => undefined;
  const recoverVisiblePage = () => {
    if (globalThis.document?.visibilityState === "hidden") return;
    recoverProductPromptShareReturnState();
  };

  const mountRecoveryTimeoutId = globalThis.setTimeout(
    recoverProductPromptShareReturnState,
    0
  );
  globalThis.window.addEventListener("pageshow", recoverVisiblePage);
  globalThis.window.addEventListener("focus", recoverVisiblePage);
  globalThis.document?.addEventListener("visibilitychange", recoverVisiblePage);

  return () => {
    globalThis.clearTimeout(mountRecoveryTimeoutId);
    globalThis.window.removeEventListener("pageshow", recoverVisiblePage);
    globalThis.window.removeEventListener("focus", recoverVisiblePage);
    globalThis.document?.removeEventListener(
      "visibilitychange",
      recoverVisiblePage
    );
  };
}

async function buildProductPromptShareFile(
  input: ProductPromptAssetShareInput
): Promise<ProductPromptShareFileBuildResult> {
  const productImageBlob = await fetchProductPromptImageBlob(input.productImageUrl);
  if (!productImageBlob) return { result: "product-image-failed" };
  if (!input.companyLogoUrl) {
    const file = await normalizeProductPromptShareFile(productImageBlob, "produto");
    return { file, result: "ready" };
  }
  const companyLogoBlob = await fetchProductPromptImageBlob(input.companyLogoUrl);
  if (!companyLogoBlob) return { result: "brand-image-failed" };
  const combinedImageBlob = await composeProductPromptImageWithLogo(
    productImageBlob,
    companyLogoBlob
  );
  if (!combinedImageBlob) return { result: "brand-image-failed" };
  return {
    file: buildProductPromptImageFile(
      combinedImageBlob,
      "produto-com-logo",
      "image/jpeg"
    ),
    result: "ready",
  };
}

async function normalizeProductPromptShareFile(
  imageBlob: Blob,
  filePrefix: string
): Promise<File> {
  const imageType = imageBlob.type || "image/png";
  if (isProductPromptShareSafeImageType(imageType)) {
    return buildProductPromptImageFile(imageBlob, filePrefix, imageType);
  }
  return convertProductPromptImageBlobToJpeg(imageBlob, filePrefix);
}

function buildProductPromptImageFile(
  imageBlob: Blob,
  filePrefix: string,
  imageType: string
): File {
  return new File([imageBlob], buildProductPromptImageFileName(filePrefix, imageType), {
    type: imageType,
  });
}

function isProductPromptShareSafeImageType(imageType: string): boolean {
  return imageType === "image/png" || imageType === "image/jpeg";
}

async function fetchProductPromptImageBlob(imageUrl: string): Promise<Blob | null> {
  try {
    const response = await fetch(resolveProductPromptImageFetchUrl(imageUrl), {
      cache: "no-store",
    });
    if (!response.ok) return null;
    const imageBlob = await response.blob();
    return imageBlob.type.startsWith("image/") ? imageBlob : null;
  } catch {
    return null;
  }
}

type ProductPromptShareFileBuildResult =
  | { file: File; result: "ready" }
  | { result: "brand-image-failed" | "product-image-failed" };

function resolveProductPromptImageFetchUrl(imageUrl: string): string {
  if (!shouldProxyProductPromptImageUrl(imageUrl)) return imageUrl;
  const searchParams = new URLSearchParams({ url: imageUrl });
  return `/api/product-prompt-assets/image?${searchParams.toString()}`;
}

function shouldProxyProductPromptImageUrl(imageUrl: string): boolean {
  if (typeof globalThis.location === "undefined") return false;
  const parsedUrl = parseProductPromptImageUrl(imageUrl);
  if (!parsedUrl) return false;
  return parsedUrl.origin !== globalThis.location.origin && isProductPromptR2Url(parsedUrl);
}

function parseProductPromptImageUrl(imageUrl: string): URL | null {
  try {
    return new URL(imageUrl, globalThis.location.href);
  } catch {
    return null;
  }
}

function isProductPromptR2Url(imageUrl: URL): boolean {
  return imageUrl.protocol === "https:" && imageUrl.hostname.endsWith(".r2.dev");
}

async function callProductPromptShare(
  files: File[],
  returnUrl?: string
): Promise<ProductPromptAssetShareResult> {
  const shareReturnGuard = createProductPromptShareReturnGuard(returnUrl);
  const shareRecovery = createProductPromptShareRecovery(
    shareReturnGuard.markExternalAppOpened
  );
  try {
    return await Promise.race([
      runProductPromptNativeShare(files, shareReturnGuard),
      shareRecovery.promise,
    ]);
  } catch (error) {
    shareReturnGuard.cleanup();
    clearProductPromptShareReturnSession();
    return getProductPromptShareFailure(error);
  } finally {
    shareRecovery.cleanup();
  }
}

async function runProductPromptNativeShare(
  files: File[],
  shareReturnGuard: ProductPromptShareReturnGuard
): Promise<ProductPromptAssetShareResult> {
  await globalThis.navigator.share({ files });
  shareReturnGuard.reloadAfterReturn();
  return "shared";
}

function canWriteProductPromptClipboardText(): boolean {
  return (
    typeof globalThis.navigator !== "undefined" &&
    typeof globalThis.navigator.clipboard?.writeText === "function"
  );
}

function canShareProductPromptAssets(): boolean {
  return (
    typeof globalThis.navigator !== "undefined" &&
    typeof globalThis.navigator.share === "function" &&
    typeof File !== "undefined"
  );
}

function createProductPromptShareRecovery(onExternalAppOpened: () => void): {
  cleanup: () => void;
  promise: Promise<ProductPromptAssetShareResult>;
} {
  if (typeof globalThis.window === "undefined") {
    return {
      cleanup: () => undefined,
      promise: new Promise(() => undefined),
    };
  }

  let timeoutId: ReturnType<typeof globalThis.setTimeout> | undefined;
  let cleanup = () => undefined;
  let hasFinished = false;
  const promise = new Promise<ProductPromptAssetShareResult>((resolve) => {
    const finish = (shouldReloadOnReturn: boolean) => {
      if (hasFinished) return;
      hasFinished = true;
      cleanup();
      if (shouldReloadOnReturn) onExternalAppOpened();
      resolve("shared");
    };
    const handleVisibilityChange = () => {
      if (globalThis.document?.visibilityState === "hidden") finish(true);
    };
    const handlePageHide = () => finish(true);

    cleanup = () => {
      globalThis.document?.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
      globalThis.window.removeEventListener("pagehide", handlePageHide);
      if (timeoutId) globalThis.clearTimeout(timeoutId);
      timeoutId = undefined;
    };

    globalThis.document?.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );
    globalThis.window.addEventListener("pagehide", handlePageHide, {
      once: true,
    });
    timeoutId = globalThis.setTimeout(
      () => finish(false),
      PRODUCT_PROMPT_SHARE_RECOVERY_TIMEOUT_MS
    );
  });

  return { cleanup, promise };
}

function createProductPromptShareReturnGuard(
  returnUrl?: string
): ProductPromptShareReturnGuard {
  if (!shouldReloadProductPromptAfterShareReturn()) {
    return createInactiveProductPromptShareReturnGuard();
  }
  productPromptShareReturnReloadCleanup?.();
  const state = createProductPromptShareReturnState();
  let listenerCleanup = () => undefined;
  const reloadOnce = () => reloadProductPromptShareReturnOnce(state, cleanupGuard);
  const markExternalAppOpened = () =>
    markProductPromptExternalAppOpened(state, reloadOnce, returnUrl);

  function cleanupGuard(): void {
    cleanupProductPromptShareReturnGuard(state, listenerCleanup, cleanupGuard);
  }

  listenerCleanup = listenForProductPromptShareReturn({
    markExternalAppOpened,
    reloadOnce,
  });
  productPromptShareReturnReloadCleanup = cleanupGuard;
  return buildProductPromptShareReturnGuard(
    cleanupGuard,
    markExternalAppOpened,
    reloadOnce
  );
}

function createProductPromptShareReturnState(): ProductPromptShareReturnState {
  return {
    hasExternalAppSignal: false,
    hasReloaded: false,
  };
}

function markProductPromptExternalAppOpened(
  state: ProductPromptShareReturnState,
  reloadOnce: () => void,
  returnUrl?: string
): void {
  state.hasExternalAppSignal = true;
  ensureProductPromptShareReturnSession(returnUrl);
  ensureProductPromptShareReturnFallback(state, reloadOnce);
}

function cleanupProductPromptShareReturnGuard(
  state: ProductPromptShareReturnState,
  listenerCleanup: () => void,
  cleanupGuard: () => void
): void {
  listenerCleanup();
  clearProductPromptShareReturnFallback(state);
  if (productPromptShareReturnReloadCleanup !== cleanupGuard) return;
  productPromptShareReturnReloadCleanup = null;
}

function buildProductPromptShareReturnGuard(
  cleanup: () => void,
  markExternalAppOpened: () => void,
  reloadOnce: () => void
): ProductPromptShareReturnGuard {
  return {
    cleanup,
    markExternalAppOpened,
    reloadAfterReturn: () =>
      reloadProductPromptAfterNativeShareReturn(markExternalAppOpened, reloadOnce),
  };
}

function reloadProductPromptAfterNativeShareReturn(
  markExternalAppOpened: () => void,
  reloadOnce: () => void
): void {
  markExternalAppOpened();
  reloadOnce();
}

function createInactiveProductPromptShareReturnGuard(): ProductPromptShareReturnGuard {
  return {
    cleanup: () => undefined,
    markExternalAppOpened: () => undefined,
    reloadAfterReturn: () => undefined,
  };
}

function reloadProductPromptShareReturnOnce(
  state: ProductPromptShareReturnState,
  cleanup: () => void
): void {
  if (!canReloadProductPromptShareReturn(state)) return;
  state.hasReloaded = true;
  cleanup();
  recoverProductPromptShareReturnState();
}

function canReloadProductPromptShareReturn(
  state: ProductPromptShareReturnState
): boolean {
  if (state.hasReloaded) return false;
  if (globalThis.document?.visibilityState === "hidden") return false;
  if (state.hasExternalAppSignal) return true;
  return globalThis.document?.hasFocus?.() !== false;
}

function ensureProductPromptShareReturnFallback(
  state: ProductPromptShareReturnState,
  reloadOnce: () => void
): void {
  if (state.fallbackTimeoutId) return;
  state.fallbackTimeoutId = globalThis.setTimeout(
    reloadOnce,
    PRODUCT_PROMPT_SHARE_RETURN_FALLBACK_MS
  );
}

function clearProductPromptShareReturnFallback(
  state: ProductPromptShareReturnState
): void {
  if (!state.fallbackTimeoutId) return;
  globalThis.clearTimeout(state.fallbackTimeoutId);
  state.fallbackTimeoutId = undefined;
}

function listenForProductPromptShareReturn(
  input: ProductPromptShareReturnListenerInput
): () => void {
  const listeners = createProductPromptShareReturnDomListeners(input);
  const timeoutId = globalThis.setTimeout(
    cleanup,
    PRODUCT_PROMPT_SHARE_RETURN_RELOAD_TIMEOUT_MS
  );

  function cleanup(): void {
    removeProductPromptShareReturnListeners(listeners);
    globalThis.clearTimeout(timeoutId);
  }

  addProductPromptShareReturnListeners(listeners);
  return cleanup;
}

function createProductPromptShareReturnDomListeners(
  input: ProductPromptShareReturnListenerInput
): ProductPromptShareReturnDomListeners {
  return {
    handleBlur: input.markExternalAppOpened,
    handlePageHide: input.markExternalAppOpened,
    handleVisibilityChange: () => handleProductPromptShareVisibilityChange(input),
    reloadOnce: input.reloadOnce,
  };
}

function handleProductPromptShareVisibilityChange(
  input: ProductPromptShareReturnListenerInput
): void {
  if (globalThis.document?.visibilityState === "hidden") {
    input.markExternalAppOpened();
    return;
  }
  input.reloadOnce();
}

function addProductPromptShareReturnListeners(
  listeners: ProductPromptShareReturnDomListeners
): void {
  globalThis.document?.addEventListener(
    "visibilitychange",
    listeners.handleVisibilityChange
  );
  globalThis.window.addEventListener("pagehide", listeners.handlePageHide);
  globalThis.window.addEventListener("blur", listeners.handleBlur);
  globalThis.window.addEventListener("pageshow", listeners.reloadOnce, {
    once: true,
  });
  globalThis.window.addEventListener("focus", listeners.reloadOnce, {
    once: true,
  });
}

function removeProductPromptShareReturnListeners(
  listeners: ProductPromptShareReturnDomListeners
): void {
  globalThis.document?.removeEventListener(
    "visibilitychange",
    listeners.handleVisibilityChange
  );
  globalThis.window.removeEventListener("pagehide", listeners.handlePageHide);
  globalThis.window.removeEventListener("blur", listeners.handleBlur);
  globalThis.window.removeEventListener("pageshow", listeners.reloadOnce);
  globalThis.window.removeEventListener("focus", listeners.reloadOnce);
}

function shouldReloadProductPromptAfterShareReturn(): boolean {
  return shouldUseProductPromptIosPwaShareFallback();
}

function shouldUseProductPromptIosPwaShareFallback(): boolean {
  return (
    typeof globalThis.window !== "undefined" &&
    typeof globalThis.navigator !== "undefined" &&
    isProductPromptAppleTouchBrowser() &&
    isProductPromptStandaloneApp()
  );
}

function recoverProductPromptShareReturnState(): void {
  const session = readProductPromptShareReturnSession();
  if (!session) return;
  resetProductPromptShareReturnInteractionLocks();
  if (!shouldReloadProductPromptAfterShareReturn()) {
    finishProductPromptShareReturnRecovery();
    return;
  }
  if (shouldFinishProductPromptShareReturnRecovery(session)) {
    finishProductPromptShareReturnRecovery();
    return;
  }
  writeProductPromptShareReturnSession({
    ...session,
    reloadAttempted: true,
  });
  hardReloadProductPromptPageAfterShareReturn(session);
}

function ensureProductPromptShareReturnSession(returnUrl?: string): void {
  if (readProductPromptShareReturnSession()) return;
  writeProductPromptShareReturnSession({
    reloadAttempted: false,
    returnUrl,
    startedAt: Date.now(),
  });
}

function shouldFinishProductPromptShareReturnRecovery(
  session: ProductPromptShareReturnSession
): boolean {
  const sessionAge = Date.now() - session.startedAt;
  return (
    session.reloadAttempted ||
    sessionAge < 0 ||
    sessionAge > PRODUCT_PROMPT_SHARE_RETURN_MAX_AGE_MS
  );
}

function finishProductPromptShareReturnRecovery(): void {
  clearProductPromptShareReturnSession();
  removeProductPromptShareReturnUrlParam();
  resetProductPromptShareReturnInteractionLocks();
}

function readProductPromptShareReturnSession(): ProductPromptShareReturnSession | null {
  try {
    const storedSession = globalThis.sessionStorage?.getItem(
      PRODUCT_PROMPT_SHARE_RETURN_STORAGE_KEY
    );
    if (!storedSession) return null;
    const parsedSession: unknown = JSON.parse(storedSession);
    return isProductPromptShareReturnSession(parsedSession)
      ? parsedSession
      : null;
  } catch {
    return null;
  }
}

function writeProductPromptShareReturnSession(
  session: ProductPromptShareReturnSession
): void {
  try {
    globalThis.sessionStorage?.setItem(
      PRODUCT_PROMPT_SHARE_RETURN_STORAGE_KEY,
      JSON.stringify(session)
    );
  } catch {
    // Session storage is a best-effort recovery marker for iOS PWA handoff bugs.
  }
}

function clearProductPromptShareReturnSession(): void {
  try {
    globalThis.sessionStorage?.removeItem(PRODUCT_PROMPT_SHARE_RETURN_STORAGE_KEY);
  } catch {
    // Nothing else can be done if storage is unavailable during recovery.
  }
}

function isProductPromptShareReturnSession(
  value: unknown
): value is ProductPromptShareReturnSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<ProductPromptShareReturnSession>;
  return (
    typeof session.reloadAttempted === "boolean" &&
    isOptionalProductPromptShareReturnUrl(session.returnUrl) &&
    typeof session.startedAt === "number"
  );
}

function isOptionalProductPromptShareReturnUrl(value: unknown): boolean {
  return typeof value === "undefined" || typeof value === "string";
}

function resetProductPromptShareReturnInteractionLocks(): void {
  if (typeof globalThis.document === "undefined") return;
  resetProductPromptShareReturnElementLocks(globalThis.document.documentElement);
  resetProductPromptShareReturnElementLocks(globalThis.document.body);
  removeStaleProductPromptShareReturnOverlays();
}

function resetProductPromptShareReturnElementLocks(
  element: HTMLElement | null
): void {
  if (!element) return;
  element.style.pointerEvents = "";
  element.style.overflow = "";
  element.style.touchAction = "";
  element.style.position = "";
  element.style.top = "";
  element.style.width = "";
  element.removeAttribute("data-scroll-locked");
}

function removeStaleProductPromptShareReturnOverlays(): void {
  const overlaySelector = [
    "[data-slot='drawer-overlay']",
    "[data-slot='dialog-overlay']",
    "[data-vaul-drawer-overlay]",
    "[data-radix-dialog-overlay]",
  ].join(",");
  globalThis.document
    ?.querySelectorAll(overlaySelector)
    .forEach((overlay) => overlay.remove());
}

function hardReloadProductPromptPageAfterShareReturn(
  session: ProductPromptShareReturnSession
): void {
  const reloadUrl = buildProductPromptShareReturnReloadUrl(session);
  const recoveryWindow = globalThis.window as ProductPromptShareRecoveryWindow;
  if (typeof recoveryWindow.__stockShiftProductPromptHardReload === "function") {
    recoveryWindow.__stockShiftProductPromptHardReload(reloadUrl);
    return;
  }
  globalThis.window.location.replace(reloadUrl);
}

function buildProductPromptShareReturnReloadUrl(
  session: ProductPromptShareReturnSession
): string {
  const reloadUrl = new URL(
    session.returnUrl ?? globalThis.window.location.href,
    globalThis.window.location.href
  );
  reloadUrl.searchParams.set(
    PRODUCT_PROMPT_SHARE_RETURN_URL_PARAM,
    String(Date.now())
  );
  return reloadUrl.toString();
}

function removeProductPromptShareReturnUrlParam(): void {
  const currentUrl = new URL(globalThis.window.location.href);
  if (!currentUrl.searchParams.has(PRODUCT_PROMPT_SHARE_RETURN_URL_PARAM)) return;
  currentUrl.searchParams.delete(PRODUCT_PROMPT_SHARE_RETURN_URL_PARAM);
  globalThis.window.history.replaceState(
    globalThis.window.history.state,
    "",
    currentUrl.toString()
  );
}

function isProductPromptAppleTouchBrowser(): boolean {
  const platform = globalThis.navigator.platform ?? "";
  const userAgent = globalThis.navigator.userAgent ?? "";
  const isModernIpad = platform === "MacIntel" && globalThis.navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/.test(userAgent) || isModernIpad;
}

function isProductPromptStandaloneApp(): boolean {
  const navigatorWithStandalone = globalThis.navigator as Navigator & {
    standalone?: boolean;
  };
  return (
    navigatorWithStandalone.standalone === true ||
    globalThis.window.matchMedia?.("(display-mode: standalone)").matches === true
  );
}

async function convertProductPromptImageBlobToJpeg(
  imageBlob: Blob,
  filePrefix: string
): Promise<File> {
  try {
    const convertedBlob = await drawProductPromptImageBlobToJpeg(imageBlob);
    return buildProductPromptImageFile(convertedBlob, filePrefix, "image/jpeg");
  } catch {
    return buildProductPromptImageFile(imageBlob, filePrefix, imageBlob.type || "image/png");
  }
}

async function composeProductPromptImageWithLogo(
  productImageBlob: Blob,
  companyLogoBlob: Blob
): Promise<Blob | null> {
  const objectUrls: string[] = [];
  const loadedImages: ProductPromptDrawableImage[] = [];
  try {
    const productImage = await loadProductPromptDrawableImage(
      productImageBlob,
      objectUrls
    );
    loadedImages.push(productImage);
    const logoImage = await loadProductPromptOptionalDrawableImage(
      companyLogoBlob,
      objectUrls,
      loadedImages
    );
    const canvas = drawProductPromptImageWithLogoToCanvas(productImage, logoImage);
    return await exportProductPromptCanvasJpeg(canvas);
  } catch {
    return null;
  } finally {
    loadedImages.forEach(closeProductPromptDrawableImage);
    objectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
  }
}

async function drawProductPromptImageBlobToJpeg(imageBlob: Blob): Promise<Blob> {
  const objectUrl = URL.createObjectURL(imageBlob);
  try {
    const imageElement = await loadProductPromptImageElement(objectUrl);
    const canvas = drawProductPromptImageToCanvas(imageElement);
    return await exportProductPromptCanvasJpeg(canvas);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function loadProductPromptDrawableImage(
  imageBlob: Blob,
  objectUrls: string[]
): Promise<ProductPromptDrawableImage> {
  if (typeof globalThis.createImageBitmap === "function") {
    try {
      return await globalThis.createImageBitmap(imageBlob);
    } catch {
      // Fallback for browsers that expose createImageBitmap but reject this blob.
    }
  }
  const objectUrl = URL.createObjectURL(imageBlob);
  objectUrls.push(objectUrl);
  return loadProductPromptImageElement(objectUrl);
}

async function loadProductPromptOptionalDrawableImage(
  imageBlob: Blob,
  objectUrls: string[],
  loadedImages: ProductPromptDrawableImage[]
): Promise<ProductPromptDrawableImage | null> {
  try {
    const image = await loadProductPromptDrawableImage(imageBlob, objectUrls);
    loadedImages.push(image);
    return image;
  } catch {
    return null;
  }
}

function closeProductPromptDrawableImage(image: ProductPromptDrawableImage): void {
  if ("close" in image && typeof image.close === "function") {
    image.close();
  }
}

function loadProductPromptImageElement(objectUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imageElement = new Image();
    imageElement.onload = () => resolve(imageElement);
    imageElement.onerror = () => reject(new Error("Unable to load share image."));
    imageElement.src = objectUrl;
  });
}

function drawProductPromptImageWithLogoToCanvas(
  productImage: ProductPromptDrawableImage,
  logoImage: ProductPromptDrawableImage | null
): HTMLCanvasElement {
  const productWidth = getProductPromptImageWidth(productImage);
  const productHeight = getProductPromptImageHeight(productImage);
  const productPlacement = calculateProductPromptCanvasImageSize(
    productWidth,
    productHeight
  );
  const headerHeight = calculateProductPromptBrandHeaderHeight(
    productPlacement.width
  );
  const canvas = document.createElement("canvas");
  canvas.width = productPlacement.width;
  canvas.height = headerHeight + productPlacement.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context unavailable.");
  context.save();
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#000000";
  context.fillRect(0, 0, canvas.width, headerHeight);
  if (logoImage) {
    drawProductPromptLogoInHeader(context, logoImage, canvas.width, headerHeight);
  }
  context.drawImage(
    productImage,
    0,
    headerHeight,
    productPlacement.width,
    productPlacement.height
  );
  context.restore();
  return canvas;
}

function drawProductPromptLogoInHeader(
  context: CanvasRenderingContext2D,
  logoImage: ProductPromptDrawableImage,
  canvasWidth: number,
  headerHeight: number
): void {
  try {
    const logoPlacement = calculateProductPromptHeaderLogoPlacement(
      canvasWidth,
      headerHeight,
      getProductPromptImageWidth(logoImage),
      getProductPromptImageHeight(logoImage)
    );
    context.drawImage(
      logoImage,
      logoPlacement.x,
      logoPlacement.y,
      logoPlacement.width,
      logoPlacement.height
    );
  } catch {
    // Keep the brand header even if the logo metadata is unusable.
  }
}

function drawProductPromptImageToCanvas(
  imageElement: ProductPromptDrawableImage
): HTMLCanvasElement {
  const imageSize = calculateProductPromptCanvasImageSize(
    getProductPromptImageWidth(imageElement),
    getProductPromptImageHeight(imageElement)
  );
  const canvas = document.createElement("canvas");
  canvas.width = imageSize.width;
  canvas.height = imageSize.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context unavailable.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(imageElement, 0, 0, imageSize.width, imageSize.height);
  return canvas;
}

function calculateProductPromptCanvasImageSize(width: number, height: number) {
  if (width <= 0 || height <= 0) throw new Error("Invalid image dimensions.");
  const scale = Math.min(
    1,
    PRODUCT_PROMPT_CANVAS_MAX_LONG_EDGE / Math.max(width, height)
  );
  return {
    height: Math.max(1, Math.round(height * scale)),
    width: Math.max(1, Math.round(width * scale)),
  };
}

function calculateProductPromptBrandHeaderHeight(canvasWidth: number): number {
  if (canvasWidth <= 0) throw new Error("Invalid image dimensions.");
  return Math.max(96, Math.round(canvasWidth * 0.36));
}

function calculateProductPromptHeaderLogoPlacement(
  canvasWidth: number,
  headerHeight: number,
  logoWidth: number,
  logoHeight: number
) {
  if (canvasWidth <= 0 || headerHeight <= 0 || logoWidth <= 0 || logoHeight <= 0) {
    throw new Error("Invalid image dimensions.");
  }
  const maxLogoWidth = Math.max(1, Math.round(canvasWidth * 0.48));
  const maxLogoHeight = Math.max(1, Math.round(headerHeight * 0.72));
  const logoScale = Math.min(maxLogoWidth / logoWidth, maxLogoHeight / logoHeight);
  const drawnLogoWidth = Math.max(1, Math.round(logoWidth * logoScale));
  const drawnLogoHeight = Math.max(1, Math.round(logoHeight * logoScale));
  return {
    height: drawnLogoHeight,
    width: drawnLogoWidth,
    x: Math.round((canvasWidth - drawnLogoWidth) / 2),
    y: Math.round((headerHeight - drawnLogoHeight) / 2),
  };
}

function getProductPromptImageWidth(imageElement: ProductPromptDrawableImage): number {
  if ("naturalWidth" in imageElement) {
    return imageElement.naturalWidth || imageElement.width;
  }
  return imageElement.width;
}

function getProductPromptImageHeight(imageElement: ProductPromptDrawableImage): number {
  if ("naturalHeight" in imageElement) {
    return imageElement.naturalHeight || imageElement.height;
  }
  return imageElement.height;
}

function exportProductPromptCanvasJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas JPEG export failed."));
        return;
      }
      resolve(blob);
    }, "image/jpeg", PRODUCT_PROMPT_CANVAS_JPEG_QUALITY);
  });
}

function buildProductPromptImageFileName(filePrefix: string, imageType: string): string {
  const extension = getProductPromptImageExtension(imageType);
  return `${filePrefix}.${extension}`;
}

function getProductPromptImageExtension(imageType: string): string {
  if (imageType === "image/jpeg" || imageType === "image/jpg") return "jpg";
  if (imageType === "image/webp") return "webp";
  return "png";
}

function getProductPromptShareFailure(
  error: unknown
): ProductPromptAssetShareResult {
  if (isProductPromptShareCancelled(error)) return "cancelled";
  return "share-failed";
}

function isProductPromptShareCancelled(error: unknown): boolean {
  if (typeof DOMException === "undefined") return false;
  if (!(error instanceof DOMException)) return false;
  return error.name === "AbortError";
}
