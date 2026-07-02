import { z } from "zod";

export const updateSellingPriceSchema = z.object({
  sellingPrice: z
    .number({ error: "Informe o novo preço de venda" })
    .int()
    .min(0, "O preço deve ser zero ou positivo"),
});

export type UpdateSellingPriceFormData = z.infer<typeof updateSellingPriceSchema>;
