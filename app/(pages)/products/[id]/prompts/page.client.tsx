"use client";

import { useParams } from "next/navigation";
import { useProductPromptsModel } from "./product-prompts.model";
import { ProductPromptsView } from "./product-prompts.view";

export function PageClient() {
  const params = useParams();
  const productId = params.id as string;
  const model = useProductPromptsModel(productId);

  return <ProductPromptsView {...model} />;
}
