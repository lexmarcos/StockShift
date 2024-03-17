import { z } from "zod";
import { ProductCreatecategoriesInputObjectSchema } from "../../../../prisma/generated/schemas";
export const UpdateProductSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional().nullable(),
    price: z.number().optional(),
    quantity: z.number().optional(),
    categories: z
      .union([z.lazy(() => ProductCreatecategoriesInputObjectSchema), z.string().array()])
      .optional(),
    attributes: z.object({}).optional(),
    imageUrl: z.string().optional().nullable(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  })
  .strict();
