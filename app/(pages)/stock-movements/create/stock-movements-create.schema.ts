import { z } from "zod";

export const stockMovementCreateSchema = z
  .object({
    movementType: z.enum(["ENTRY", "EXIT", "TRANSFER", "ADJUSTMENT"]),
    sourceWarehouseId: z.string().optional(),
    destinationWarehouseId: z.string().optional(),
    notes: z.string().optional(),
    executeNow: z.boolean().optional(),
    items: z
      .array(
        z.object({
          productId: z.string().min(1, "Selecione um produto"),
          batchId: z.string().optional(),
          quantity: z.number().int().min(1, "Quantidade inválida"),
          reason: z.string().optional(),
        })
      )
      .min(1, "Adicione ao menos um item"),
  })
  .superRefine((data, ctx) => {
    const type = data.movementType;
    if ((type === "ENTRY" || type === "TRANSFER") && !data.destinationWarehouseId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["destinationWarehouseId"],
        message: "Destino obrigatório",
      });
    }
    if (
      (type === "EXIT" || type === "TRANSFER" || type === "ADJUSTMENT") &&
      !data.sourceWarehouseId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceWarehouseId"],
        message: "Origem obrigatória",
      });
    }
    if ((type === "EXIT" || type === "TRANSFER") && data.items.some((item) => !item.batchId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["items"],
        message: "Batch obrigatório",
      });
    }
  });

export type StockMovementCreateFormData = z.infer<typeof stockMovementCreateSchema>;
