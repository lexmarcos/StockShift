"use client";

import { CurrencyInput } from "@/components/ui/currency-input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { NumberInput } from "@/components/ui/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  calculateProductPromptCashPriceCents,
  calculateProductPromptInstallmentCents,
  formatProductPromptBrl,
} from "../product-prompts.pricing";
import type { ProductPromptGenerateViewProps } from "./product-prompt-generate.types";
import type {
  ProductPromptCashOfferMode,
  ProductPromptInstallmentBase,
} from "../product-prompts.types";
import { GeneratePromptBlockTitle } from "./product-prompt-generate-field-title.view";
import {
  GeneratePromptPositionField,
  GeneratePromptTextPreview,
} from "./product-prompt-generate-position-fields.view";

export function GeneratePromptPriceFields({
  props,
}: {
  props: ProductPromptGenerateViewProps;
}) {
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
  props: ProductPromptGenerateViewProps;
}) {
  return (
    <div className="space-y-3 border-b border-neutral-800 pb-5">
      <GeneratePromptBlockTitle title="Preço base" />
      <NormalPriceField props={props} />
    </div>
  );
}

function NormalPriceField({ props }: { props: ProductPromptGenerateViewProps }) {
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
  props: ProductPromptGenerateViewProps;
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

function CashOfferModeField({
  props,
}: {
  props: ProductPromptGenerateViewProps;
}) {
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

function CashPriceField({ props }: { props: ProductPromptGenerateViewProps }) {
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

function CashDiscountField({
  props,
}: {
  props: ProductPromptGenerateViewProps;
}) {
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
  props: ProductPromptGenerateViewProps;
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
            <InstallmentBaseField props={props} hasCashOffer={hasCashOffer} />
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

function InstallmentsField({
  props,
}: {
  props: ProductPromptGenerateViewProps;
}) {
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
  props: ProductPromptGenerateViewProps;
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

function InstallmentPriceField({
  props,
}: {
  props: ProductPromptGenerateViewProps;
}) {
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
  props: ProductPromptGenerateViewProps;
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
