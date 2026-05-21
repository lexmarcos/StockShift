import type {
  ProductPromptGenerationInput,
  ProductPromptPositionOption,
  ProductPromptPriceConfigInput,
  ProductPromptPricePosition,
} from "./product-prompts.types";

export const PRODUCT_PROMPT_DEFAULT_POSITION: ProductPromptPricePosition =
  "top-center";

export const PRODUCT_PROMPT_POSITION_OPTIONS: ProductPromptPositionOption[] = [
  { value: "top-left", label: "Sup. esq." },
  { value: "top-center", label: "Sup. centro" },
  { value: "top-right", label: "Sup. dir." },
  { value: "middle-left", label: "Centro esq." },
  { value: "middle-center", label: "Centro" },
  { value: "middle-right", label: "Centro dir." },
  { value: "bottom-left", label: "Inf. esq." },
  { value: "bottom-center", label: "Inf. centro" },
  { value: "bottom-right", label: "Inf. dir." },
];

const PRODUCT_PROMPT_CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const PRODUCT_PROMPT_LOGO_POSITION_BY_PRICE_POSITION: Record<
  ProductPromptPricePosition,
  string
> = {
  "top-left": "superior direito",
  "top-center": "inferior centro",
  "top-right": "superior esquerdo",
  "middle-left": "superior direito",
  "middle-center": "superior centro",
  "middle-right": "superior esquerdo",
  "bottom-left": "superior direito",
  "bottom-center": "superior centro",
  "bottom-right": "superior esquerdo",
};

export function formatProductPromptBrl(valueCents: number): string {
  return PRODUCT_PROMPT_CURRENCY_FORMATTER.format(valueCents / 100);
}

export function calculateProductPromptCashPriceCents(
  input: ProductPromptPriceConfigInput
): number | null {
  if (!input.showCashOffer) return null;
  if (!hasPositiveCents(input.normalPriceCents)) return null;
  if (input.cashOfferMode === "final-price") {
    return hasPositiveCents(input.cashPriceCents) ? input.cashPriceCents : null;
  }
  if (!hasDefinedNumber(input.cashDiscountPercent)) return null;
  const discountMultiplier = (100 - input.cashDiscountPercent) / 100;
  return Math.round(input.normalPriceCents * discountMultiplier);
}

export function calculateProductPromptInstallmentBaseCents(
  input: ProductPromptPriceConfigInput
): number | null {
  if (!input.showInstallments) return null;
  if (input.installmentBase === "cash-price") {
    return calculateProductPromptCashPriceCents(input);
  }
  if (input.installmentBase === "custom-price") {
    return hasPositiveCents(input.installmentPriceCents)
      ? input.installmentPriceCents
      : null;
  }
  return hasPositiveCents(input.normalPriceCents) ? input.normalPriceCents : null;
}

export function calculateProductPromptInstallmentCents(
  input: ProductPromptPriceConfigInput
): number | null {
  if (!input.showInstallments || !input.installments || input.installments <= 1) {
    return null;
  }
  const installmentBaseCents = calculateProductPromptInstallmentBaseCents(input);
  if (installmentBaseCents === null) return null;
  return Math.round(installmentBaseCents / input.installments);
}

export function buildProductPromptPricePreview(
  input: ProductPromptPriceConfigInput
): string {
  if (!hasPositiveCents(input.normalPriceCents)) return "";
  const cashPriceCents = calculateProductPromptCashPriceCents(input);
  const priceLines =
    cashPriceCents === null
      ? [`Por: ${formatProductPromptBrl(input.normalPriceCents)}`]
      : [
          `De: ${formatProductPromptBrl(input.normalPriceCents)}`,
          `Por: ${formatProductPromptBrl(cashPriceCents)} à vista`,
        ];
  const installmentCents = calculateProductPromptInstallmentCents(input);
  if (installmentCents === null || !input.installments) {
    return priceLines.join("\n");
  }
  return [
    ...priceLines,
    `Ou em ${input.installments}x de ${formatProductPromptBrl(
      installmentCents
    )} sem juros`,
  ].join("\n");
}

export function buildProductPromptChatGptMessage(
  input: ProductPromptGenerationInput
): string {
  return [input.savedPrompt.trim(), buildProductPromptPriceInstruction(input)].join(
    "\n\n"
  );
}

export function buildProductPromptPriceInstruction(
  input: ProductPromptGenerationInput
): string {
  const pricePreview = buildProductPromptPricePreview(input);
  const pricePositionLabel = getProductPromptPositionLabel(input.pricePosition);
  const logoPositionLabel = getProductPromptLogoPositionLabel(input.pricePosition);
  return [
    "Use a imagem enviada como referência do produto e da marca.",
    "",
    "A parte superior da imagem contém uma área preta com a logo. Ignore o fundo preto e extraia apenas a logo, incluindo símbolo e texto. Reinsira essa logo na nova imagem de forma elegante, sem fundo, em uma área limpa da composição. Posicione a logo em: " +
      `${logoPositionLabel}. Escolha automaticamente uma cor com bom contraste em relação ao fundo.`,
    "",
    `Adicione na imagem um bloco de preço estilizado na posição: ${pricePositionLabel}.`,
    "",
    pricePreview,
    "",
    "Use hierarquia visual:",
    "- “De” menor e secundário.",
    "- “Por” maior e mais chamativo.",
    "- Parcelamento em tamanho intermediário.",
    "- Garanta bom contraste com o fundo.",
    "- Não cubra o produto principal nem a logo.",
    "",
    "Não reproduza a faixa preta original. Não distorça a logo. Não adicione textos extras. A imagem final deve parecer um anúncio premium profissional.",
    "",
    "proporção 9:16",
    "",
    "Use uma fonte serifada bold para o preço",
  ].join("\n");
}

export function getProductPromptPositionLabel(
  position: ProductPromptPricePosition
): string {
  const option = PRODUCT_PROMPT_POSITION_OPTIONS.find((item) => item.value === position);
  if (!option) {
    throw new Error(`Invalid position "${position}". Expected price position option.`);
  }
  return option.label;
}

export function getProductPromptLogoPositionLabel(
  pricePosition: ProductPromptPricePosition
): string {
  return PRODUCT_PROMPT_LOGO_POSITION_BY_PRICE_POSITION[pricePosition];
}

function hasDefinedNumber(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function hasPositiveCents(value: number | undefined): value is number {
  return hasDefinedNumber(value) && value > 0;
}
