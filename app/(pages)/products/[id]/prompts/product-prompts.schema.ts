import { z } from "zod";

export const PRODUCT_PROMPT_PRICE_POSITION_VALUES = [
  "top-left",
  "top-center",
  "top-right",
  "middle-left",
  "middle-center",
  "middle-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
] as const;

export const PRODUCT_PROMPT_CASH_OFFER_MODE_VALUES = [
  "final-price",
  "discount-percent",
] as const;

export const PRODUCT_PROMPT_INSTALLMENT_BASE_VALUES = [
  "normal-price",
  "cash-price",
  "custom-price",
] as const;

const PRODUCT_PROMPT_ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

const PRODUCT_PROMPT_MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function isPromptImageFile(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

function hasAllowedProductPromptImageType(file: File): boolean {
  return PRODUCT_PROMPT_ALLOWED_IMAGE_TYPES.includes(file.type);
}

function hasAllowedProductPromptImageSize(file: File): boolean {
  return file.size <= PRODUCT_PROMPT_MAX_IMAGE_BYTES;
}

export const productPromptCreateSchema = z.object({
  imageFile: z
    .custom<File>(isPromptImageFile, {
      message: "Imagem referente ao prompt é obrigatória",
    })
    .refine(hasAllowedProductPromptImageType, "Use PNG, JPG, JPEG ou WEBP")
    .refine(hasAllowedProductPromptImageSize, "Imagem deve ter até 5MB"),
  name: z
    .string()
    .trim()
    .min(1, "Nome do prompt é obrigatório")
    .max(80, "Nome deve ter no máximo 80 caracteres"),
  prompt: z
    .string()
    .trim()
    .min(1, "Prompt é obrigatório")
    .max(4000, "Prompt deve ter no máximo 4000 caracteres"),
});

export const productPromptGenerateSchema = z.object({
  normalPriceCents: z
    .number({ message: "Preço normal é obrigatório" })
    .int("Preço normal deve estar em centavos")
    .min(1, "Preço normal deve ser maior que zero"),
  showCashOffer: z.boolean(),
  cashOfferMode: z.enum(PRODUCT_PROMPT_CASH_OFFER_MODE_VALUES, {
    message: "Escolha como calcular o preço à vista",
  }),
  cashPriceCents: z
    .number()
    .int("Preço à vista deve estar em centavos")
    .min(0, "Preço à vista não pode ser negativo")
    .optional(),
  cashDiscountPercent: z
    .number()
    .min(0, "Desconto não pode ser negativo")
    .max(100, "Desconto deve ser no máximo 100%")
    .optional(),
  showInstallments: z.boolean(),
  installments: z
    .number()
    .int("Parcelas devem conter somente números")
    .min(1, "Parcelas devem ser maior que zero")
    .max(60, "Parcelas devem ser no máximo 60")
    .optional(),
  installmentBase: z.enum(PRODUCT_PROMPT_INSTALLMENT_BASE_VALUES, {
    message: "Escolha a base do parcelamento",
  }),
  installmentPriceCents: z
    .number()
    .int("Preço parcelado deve estar em centavos")
    .min(0, "Preço parcelado não pode ser negativo")
    .optional(),
  pricePosition: z.enum(PRODUCT_PROMPT_PRICE_POSITION_VALUES, {
    message: "Escolha uma posição válida para o preço",
  }),
}).superRefine((data, context) => {
  if (data.showCashOffer && data.cashOfferMode === "final-price" && !data.cashPriceCents) {
    context.addIssue({
      code: "custom",
      message: "Preço à vista é obrigatório",
      path: ["cashPriceCents"],
    });
  }

  if (
    data.showCashOffer &&
    data.cashOfferMode === "discount-percent" &&
    data.cashDiscountPercent === undefined
  ) {
    context.addIssue({
      code: "custom",
      message: "Desconto é obrigatório",
      path: ["cashDiscountPercent"],
    });
  }

  if (data.showInstallments && (!data.installments || data.installments <= 1)) {
    context.addIssue({
      code: "custom",
      message: "Parcelas devem ser maior que 1",
      path: ["installments"],
    });
  }

  if (
    data.showInstallments &&
    data.installmentBase === "cash-price" &&
    !hasValidCashOffer(data)
  ) {
    context.addIssue({
      code: "custom",
      message: "Informe o preço à vista com desconto para usar esta base",
      path: ["installmentBase"],
    });
  }

  if (
    data.showInstallments &&
    data.installmentBase === "custom-price" &&
    !data.installmentPriceCents
  ) {
    context.addIssue({
      code: "custom",
      message: "Preço parcelado é obrigatório",
      path: ["installmentPriceCents"],
    });
  }
});

function hasValidCashOffer(data: {
  cashDiscountPercent?: number;
  cashOfferMode: (typeof PRODUCT_PROMPT_CASH_OFFER_MODE_VALUES)[number];
  cashPriceCents?: number;
  showCashOffer: boolean;
}): boolean {
  if (!data.showCashOffer) return false;
  if (data.cashOfferMode === "final-price") {
    return typeof data.cashPriceCents === "number" && data.cashPriceCents > 0;
  }
  return typeof data.cashDiscountPercent === "number";
}

export type ProductPromptCreateFormData = z.infer<
  typeof productPromptCreateSchema
>;

export type ProductPromptGenerateFormData = z.infer<
  typeof productPromptGenerateSchema
>;
