import { z } from "zod";

export const productBaseSchema = z.object({
  name: z.string().min(1, "Nome do produto é obrigatório"),
  description: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  isKit: z.boolean(),
  hasExpiration: z.boolean(),
  active: z.boolean(),
  continuousMode: z.boolean(),
  attributes: z
    .object({
      weight: z.string().optional(),
      dimensions: z.string().optional(),
    })
    .optional(),
  // Batch fields
  batchCode: z.string().optional(),
  quantity: z.number().min(0, "Quantidade deve ser zero ou positiva"),
  manufacturedDate: z.string().optional(),
  expirationDate: z.string().optional(),
  costPrice: z.number().int().min(0).optional(),
  sellingPrice: z.number().int().min(0).optional(),
});

const hasRequiredExpirationDate = (
  data: z.infer<typeof productBaseSchema>,
): boolean => {
  return !data.hasExpiration || Boolean(data.expirationDate);
};

const hasPositiveQuantity = (
  data: z.infer<typeof productBaseSchema>,
): boolean => {
  return data.quantity > 0;
};

export const productCreateSchema = productBaseSchema
  .refine(hasRequiredExpirationDate, {
    message:
      "Data de validade é obrigatória para produtos com controle de validade",
    path: ["expirationDate"],
  });

export const productInlineSchema = productBaseSchema
  .refine(hasPositiveQuantity, {
    message: "Quantidade deve ser maior que zero",
    path: ["quantity"],
  })
  .refine(hasRequiredExpirationDate, {
    message:
      "Data de validade é obrigatória para produtos com controle de validade",
    path: ["expirationDate"],
  });

export type ProductCreateFormData = z.infer<typeof productBaseSchema>;
