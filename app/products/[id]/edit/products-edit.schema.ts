import { z } from "zod";

export const batchEditItemSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  warehouseName: z.string().min(1),
  warehouseCode: z.string().optional().nullable(),
  batchCode: z.string().max(50),
  quantity: z.number().min(0, "Quantidade deve ser positiva"),
  expirationDate: z.string().optional(),
  costPrice: z.number().int().min(0).optional(),
  sellingPrice: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

export const batchEditFormSchema = z.object({
  batches: z.array(batchEditItemSchema),
});

export type BatchEditFormValues = z.infer<typeof batchEditFormSchema>;
