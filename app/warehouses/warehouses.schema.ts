import { z } from "zod";

// Phone mask for Brazilian format: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
const phoneRegex = /^(\(\d{2}\)\s\d{4,5}-\d{4})?$/;

export const warehouseSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  code: z
    .string()
    .min(1, "Código é obrigatório")
    .min(2, "Código deve ter no mínimo 2 caracteres")
    .max(20, "Código deve ter no máximo 20 caracteres")
    .regex(/^[A-Z0-9\-]+$/, "Código deve conter apenas letras maiúsculas, números e hífen")
    .transform((val) => val.toUpperCase()),
  description: z
    .string()
    .max(500, "Descrição deve ter no máximo 500 caracteres"),
  address: z
    .string()
    .max(255, "Endereço deve ter no máximo 255 caracteres"),
  phone: z
    .string()
    .regex(phoneRegex, "Formato de telefone inválido")
    .or(z.literal("")),
  email: z
    .union([
      z.string().email("Email inválido"),
      z.literal("")
    ]),
  isActive: z.boolean(),
});

export type WarehouseFormData = z.infer<typeof warehouseSchema>;
