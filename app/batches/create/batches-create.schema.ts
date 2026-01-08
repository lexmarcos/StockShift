import { z } from "zod";

export const batchCreateSchema = z
  .object({
    productId: z.string().min(1, "Selecione um produto"),
    warehouseId: z.string().min(1, "Selecione um warehouse"),
    quantity: z.coerce.number().int().min(1, "Quantidade inválida"),
    batchCode: z.string().optional(),
    manufacturedDate: z.string().optional(),
    expirationDate: z.string().optional(),
    costPrice: z.coerce.number().optional(),
    sellingPrice: z.coerce.number().optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.manufacturedDate && data.expirationDate) {
      if (data.expirationDate < data.manufacturedDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["expirationDate"],
          message: "Validade deve ser após fabricação",
        });
      }
    }
  });

export type BatchCreateFormData = z.infer<typeof batchCreateSchema>;
