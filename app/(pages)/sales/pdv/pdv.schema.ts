import { z } from "zod";

export const paymentMethods = [
  "CASH", "DEBIT_CARD", "CREDIT_CARD", "INSTALLMENT", "PIX", "BANK_TRANSFER", "OTHER",
] as const;

export type PaymentMethod = (typeof paymentMethods)[number];

export const METHODS_WITH_INSTALLMENTS: PaymentMethod[] = ["CREDIT_CARD", "INSTALLMENT"];

export const pdvSchema = z.object({
  warehouseId: z.string().uuid("Selecione um armazém"),
  paymentMethod: z.enum(paymentMethods, { required_error: "Selecione a forma de pagamento" }),
  installments: z.number().min(1).optional().nullable(),
  discountPercentage: z.number().min(0).max(100).optional().nullable(),
});

export type PdvSchema = z.infer<typeof pdvSchema>;
