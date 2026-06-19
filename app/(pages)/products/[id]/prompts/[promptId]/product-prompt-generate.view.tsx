"use client";

import { RemoteImage } from "@/components/ui/remote-image";
import { ArrowLeft, BadgePercent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { FormSection } from "@/components/ui/form-section";
import { Form } from "@/components/ui/form";
import { LoadingState } from "@/components/ui/loading-state";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ProductPromptFormFooter } from "../product-prompts.form-footer";
import type { ProductPromptGenerateViewProps } from "./product-prompt-generate.types";
import type { SavedProductImagePrompt } from "../product-prompts.types";
import { GeneratePromptPriceFields } from "./product-prompt-generate-price-fields.view";

export function ProductPromptGenerateView(
  props: ProductPromptGenerateViewProps
) {
  if (props.isLoading) {
    return (
      <PageContainer>
        <LoadingState message="Carregando prompt..." />
      </PageContainer>
    );
  }

  if (props.error || !props.product || !props.selectedPrompt) {
    return (
      <PageContainer>
        <ErrorState
          title="Prompt não encontrado"
          description="Não foi possível carregar os dados para gerar esta arte."
        />
      </PageContainer>
    );
  }

  return <ProductPromptGenerateContent props={props} />;
}

function ProductPromptGenerateContent({
  props,
}: {
  props: ProductPromptGenerateViewProps;
}) {
  return (
    <PageContainer>
      <PageHeader
        title="Gerar imagem"
        subtitle={props.product?.name}
        actions={<ProductPromptGenerateBackButton props={props} />}
      />
      <div className="mx-auto max-w-3xl">
        <ProductPromptGenerateForm props={props} />
      </div>
    </PageContainer>
  );
}

function ProductPromptGenerateBackButton({
  props,
}: {
  props: ProductPromptGenerateViewProps;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={props.closeGeneratePromptPage}
      className="h-10 w-full rounded-[4px] border-neutral-800 bg-transparent text-xs font-bold uppercase tracking-wide text-neutral-300 hover:bg-neutral-900 md:w-auto"
    >
      <ArrowLeft className="mr-2 size-4" />
      Voltar
    </Button>
  );
}

function ProductPromptGenerateForm({
  props,
}: {
  props: ProductPromptGenerateViewProps;
}) {
  return (
    <Form {...props.generatePromptForm}>
      <form
        onSubmit={props.generatePromptForm.handleSubmit(props.submitGeneratePrompt)}
        className="space-y-5"
      >
        <SelectedPromptSummary prompt={props.selectedPrompt} />
        <FormSection icon={BadgePercent} title="Preço da arte">
          <GeneratePromptPriceFields props={props} />
        </FormSection>
        <ProductPromptGenerateFooter props={props} />
      </form>
    </Form>
  );
}

function ProductPromptGenerateFooter({
  props,
}: {
  props: ProductPromptGenerateViewProps;
}) {
  const isSubmitting =
    props.generatePromptForm.formState.isSubmitting || props.isPreparingShareImage;
  const loadingLabel = props.isPreparingShareImage
    ? "Preparando imagem"
    : "Gerando imagem";

  return (
    <ProductPromptFormFooter
      cancelLabel="Cancelar"
      submitLabel="Gerar imagem"
      isSubmitting={isSubmitting}
      loadingLabel={loadingLabel}
      onCancel={props.closeGeneratePromptPage}
    />
  );
}

function SelectedPromptSummary({
  prompt,
}: {
  prompt: SavedProductImagePrompt | null;
}) {
  if (!prompt) return null;

  return (
    <div className="flex gap-3 rounded-[4px] border border-neutral-800 bg-neutral-950/40 p-3">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-[4px] bg-neutral-900">
        <RemoteImage
          src={prompt.imageUrl}
          alt={prompt.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">
          Prompt selecionado
        </p>
        <p className="mt-1 truncate text-sm font-bold text-white">{prompt.name}</p>
        <p className="mt-1 line-clamp-3 text-xs text-neutral-500">
          {prompt.prompt}
        </p>
      </div>
    </div>
  );
}
