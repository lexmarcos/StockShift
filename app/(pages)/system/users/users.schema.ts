import { z } from "zod";

export const createUserSchema = z.object({
  fullName: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("Email inválido"),
  roleIds: z.array(z.string()).min(1, "Selecione ao menos uma role"),
  warehouseIds: z.array(z.string()).min(1, "Selecione ao menos um armazém"),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;

export const editUserSchema = z.object({
  fullName: z.string().min(1, "Nome obrigatório"),
  isActive: z.boolean(),
  roleIds: z.array(z.string()).min(1, "Selecione ao menos uma role"),
  warehouseIds: z.array(z.string()).min(1, "Selecione ao menos um armazém"),
});

export type EditUserFormData = z.infer<typeof editUserSchema>;
