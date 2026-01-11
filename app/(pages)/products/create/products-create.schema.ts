import { z } from "zod";

export const productCreateSchema = z.object({
  name: z.string().min(1, "Nome do produto é obrigatório"),
  description: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  isKit: z.boolean(),
  hasExpiration: z.boolean(),
  active: z.boolean(),
  continuousMode: z.boolean(),
  attributes: z.object({
    weight: z.string().optional(),
    dimensions: z.string().optional(),
  }).optional(),
  // Batch fields
  quantity: z.number().min(0, "Quantidade deve ser zero ou positiva"),
  manufacturedDate: z.string().optional(),
  expirationDate: z.string().optional(),
  costPrice: z.number().int().min(0).optional(),
  sellingPrice: z.number().int().min(0).optional(),
}).refine((data) => {
  if (data.hasExpiration && !data.expirationDate) {
    return false;
  }
  return true;
}, {
  message: "Data de validade é obrigatória para produtos com controle de validade",
  path: ["expirationDate"],
});

export type ProductCreateFormData = z.infer<typeof productCreateSchema>;
