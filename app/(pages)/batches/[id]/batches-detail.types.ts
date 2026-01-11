import type { Batch } from "../batches.types";

export interface BatchDetailResponse {
  success: boolean;
  message?: string | null;
  data: Batch;
}
