import type { Batch } from "../../batches.types";

export interface BatchEditResponse {
  success: boolean;
  message?: string | null;
  data: Batch;
}
