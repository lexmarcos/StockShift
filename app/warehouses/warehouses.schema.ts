import { z } from "zod";

export const warehouseSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(255, "Nome deve ter no máximo 255 caracteres"),
  address: z
    .string()
    .max(255, "Endereço deve ter no máximo 255 caracteres"),
  city: z
    .string()
    .min(1, "Cidade é obrigatória")
    .min(2, "Cidade deve ter no mínimo 2 caracteres")
    .max(100, "Cidade deve ter no máximo 100 caracteres"),
  state: z
    .string()
    .min(1, "Estado é obrigatório")
    .min(2, "Estado deve ter no mínimo 2 caracteres")
    .max(100, "Estado deve ter no máximo 100 caracteres"),
  isActive: z.boolean(),
});

export type WarehouseFormData = z.infer<typeof warehouseSchema>;
