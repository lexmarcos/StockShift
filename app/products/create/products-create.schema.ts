import { z } from "zod";

export const productCreateSchema = z.object({
  name: z.string().min(1, "Nome do produto é obrigatório"),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  barcode: z.string().optional(),
  isKit: z.boolean(),
  hasExpiration: z.boolean(),
  active: z.boolean(),
  continuousMode: z.boolean(),
  attributes: z.object({
    weight: z.string().optional(),
    dimensions: z.string().optional(),
  }).optional(),
}).refine((data) => {
  if (data.barcode !== undefined && data.barcode.trim() === "") {
    return false;
  }
  return true;
}, {
  message: "Código de barras não pode estar vazio",
  path: ["barcode"],
});

export type ProductCreateFormData = z.infer<typeof productCreateSchema>;
