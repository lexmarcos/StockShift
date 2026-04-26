import { z } from "zod";
import { MANUAL_MOVEMENT_TYPES } from "../stock-movements.constants";

const inlineProductImageSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  dataUrl: z.string().min(1),
});

export const inlineProductSchema = z.object({
  name: z.string().min(1, "Nome do produto é obrigatório"),
  description: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  isKit: z.boolean().optional(),
  hasExpiration: z.boolean().optional(),
  active: z.boolean().optional(),
  attributes: z.record(z.string(), z.string()).optional(),
  costPrice: z.number().int().min(0).optional(),
  sellingPrice: z.number().int().min(0).optional(),
  image: inlineProductImageSchema.optional(),
});

export const movementItemSchema = z.object({
  productId: z.string().uuid("Produto inválido").optional(),
  quantity: z.number().positive("Quantidade deve ser maior que zero"),
  productName: z.string().optional(), // UI helper
  newProductData: inlineProductSchema.optional(),
}).refine((item) => Boolean(item.productId) !== Boolean(item.newProductData), {
  message: "Informe um produto existente ou um novo produto",
  path: ["productId"],
});

export const createStockMovementSchema = z.object({
  type: z.enum(MANUAL_MOVEMENT_TYPES, {
    message: "Selecione o tipo de movimentação",
  }),
  notes: z.string().optional(),
  items: z.array(movementItemSchema).min(1, "Adicione pelo menos um item"),
});

export type CreateStockMovementSchema = z.infer<
  typeof createStockMovementSchema
>;
