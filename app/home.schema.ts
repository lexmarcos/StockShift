import { z } from "zod";

export const homeTokenPayloadSchema = z
  .object({
    warehouseId: z
      .preprocess((value) => {
        if (typeof value !== "string") return value;

        const trimmedValue = value.trim();
        return trimmedValue.length > 0 ? trimmedValue : null;
      }, z.string().min(1).nullable().optional()),
  })
  .passthrough();
