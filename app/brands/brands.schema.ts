import { z } from "zod";

export const brandSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(255, "Nome deve ter no máximo 255 caracteres"),
  logoUrl: z
    .union([
      z.string().url("URL inválida").max(500, "URL deve ter no máximo 500 caracteres"),
      z.literal("")
    ])
    .optional(),
});

export type BrandFormData = z.infer<typeof brandSchema>;
