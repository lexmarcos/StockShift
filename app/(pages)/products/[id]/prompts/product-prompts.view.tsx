"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Image as ImageIcon,
  Plus,
  Sparkles,
} from "lucide-react";
import { ImageDropzone } from "@/components/product/image-dropzone";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FormSection } from "@/components/ui/form-section";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Textarea } from "@/components/ui/textarea";
import { ProductPromptFormFooter } from "./product-prompts.form-footer";
import type {
  ProductPromptsViewProps,
  SavedProductImagePrompt,
} from "./product-prompts.types";

export function ProductPromptsView(props: ProductPromptsViewProps) {
  if (props.isLoading) {
    return <PageContainer><LoadingState message="Carregando produto..." /></PageContainer>;
  }

  if (props.error || !props.product) {
    return (
      <PageContainer>
        <ErrorState
          title="Produto não encontrado"
          description="Não foi possível carregar os dados para gerar artes."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Artes com IA"
        subtitle={props.product.name}
        actions={<ProductPromptCreateButton onClick={props.openCreatePromptForm} />}
      />
      <ProductPromptImageWarning productImageUrl={props.product.imageUrl} />
      <ProductPromptGrid props={props} productId={props.product.id} />
      <CreateProductPromptModal props={props} />
    </PageContainer>
  );
}

function ProductPromptCreateButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      className="h-10 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 md:w-auto"
    >
      <Plus className="mr-2 size-4" />
      Criar prompt
    </Button>
  );
}

function ProductPromptImageWarning({ productImageUrl }: { productImageUrl: string | null }) {
  if (productImageUrl) return null;

  return (
    <div className="mb-6 rounded-[4px] border border-amber-900/40 bg-amber-950/10 p-4 text-xs text-amber-400">
      Este produto ainda não possui imagem. Adicione uma imagem ao produto antes
      de gerar a arte no ChatGPT.
    </div>
  );
}

function ProductPromptGrid({
  productId,
  props,
}: {
  productId: string;
  props: ProductPromptsViewProps;
}) {
  if (props.prompts.length === 0) {
    return (
      <EmptyState
        icon={ImageIcon}
        title="Nenhum prompt criado"
        description="Crie prompts com uma imagem de referência para montar a biblioteca de artes da empresa."
        action={{ label: "Criar prompt", onClick: props.openCreatePromptForm }}
        className="bg-[#171717]/30"
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {props.prompts.map((prompt) => (
        <ProductPromptCard
          key={prompt.id}
          prompt={prompt}
          productId={productId}
        />
      ))}
    </div>
  );
}

function ProductPromptCard({
  prompt,
  productId,
}: {
  prompt: SavedProductImagePrompt;
  productId: string;
}) {
  return (
    <Link
      href={`/products/${productId}/prompts/${prompt.id}`}
      className="group block overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717] text-left hover:border-blue-600"
    >
      <div className="relative aspect-[4/5] bg-neutral-950">
        <Image
          src={prompt.imageUrl}
          alt={prompt.name}
          fill
          unoptimized
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
          className="object-cover"
        />
      </div>
      <div className="border-t border-neutral-800 p-2.5 sm:p-4">
        <p className="line-clamp-2 text-sm font-bold leading-snug text-white sm:text-base">
          {prompt.name}
        </p>
        <p className="mt-2 hidden text-xs leading-relaxed text-neutral-500 sm:line-clamp-2">
          {prompt.prompt}
        </p>
      </div>
    </Link>
  );
}

function CreateProductPromptModal({ props }: { props: ProductPromptsViewProps }) {
  return (
    <ResponsiveModal
      open={props.isCreatePromptOpen}
      onOpenChange={(open) => {
        if (!open) props.closeCreatePromptForm();
      }}
      title="Criar prompt"
      description="Cadastre uma imagem de referência, nome e texto base."
      maxWidth="sm:max-w-[720px]"
    >
      <Form {...props.createPromptForm}>
        <form
          onSubmit={props.createPromptForm.handleSubmit(props.submitCreatePrompt)}
          className="space-y-5"
        >
          <FormSection icon={Sparkles} title="Prompt pré feito">
            <CreatePromptImageField props={props} />
            <CreatePromptNameField props={props} />
            <CreatePromptTextField props={props} />
          </FormSection>
          <ProductPromptFormFooter
            cancelLabel="Cancelar"
            submitLabel="Criar prompt"
            isSubmitting={props.createPromptForm.formState.isSubmitting}
            loadingLabel="Criando prompt"
            onCancel={props.closeCreatePromptForm}
          />
        </form>
      </Form>
    </ResponsiveModal>
  );
}

function CreatePromptImageField({ props }: { props: ProductPromptsViewProps }) {
  return (
    <FormField
      control={props.createPromptForm.control}
      name="imageFile"
      render={() => (
        <FormItem>
          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Imagem referente ao prompt
          </FormLabel>
          <ImageDropzone
            value={props.createPromptImageFile ?? null}
            onImageSelect={props.setCreatePromptImageFile}
            text="Adicionar imagem de referência"
          />
          <FormMessage className="text-xs text-rose-500" />
        </FormItem>
      )}
    />
  );
}

function CreatePromptNameField({ props }: { props: ProductPromptsViewProps }) {
  return (
    <FormField
      control={props.createPromptForm.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Nome do prompt
          </FormLabel>
          <FormControl>
            <Input
              {...field}
              placeholder="Ex: Oferta premium"
              className="rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
            />
          </FormControl>
          <FormMessage className="text-xs text-rose-500" />
        </FormItem>
      )}
    />
  );
}

function CreatePromptTextField({ props }: { props: ProductPromptsViewProps }) {
  return (
    <FormField
      control={props.createPromptForm.control}
      name="prompt"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Prompt
          </FormLabel>
          <FormControl>
            <Textarea
              {...field}
              placeholder="Descreva o estilo, cenário e composição da arte."
              className="min-h-32 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
            />
          </FormControl>
          <FormMessage className="text-xs text-rose-500" />
        </FormItem>
      )}
    />
  );
}
