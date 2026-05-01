import { z } from "zod";

export const batchFormSchema = z
  .object({
    quantity: z
      .number()
      .positive("Quantidade deve ser maior que zero")
      .int("Quantidade deve ser um número inteiro"),
    expirationDate: z.date().optional(),
    batchCode: z
      .string()
      .min(1, "Código do batch é obrigatório")
      .max(50, "Código do batch muito longo"),
  })
  .refine(
    (data) => {
      if (data.expirationDate && data.expirationDate <= new Date()) {
        return false;
      }
      return true;
    },
    {
      message: "Data de validade deve ser futura",
      path: ["expirationDate"],
    }
  );

export type BatchFormSchema = z.infer<typeof batchFormSchema>;
