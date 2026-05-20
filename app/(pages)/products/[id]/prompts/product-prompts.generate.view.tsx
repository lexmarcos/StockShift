"use client";

import Image from "next/image";
import { BadgePercent } from "lucide-react";
import type { ControllerRenderProps } from "react-hook-form";
import { CurrencyInput } from "@/components/ui/currency-input";
import { FormSection } from "@/components/ui/form-section";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { NumberInput } from "@/components/ui/number-input";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ProductPromptFormFooter } from "./product-prompts.form-footer";
import {
  buildProductPromptPricePreview,
  calculateProductPromptCashPriceCents,
  calculateProductPromptInstallmentCents,
  formatProductPromptBrl,
} from "./product-prompts.pricing";
import type { ProductPromptGenerateFormData } from "./product-prompts.schema";
import type {
  ProductPromptCashOfferMode,
  ProductPromptInstallmentBase,
  ProductPromptPositionOption,
  ProductPromptsViewProps,
  SavedProductImagePrompt,
} from "./product-prompts.types";

export function GenerateProductPromptModal({
  props,
}: {
  props: ProductPromptsViewProps;
}) {
  return (
    <ResponsiveModal
      open={!!props.selectedPrompt}
      onOpenChange={(open) => {
        if (!open) props.closeGeneratePromptForm();
      }}
      title="Gerar imagem"
      description="Configure preço, oferta, parcelamento e posição do bloco."
      maxWidth="sm:max-w-[820px]"
    >
      <Form {...props.generatePromptForm}>
        <form
          onSubmit={props.generatePromptForm.handleSubmit(props.submitGeneratePrompt)}
          className="space-y-5"
        >
          <SelectedPromptSummary prompt={props.selectedPrompt} />
          <FormSection icon={BadgePercent} title="Preço da arte">
            <GeneratePromptPriceFields props={props} />
          </FormSection>
          <ProductPromptFormFooter
            cancelLabel="Cancelar"
            submitLabel="Gerar imagem"
            isSubmitting={
              props.generatePromptForm.formState.isSubmitting ||
              props.isPreparingShareImage
            }
            loadingLabel={
              props.isPreparingShareImage ? "Preparando imagem" : "Gerando imagem"
            }
            onCancel={props.closeGeneratePromptForm}
          />
        </form>
      </Form>
    </ResponsiveModal>
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
      <div className="relative size-16 shrink-0 overflow-hidden rounded-[4px] bg-neutral-900">
        <Image
          src={prompt.imageUrl}
          alt={prompt.name}
          fill
          unoptimized
          className="object-cover"
        />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">
          Prompt selecionado
        </p>
        <p className="mt-1 truncate text-sm font-bold text-white">{prompt.name}</p>
        <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{prompt.prompt}</p>
      </div>
    </div>
  );
}

function GeneratePromptPriceFields({ props }: { props: ProductPromptsViewProps }) {
  return (
    <div className="space-y-6">
      <GeneratePromptBasePriceBlock props={props} />
      <GeneratePromptCashOfferBlock props={props} />
      <GeneratePromptInstallmentBlock props={props} />
      <GeneratePromptPositionField props={props} />
      <GeneratePromptTextPreview props={props} />
    </div>
  );
}

function GeneratePromptBasePriceBlock({
  props,
}: {
  props: ProductPromptsViewProps;
}) {
  return (
    <div className="space-y-3 border-b border-neutral-800 pb-5">
      <GeneratePromptBlockTitle title="Preço base" />
      <NormalPriceField props={props} />
    </div>
  );
}

function NormalPriceField({ props }: { props: ProductPromptsViewProps }) {
  return (
    <FormField
      control={props.generatePromptForm.control}
      name="normalPriceCents"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Preço normal
          </FormLabel>
          <FormControl>
            <CurrencyInput
              value={field.value}
              onValueChange={field.onChange}
              className="rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
            />
          </FormControl>
          <FormMessage className="text-xs text-rose-500" />
        </FormItem>
      )}
    />
  );
}

function GeneratePromptCashOfferBlock({
  props,
}: {
  props: ProductPromptsViewProps;
}) {
  const formValues = props.generatePromptForm.watch();
  const showCashOffer = formValues.showCashOffer;
  const cashOfferMode = formValues.cashOfferMode;
  const cashPriceCents = calculateProductPromptCashPriceCents(formValues);

  return (
    <div className="space-y-4 border-b border-neutral-800 pb-5">
      <GeneratePromptSwitchField
        props={props}
        name="showCashOffer"
        label="Mostrar preço à vista com desconto"
        onCheckedChange={(checked) => {
          const isCashBase =
            props.generatePromptForm.getValues("installmentBase") === "cash-price";
          if (!checked && isCashBase) {
            props.generatePromptForm.setValue("installmentBase", "normal-price", {
              shouldDirty: true,
              shouldValidate: true,
            });
          }
        }}
      />
      {showCashOffer && (
        <div className="space-y-4">
          <CashOfferModeField props={props} />
          {cashOfferMode === "final-price" ? (
            <CashPriceField props={props} />
          ) : (
            <CashDiscountField props={props} />
          )}
          <CalculatedPricePreview
            label="Preço à vista"
            valueCents={cashPriceCents}
          />
        </div>
      )}
    </div>
  );
}

function CashOfferModeField({ props }: { props: ProductPromptsViewProps }) {
  return (
    <FormField
      control={props.generatePromptForm.control}
      name="cashOfferMode"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Calcular oferta à vista por
          </FormLabel>
          <FormControl>
            <CashOfferModeControl value={field.value} onChange={field.onChange} />
          </FormControl>
          <FormMessage className="text-xs text-rose-500" />
        </FormItem>
      )}
    />
  );
}

function CashOfferModeControl({
  onChange,
  value,
}: {
  onChange: (value: ProductPromptCashOfferMode) => void;
  value: ProductPromptCashOfferMode;
}) {
  const options: Array<{ value: ProductPromptCashOfferMode; label: string }> = [
    { value: "final-price", label: "Preço final" },
    { value: "discount-percent", label: "Desconto %" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 rounded-[4px] border border-neutral-800 bg-neutral-950 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "h-10 rounded-[4px] px-3 text-xs font-bold text-neutral-400 hover:text-white",
            value === option.value ? "bg-blue-600 text-white" : "bg-transparent"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function CashPriceField({ props }: { props: ProductPromptsViewProps }) {
  return (
    <FormField
      control={props.generatePromptForm.control}
      name="cashPriceCents"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Preço à vista
          </FormLabel>
          <FormControl>
            <CurrencyInput
              value={field.value}
              onValueChange={field.onChange}
              className="rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
            />
          </FormControl>
          <FormMessage className="text-xs text-rose-500" />
        </FormItem>
      )}
    />
  );
}

function CashDiscountField({ props }: { props: ProductPromptsViewProps }) {
  return (
    <FormField
      control={props.generatePromptForm.control}
      name="cashDiscountPercent"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Desconto (%)
          </FormLabel>
          <FormControl>
            <NumberInput
              value={field.value}
              onValueChange={field.onChange}
              mode="float"
              placeholder="0"
              className="rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
            />
          </FormControl>
          <FormMessage className="text-xs text-rose-500" />
        </FormItem>
      )}
    />
  );
}

function GeneratePromptInstallmentBlock({
  props,
}: {
  props: ProductPromptsViewProps;
}) {
  const formValues = props.generatePromptForm.watch();
  const installmentCents = calculateProductPromptInstallmentCents(formValues);
  const hasCashOffer = calculateProductPromptCashPriceCents(formValues) !== null;

  return (
    <div className="space-y-4 border-b border-neutral-800 pb-5">
      <GeneratePromptSwitchField
        props={props}
        name="showInstallments"
        label="Mostrar parcelamento"
      />
      {formValues.showInstallments && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InstallmentsField props={props} />
            <InstallmentBaseField
              props={props}
              hasCashOffer={hasCashOffer}
            />
          </div>
          {formValues.installmentBase === "custom-price" && (
            <InstallmentPriceField props={props} />
          )}
          <CalculatedPricePreview
            label="Valor da parcela"
            valueCents={installmentCents}
          />
        </div>
      )}
    </div>
  );
}

function InstallmentsField({ props }: { props: ProductPromptsViewProps }) {
  return (
    <FormField
      control={props.generatePromptForm.control}
      name="installments"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Quantidade de parcelas
          </FormLabel>
          <FormControl>
            <NumberInput
              value={field.value}
              onValueChange={field.onChange}
              placeholder="Opcional"
              className="rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
            />
          </FormControl>
          <FormMessage className="text-xs text-rose-500" />
        </FormItem>
      )}
    />
  );
}

function InstallmentBaseField({
  hasCashOffer,
  props,
}: {
  hasCashOffer: boolean;
  props: ProductPromptsViewProps;
}) {
  return (
    <FormField
      control={props.generatePromptForm.control}
      name="installmentBase"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Base do parcelamento
          </FormLabel>
          <Select
            value={field.value}
            onValueChange={(value: ProductPromptInstallmentBase) =>
              field.onChange(value)
            }
          >
            <FormControl>
              <SelectTrigger className="h-10 w-full rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
              <SelectItem value="normal-price" className="text-xs">
                Preço normal
              </SelectItem>
              <SelectItem
                value="cash-price"
                disabled={!hasCashOffer}
                className="text-xs"
              >
                Preço à vista com desconto
              </SelectItem>
              <SelectItem value="custom-price" className="text-xs">
                Preço próprio para parcelamento
              </SelectItem>
            </SelectContent>
          </Select>
          <FormMessage className="text-xs text-rose-500" />
        </FormItem>
      )}
    />
  );
}

function InstallmentPriceField({ props }: { props: ProductPromptsViewProps }) {
  return (
    <FormField
      control={props.generatePromptForm.control}
      name="installmentPriceCents"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Preço parcelado
          </FormLabel>
          <FormControl>
            <CurrencyInput
              value={field.value}
              onValueChange={field.onChange}
              className="rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
            />
          </FormControl>
          <FormMessage className="text-xs text-rose-500" />
        </FormItem>
      )}
    />
  );
}

function GeneratePromptSwitchField({
  label,
  name,
  onCheckedChange,
  props,
}: {
  label: string;
  name: "showCashOffer" | "showInstallments";
  onCheckedChange?: (checked: boolean) => void;
  props: ProductPromptsViewProps;
}) {
  return (
    <FormField
      control={props.generatePromptForm.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center justify-between gap-4">
            <FormLabel className="text-xs font-bold text-white">{label}</FormLabel>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  onCheckedChange?.(checked);
                }}
                className="data-[state=checked]:bg-blue-600"
              />
            </FormControl>
          </div>
          <FormMessage className="text-xs text-rose-500" />
        </FormItem>
      )}
    />
  );
}

function CalculatedPricePreview({
  label,
  valueCents,
}: {
  label: string;
  valueCents: number | null;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[4px] border border-neutral-800 bg-neutral-950 px-3 py-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
        {label}
      </span>
      <span className="text-sm font-bold text-white">
        {valueCents === null ? "-" : formatProductPromptBrl(valueCents)}
      </span>
    </div>
  );
}

function GeneratePromptPositionField({ props }: { props: ProductPromptsViewProps }) {
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

function GeneratePromptTextPreview({ props }: { props: ProductPromptsViewProps }) {
  const previewText = buildProductPromptPricePreview(props.generatePromptForm.watch());

  return (
    <div className="space-y-3">
      <GeneratePromptBlockTitle title="Prévia do texto" />
      <pre className="min-h-24 whitespace-pre-wrap rounded-[4px] border border-neutral-800 bg-neutral-950 p-3 font-sans text-sm leading-relaxed text-white">
        {previewText || "Preencha o preço normal para visualizar."}
      </pre>
    </div>
  );
}

function GeneratePromptBlockTitle({ title }: { title: string }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
      {title}
    </p>
  );
}
