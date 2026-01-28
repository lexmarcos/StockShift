import { z } from "zod";

export const createUserSchema = z.object({
  fullName: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(255, "Nome deve ter no máximo 255 caracteres"),
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Email inválido"),
  password: z
    .string()
    .min(6, "Senha deve ter no mínimo 6 caracteres")
    .max(100, "Senha deve ter no máximo 100 caracteres"),
  roleIds: z
    .array(z.string())
    .min(1, "Selecione pelo menos uma role"),
  warehouseId: z.string().nullable(),
});

export const updateUserSchema = z.object({
  fullName: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(255, "Nome deve ter no máximo 255 caracteres"),
  roleIds: z
    .array(z.string())
    .min(1, "Selecione pelo menos uma role"),
  warehouseId: z.string().nullable(),
  isActive: z.boolean(),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
