import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.UserCreateInput> = z
  .object({
    id: z.string().optional(),
    email: z.string(),
    name: z.string(),
    username: z.string(),
    password: z.string(),
  })
  .strict();

export const UserCreateInputObjectSchema = Schema;
