import { z } from "zod";

export const transferItemSchema = z.object({
  sourceBatchId: z.string().uuid("Lote inválido"),
  quantity: z.number().positive("Quantidade deve ser maior que zero"),
  productName: z.string().optional(), // UI helper
  batchCode: z.string().optional(), // UI helper
  availableQuantity: z.number().optional(), // UI helper
});

export const newTransferSchema = z.object({
  destinationWarehouseId: z.string().uuid("Selecione um warehouse de destino"),
  notes: z.string().optional(),
  items: z.array(transferItemSchema).min(1, "Adicione pelo menos um item"),
});

export type NewTransferSchema = z.infer<typeof newTransferSchema>;
