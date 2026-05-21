import { useCallback, useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { useBreadcrumb } from "@/components/breadcrumb";
import { api } from "@/lib/api";
import {
  productPromptCreateSchema,
  productPromptGenerateSchema,
  type ProductPromptCreateFormData,
  type ProductPromptGenerateFormData,
} from "./product-prompts.schema";
import {
  copyProductPromptText,
  installProductPromptShareReturnRecovery,
  shareProductPromptAssets,
} from "./product-prompts.clipboard";
import {
  buildProductPromptChatGptMessage,
  PRODUCT_PROMPT_DEFAULT_POSITION,
} from "./product-prompts.pricing";
import type { ProductBatch } from "../products-detail.types";
import type {
  ProductPromptAssetShareInput,
  ProductPromptAssetShareResult,
  ProductPromptBatchesResponse,
  ProductPromptBrowserActions,
  ProductPromptCompanyResponse,
  ProductPromptListResponse,
  ProductPromptMutationResponse,
  ProductPromptPricePosition,
  ProductPromptProductResponse,
  ProductPromptTextCopyInput,
  ProductPromptTextCopyResult,
  SavedProductImagePrompt,
} from "./product-prompts.types";

export {
  copyProductPromptText,
  installProductPromptShareReturnRecovery,
  shareProductPromptAssets,
} from "./product-prompts.clipboard";

export {
  buildProductPromptChatGptMessage,
  buildProductPromptPriceInstruction,
  buildProductPromptPricePreview,
  calculateProductPromptCashPriceCents,
  calculateProductPromptInstallmentBaseCents,
  calculateProductPromptInstallmentCents,
  formatProductPromptBrl,
  getProductPromptLogoPositionLabel,
  getProductPromptPositionLabel,
  PRODUCT_PROMPT_POSITION_OPTIONS,
} from "./product-prompts.pricing";

const PRODUCT_PROMPTS_KEY = "product-prompts";

export const browserProductPromptActions: ProductPromptBrowserActions = {
  copyPromptText: (input: ProductPromptTextCopyInput) =>
    copyProductPromptText(input),
  sharePromptAssets: (input: ProductPromptAssetShareInput) =>
    shareProductPromptAssets(input),
};

export function useProductPromptsModel(productId: string) {
  const [isCreatePromptOpen, setIsCreatePromptOpen] = useState(false);

  const productRequest = useProductPromptProductRequest(productId);
  const promptsRequest = useProductPromptListRequest();

  useProductPromptsBreadcrumb(productId);

  const createPromptForm = useProductPromptCreateForm();
  const createPromptImageFile = createPromptForm.watch("imageFile");

  useProductPromptShareReturnRecovery();

  const closeCreatePromptForm = useCallback(() => {
    setIsCreatePromptOpen(false);
    createPromptForm.reset();
  }, [createPromptForm]);

  return {
    product: productRequest.product,
    prompts: promptsRequest.prompts,
    isLoading: productRequest.isLoading || promptsRequest.isLoading,
    error: productRequest.error ?? promptsRequest.error,
    isCreatePromptOpen,
    createPromptForm,
    createPromptImageFile,
    openCreatePromptForm: () => setIsCreatePromptOpen(true),
    closeCreatePromptForm,
    setCreatePromptImageFile: (file: File | null) => {
      if (!file) {
        createPromptForm.resetField("imageFile");
        return;
      }
      createPromptForm.setValue("imageFile", file, { shouldDirty: true, shouldValidate: true });
    },
    submitCreatePrompt: createSubmitPromptHandler({
      closeCreatePromptForm,
    }),
  };
}

export function useProductPromptCompanyRequest() {
  const { data } = useSWR<ProductPromptCompanyResponse>(
    "product-prompts/company-assets",
    async (url: string) => api.get(url).json<ProductPromptCompanyResponse>()
  );

  return { logoUrl: data?.data.logoUrl ?? null };
}

export function useProductPromptProductRequest(productId: string) {
  const { data, error, isLoading } = useSWR<ProductPromptProductResponse>(
    productId ? `products/${productId}` : null,
    async (url: string) => api.get(url).json<ProductPromptProductResponse>()
  );

  return {
    product: data?.data ?? null,
    error: (error as Error | undefined) ?? null,
    isLoading,
  };
}

export function useProductPromptListRequest() {
  const { data, error, isLoading } = useSWR<ProductPromptListResponse>(
    PRODUCT_PROMPTS_KEY,
    async (url: string) => api.get(url).json<ProductPromptListResponse>()
  );

  return {
    prompts: data?.data ?? [],
    error: (error as Error | undefined) ?? null,
    isLoading,
  };
}

export function useProductPromptBatchesRequest(
  productId: string,
  warehouseId: string | null
) {
  const batchKey =
    productId && warehouseId
      ? `batches/warehouses/${warehouseId}/products/${productId}/batches`
      : null;
  const { data } = useSWR<ProductPromptBatchesResponse>(
    batchKey,
    async (url: string) => api.get(url).json<ProductPromptBatchesResponse>()
  );

  return { batches: data?.data ?? [] };
}

function useProductPromptsBreadcrumb(productId: string): void {
  useBreadcrumb({
    title: "Artes com IA",
    backUrl: `/products/${productId}`,
  });
}

function useProductPromptCreateForm() {
  return useForm<ProductPromptCreateFormData>({
    resolver: zodResolver(productPromptCreateSchema),
    defaultValues: {
      name: "",
      prompt: "",
    },
  });
}

export function useProductPromptGenerateForm(latestBatch: ProductBatch | null) {
  const latestBatchSellingPrice = latestBatch?.sellingPrice ?? undefined;
  const form = useForm<ProductPromptGenerateFormData>({
    resolver: zodResolver(productPromptGenerateSchema),
    defaultValues: buildGeneratePromptDefaults(latestBatch),
  });

  useLatestBatchPromptPriceAutofill(form, latestBatchSellingPrice);
  return form;
}

function useLatestBatchPromptPriceAutofill(
  form: UseFormReturn<ProductPromptGenerateFormData>,
  latestBatchSellingPrice: number | undefined
): void {
  const appliedBatchPriceRef = useRef<number | undefined>(
    latestBatchSellingPrice
  );

  useEffect(() => {
    if (latestBatchSellingPrice === undefined) return;

    const currentPrice = form.getValues("normalPriceCents");
    const hasManualPrice =
      currentPrice !== undefined &&
      currentPrice !== appliedBatchPriceRef.current;
    if (hasManualPrice) return;

    form.setValue("normalPriceCents", latestBatchSellingPrice, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: true,
    });
    appliedBatchPriceRef.current = latestBatchSellingPrice;
  }, [form, latestBatchSellingPrice]);
}

function createSubmitPromptHandler(input: {
  closeCreatePromptForm: () => void;
}) {
  return async (data: ProductPromptCreateFormData): Promise<void> => {
    try {
      const formData = buildProductPromptCreateFormData(data);
      await api
        .post(PRODUCT_PROMPTS_KEY, { body: formData })
        .json<ProductPromptMutationResponse>();
      await mutate(PRODUCT_PROMPTS_KEY);
      toast.success("Prompt criado com sucesso.");
      input.closeCreatePromptForm();
    } catch {
      toast.error("Erro ao criar prompt. Verifique os dados.");
    }
  };
}

export function buildProductPromptCreateFormData(
  data: ProductPromptCreateFormData
): FormData {
  const formData = new FormData();
  const promptBlob = new Blob(
    [
      JSON.stringify({
        name: data.name.trim(),
        prompt: data.prompt.trim(),
      }),
    ],
    { type: "application/json" }
  );
  formData.append("prompt", promptBlob);
  formData.append("image", data.imageFile);
  return formData;
}

export function createGeneratePromptHandler(input: {
  browserActions: ProductPromptBrowserActions;
  companyLogoUrl: string | null;
  productImageUrl: string | null;
  selectedPrompt: SavedProductImagePrompt | null;
  setIsPreparingShareImage: (isPreparing: boolean) => void;
  shareReturnUrl?: string;
}) {
  return async (data: ProductPromptGenerateFormData): Promise<void> => {
    if (!input.selectedPrompt || !input.productImageUrl) {
      toast.error("Produto sem imagem. Adicione uma imagem antes de gerar.");
      return;
    }
    const promptText = buildProductPromptChatGptMessage({
      ...data,
      savedPrompt: input.selectedPrompt.prompt,
    });
    const copyResult = await copyProductPromptTextSafely(input.browserActions, {
      promptText,
    });
    const companyLogoUrl = await resolveProductPromptCompanyLogoUrl(
      input.companyLogoUrl
    );
    input.setIsPreparingShareImage(true);
    const shareResult = await shareProductPromptAssetsSafely(input.browserActions, {
      companyLogoUrl,
      productImageUrl: input.productImageUrl,
      returnUrl: input.shareReturnUrl,
    }).finally(() => {
      input.setIsPreparingShareImage(false);
    });
    notifyProductPromptGenerateResult(copyResult, shareResult);
  };
}

function useProductPromptShareReturnRecovery(): void {
  useEffect(() => installProductPromptShareReturnRecovery(), []);
}

async function resolveProductPromptCompanyLogoUrl(
  currentLogoUrl: string | null
): Promise<string | null> {
  if (currentLogoUrl) return currentLogoUrl;
  try {
    const response = await api.get("product-prompts/company-assets").json<ProductPromptCompanyResponse>();
    return response.data.logoUrl ?? null;
  } catch {
    return null;
  }
}

async function copyProductPromptTextSafely(browserActions: ProductPromptBrowserActions, input: ProductPromptTextCopyInput): Promise<ProductPromptTextCopyResult> {
  try {
    return await browserActions.copyPromptText(input);
  } catch {
    return "copy-failed";
  }
}

async function shareProductPromptAssetsSafely(browserActions: ProductPromptBrowserActions, input: ProductPromptAssetShareInput): Promise<ProductPromptAssetShareResult> {
  try {
    return await browserActions.sharePromptAssets(input);
  } catch {
    return "share-failed";
  }
}

function notifyProductPromptGenerateResult(
  copyResult: ProductPromptTextCopyResult, shareResult: ProductPromptAssetShareResult
): void {
  if (shareResult === "shared") {
    notifyProductPromptShared(copyResult);
    return;
  }
  if (shareResult === "cancelled") {
    notifyProductPromptCopyOnly(copyResult);
    return;
  }
  notifyProductPromptGenerateFailure(copyResult, shareResult);
}

function notifyProductPromptShared(
  copyResult: ProductPromptTextCopyResult
): void {
  if (copyResult === "text") {
    toast.success("Imagem do produto enviada para compartilhamento. Prompt copiado.");
    return;
  }
  toast.info("Imagem do produto enviada. Copie o prompt manualmente.");
}

function notifyProductPromptCopyOnly(copyResult: ProductPromptTextCopyResult): void {
  if (copyResult === "text") {
    toast.success("Prompt copiado.");
    return;
  }
  if (copyResult === "unsupported") {
    toast.info("Compartilhamento cancelado. Copie o prompt manualmente.");
    return;
  }
  toast.error("Compartilhamento cancelado e o prompt não foi copiado.");
}

function notifyProductPromptGenerateFailure(
  copyResult: ProductPromptTextCopyResult, shareResult: ProductPromptAssetShareResult
): void {
  if (shareResult === "unsupported") {
    notifyProductPromptUnsupportedShare(copyResult);
    return;
  }
  if (shareResult === "ios-pwa-file-share-blocked") {
    notifyProductPromptIosPwaFileShareBlocked(copyResult);
    return;
  }
  if (shareResult === "product-image-failed") {
    toast.error(
      copyResult === "text"
        ? "Prompt copiado, mas a imagem do produto não pôde ser preparada."
        : "Não foi possível preparar a imagem do produto para compartilhar."
    );
    return;
  }
  if (shareResult === "brand-image-failed") {
    toast.error(
      copyResult === "text"
        ? "Prompt copiado, mas a imagem com a logo não pôde ser preparada."
        : "Não foi possível preparar a imagem com a logo."
    );
    return;
  }
  notifyProductPromptShareFailure(copyResult);
}

function notifyProductPromptIosPwaFileShareBlocked(
  copyResult: ProductPromptTextCopyResult
): void {
  if (copyResult === "text") {
    toast.info(
      "Prompt copiado. No PWA do iOS, envie a imagem manualmente para evitar travamento."
    );
    return;
  }
  toast.error(
    "No PWA do iOS, o envio automático da imagem foi bloqueado para evitar travamento."
  );
}

function notifyProductPromptUnsupportedShare(
  copyResult: ProductPromptTextCopyResult
): void {
  if (copyResult === "text") {
    toast.error("Prompt copiado, mas este navegador não permite compartilhar imagens.");
    return;
  }
  toast.error("Este navegador não permite compartilhar imagens automaticamente.");
}

function notifyProductPromptShareFailure(copyResult: ProductPromptTextCopyResult): void {
  if (copyResult === "text") {
    toast.error("Prompt copiado, mas o compartilhamento de imagens falhou.");
    return;
  }
  toast.error("Não foi possível abrir o compartilhamento de imagens.");
}

export function buildGeneratePromptDefaults(
  latestBatch: ProductBatch | null
): Partial<ProductPromptGenerateFormData> & {
  pricePosition: ProductPromptPricePosition;
} {
  return {
    normalPriceCents: latestBatch?.sellingPrice ?? undefined,
    showCashOffer: false,
    cashOfferMode: "final-price",
    cashPriceCents: undefined,
    cashDiscountPercent: undefined,
    showInstallments: false,
    installments: undefined,
    installmentBase: "normal-price",
    installmentPriceCents: undefined,
    pricePosition: PRODUCT_PROMPT_DEFAULT_POSITION,
  };
}

export function findLatestProductPromptBatch(
  batches: ProductBatch[]
): ProductBatch | null {
  if (batches.length === 0) return null;
  return batches.toSorted((firstBatch, secondBatch) => {
    return getProductPromptBatchTime(secondBatch) - getProductPromptBatchTime(firstBatch);
  })[0];
}

export function findSavedProductPromptById(
  prompts: SavedProductImagePrompt[],
  promptId: string
): SavedProductImagePrompt | null {
  return prompts.find((prompt) => prompt.id === promptId) ?? null;
}

function getProductPromptBatchTime(batch: ProductBatch): number {
  const parsedTime = Date.parse(batch.createdAt);
  return Number.isFinite(parsedTime) ? parsedTime : 0;
}
