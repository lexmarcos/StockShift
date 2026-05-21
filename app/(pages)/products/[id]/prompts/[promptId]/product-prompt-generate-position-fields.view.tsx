"use client";

import type { ControllerRenderProps } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { buildProductPromptPricePreview } from "../product-prompts.pricing";
import type { ProductPromptGenerateFormData } from "./product-prompt-generate.schema";
import type { ProductPromptGenerateViewProps } from "./product-prompt-generate.types";
import type { ProductPromptPositionOption } from "../product-prompts.types";
import { GeneratePromptBlockTitle } from "./product-prompt-generate-field-title.view";

export function GeneratePromptPositionField({
  props,
}: {
  props: ProductPromptGenerateViewProps;
}) {
  return (
    <div className="space-y-3 border-b border-neutral-800 pb-5">
      <GeneratePromptBlockTitle title="Posição do bloco de preço" />
      <FormField
        control={props.generatePromptForm.control}
        name="pricePosition"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Local onde deve aparecer o preço
            </FormLabel>
            <ProductPromptPositionGrid
              field={field}
              options={props.pricePositionOptions}
            />
            <FormMessage className="text-xs text-rose-500" />
          </FormItem>
        )}
      />
    </div>
  );
}

function ProductPromptPositionGrid({
  field,
  options,
}: {
  field: ControllerRenderProps<ProductPromptGenerateFormData, "pricePosition">;
  options: ProductPromptPositionOption[];
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => field.onChange(option.value)}
          className={cn(
            "h-14 rounded-[4px] border bg-neutral-900 px-2 text-xs font-bold text-neutral-300 hover:border-blue-600",
            field.value === option.value
              ? "border-blue-600 bg-blue-950/40 text-white"
              : "border-neutral-800"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function GeneratePromptTextPreview({
  props,
}: {
  props: ProductPromptGenerateViewProps;
}) {
  const previewText = buildProductPromptPricePreview(
    props.generatePromptForm.watch()
  );

  return (
    <div className="space-y-3">
      <GeneratePromptBlockTitle title="Prévia do texto" />
      <pre className="min-h-24 whitespace-pre-wrap rounded-[4px] border border-neutral-800 bg-neutral-950 p-3 font-sans text-sm leading-relaxed text-white">
        {previewText || "Preencha o preço normal para visualizar."}
      </pre>
    </div>
  );
}
