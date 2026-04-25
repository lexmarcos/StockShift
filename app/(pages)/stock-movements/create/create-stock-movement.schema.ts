import { z } from "zod";
import { MANUAL_MOVEMENT_TYPES } from "../stock-movements.constants";

export const movementItemSchema = z.object({
  productId: z.string().uuid("Produto inválido"),
  quantity: z.number().positive("Quantidade deve ser maior que zero"),
  productName: z.string().optional(), // UI helper
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
