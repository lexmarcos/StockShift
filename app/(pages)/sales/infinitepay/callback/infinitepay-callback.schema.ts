import { z } from "zod";

export const infinitePayCallbackStatusSchema = z.enum(["success", "error"]);

export type InfinitePayCallbackStatus = z.infer<
  typeof infinitePayCallbackStatusSchema
>;
