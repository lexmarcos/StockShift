import { z } from "zod";

export const createTransferSchema = z.object({
  destinationWarehouseId: z.string().min(1, "Selecione o warehouse de destino"),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Selecione um produto"),
        quantity: z.number().min(0.01, "Quantidade deve ser maior que zero"),
      })
    )
    .min(1, "Adicione pelo menos um item"),
});

export type CreateTransferFormData = z.infer<typeof createTransferSchema>;
