import { z } from "zod";

export const roleFormSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(100, "Máximo 100 caracteres"),
  description: z.string().max(500, "Máximo 500 caracteres").optional(),
  permissionIds: z.array(z.string()),
});

export type RoleFormData = z.infer<typeof roleFormSchema>;
