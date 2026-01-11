import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .trim(),
  description: z.string().trim().optional(),
  parentCategoryId: z.string().uuid().nullable().optional(),
  attributesSchema: z.record(z.string(), z.any()).optional(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
