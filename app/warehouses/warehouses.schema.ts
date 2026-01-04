import { z } from "zod";

// Phone mask for Brazilian format: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
const phoneRegex = /^(\(\d{2}\)\s\d{4,5}-\d{4})?$/;

export const warehouseSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  description: z
    .string()
    .max(500, "Descrição deve ter no máximo 500 caracteres"),
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
  phone: z
    .string()
    .refine(
      (val) => !val || phoneRegex.test(val),
      "Formato de telefone inválido"
    ),
  email: z
    .string()
    .refine(
      (val) => !val || z.string().email().safeParse(val).success,
      "Email inválido"
    ),
  isActive: z.boolean(),
});

export type WarehouseFormData = z.infer<typeof warehouseSchema>;
