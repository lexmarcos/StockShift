import { z } from "zod";

export const batchEditSchema = z
  .object({
    productId: z.string().min(1),
    warehouseId: z.string().min(1),
    quantity: z.coerce.number().int().min(1),
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

export type BatchEditFormData = z.infer<typeof batchEditSchema>;
