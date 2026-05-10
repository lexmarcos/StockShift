import { z } from "zod";

export const paymentMethods = [
  "CASH", "DEBIT_CARD", "CREDIT_CARD", "INSTALLMENT", "PIX", "BANK_TRANSFER", "OTHER",
] as const;

export type PaymentMethod = (typeof paymentMethods)[number];

export const METHODS_WITH_INSTALLMENTS: PaymentMethod[] = ["CREDIT_CARD", "INSTALLMENT"];

export const METHODS_WITH_PAYMENT_MODE: PaymentMethod[] = ["DEBIT_CARD", "CREDIT_CARD", "INSTALLMENT"];

const paymentModes = ["DIRECT", "TAP", "LINK"] as const;

export const pdvSchema = z.object({
  paymentMethod: z.enum(paymentMethods, { message: "Selecione a forma de pagamento" }),
  paymentMode: z.enum(paymentModes),
  installments: z.number().min(1).optional().nullable(),
  discountPercentage: z.number().min(0).max(100).optional().nullable(),
});

export type PdvSchema = z.infer<typeof pdvSchema>;
