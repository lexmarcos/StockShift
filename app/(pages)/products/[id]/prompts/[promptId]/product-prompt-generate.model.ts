"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useBreadcrumb } from "@/components/breadcrumb";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import {
  browserProductPromptActions,
  createGeneratePromptHandler,
  findLatestProductPromptBatch,
  findSavedProductPromptById,
  installProductPromptShareReturnRecovery,
  PRODUCT_PROMPT_POSITION_OPTIONS,
  useProductPromptBatchesRequest,
  useProductPromptCompanyRequest,
  useProductPromptGenerateForm,
  useProductPromptListRequest,
  useProductPromptProductRequest,
} from "../product-prompts.model";
import type { ProductBatch } from "../../products-detail.types";
import type {
  ProductPromptGenerateViewProps,
  SavedProductImagePrompt,
  UseProductPromptsModelDependencies,
} from "../product-prompts.types";

interface ProductPromptGenerateRequests {
  batches: ProductBatch[];
  companyLogoUrl: string | null;
  error: Error | null;
  isLoading: boolean;
  product: ProductPromptGenerateViewProps["product"];
  productImageUrl: string | null;
  prompts: SavedProductImagePrompt[];
}

export function useProductPromptGeneratePageModel(
  productId: string,
  promptId: string,
  dependencies: UseProductPromptsModelDependencies = {}
): ProductPromptGenerateViewProps {
  const browserActions = dependencies.browserActions ?? browserProductPromptActions;
  const [isPreparingShareImage, setIsPreparingShareImage] = useState(false);
  const requests = useProductPromptGenerateRequests(productId);
  const latestBatch = useLatestProductPromptBatch(requests.batches);
  const selectedPrompt = useSelectedProductPrompt(promptId, requests.prompts);
  const generatePromptForm = useProductPromptGenerateForm(latestBatch);
  const closeGeneratePromptPage = useCloseProductPromptGeneratePage(productId);

  useProductPromptGenerateBreadcrumb(productId);
  useProductPromptShareReturnRecovery();

  return {
    product: requests.product,
    selectedPrompt,
    isLoading: requests.isLoading,
    error: requests.error,
    isPreparingShareImage,
    pricePositionOptions: PRODUCT_PROMPT_POSITION_OPTIONS,
    generatePromptForm,
    closeGeneratePromptPage,
    submitGeneratePrompt: createGeneratePromptHandler({
      browserActions,
      companyLogoUrl: requests.companyLogoUrl,
      productImageUrl: requests.productImageUrl,
      selectedPrompt,
      setIsPreparingShareImage,
      shareReturnUrl: `/products/${productId}/prompts`,
    }),
  };
}

function useProductPromptGenerateRequests(
  productId: string
): ProductPromptGenerateRequests {
  const { warehouseId } = useSelectedWarehouse();
  const productRequest = useProductPromptProductRequest(productId);
  const companyRequest = useProductPromptCompanyRequest();
  const promptsRequest = useProductPromptListRequest();
  const batchesRequest = useProductPromptBatchesRequest(productId, warehouseId);

  return {
    product: productRequest.product,
    prompts: promptsRequest.prompts,
    batches: batchesRequest.batches,
    isLoading: productRequest.isLoading || promptsRequest.isLoading,
    error: productRequest.error ?? promptsRequest.error,
    companyLogoUrl: companyRequest.logoUrl,
    productImageUrl: productRequest.product?.imageUrl ?? null,
  };
}

function useLatestProductPromptBatch(batches: ProductBatch[]): ProductBatch | null {
  return useMemo(() => findLatestProductPromptBatch(batches), [batches]);
}

function useSelectedProductPrompt(
  promptId: string,
  prompts: SavedProductImagePrompt[]
): SavedProductImagePrompt | null {
  return useMemo(() => {
    return findSavedProductPromptById(prompts, promptId);
  }, [promptId, prompts]);
}

function useCloseProductPromptGeneratePage(productId: string): () => void {
  const router = useRouter();
  return useCallback((): void => {
    router.push(`/products/${productId}/prompts`);
  }, [productId, router]);
}

function useProductPromptGenerateBreadcrumb(productId: string): void {
  useBreadcrumb({
    title: "Gerar imagem",
    backUrl: `/products/${productId}/prompts`,
  });
}

function useProductPromptShareReturnRecovery(): void {
  useEffect(() => installProductPromptShareReturnRecovery(), []);
}
