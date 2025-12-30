import { z } from "zod";

export const brandSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(255, "Nome deve ter no máximo 255 caracteres"),
  logoUrl: z
    .string()
    .max(500, "URL deve ter no máximo 500 caracteres")
    .url("URL inválida")
    .optional()
    .or(z.literal("")),
});

export type BrandFormData = z.infer<typeof brandSchema>;
