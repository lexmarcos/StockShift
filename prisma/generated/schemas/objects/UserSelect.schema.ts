import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.UserSelect> = z
  .object({
    id: z.boolean().optional(),
    email: z.boolean().optional(),
    name: z.boolean().optional(),
    username: z.boolean().optional(),
    password: z.boolean().optional(),
  })
  .strict();

export const UserSelectObjectSchema = Schema;
