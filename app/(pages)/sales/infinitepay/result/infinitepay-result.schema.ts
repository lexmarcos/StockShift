import { z } from "zod";

export const infinitePayResultStatusSchema = z.enum(["success", "error"]);

export type InfinitePayResultStatus = z.infer<
  typeof infinitePayResultStatusSchema
>;
