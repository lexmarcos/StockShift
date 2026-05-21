"use client";

import { useParams } from "next/navigation";
import { useProductPromptGeneratePageModel } from "./product-prompt-generate.model";
import { ProductPromptGenerateView } from "./product-prompt-generate.view";

export function PageClient() {
  const params = useParams();
  const productId = params.id as string;
  const promptId = params.promptId as string;
  const model = useProductPromptGeneratePageModel(productId, promptId);

  return <ProductPromptGenerateView {...model} />;
}
