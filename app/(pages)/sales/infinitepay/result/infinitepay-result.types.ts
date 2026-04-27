import type { Sale } from "../../sales.types";
import type { InfinitePayResultStatus } from "./infinitepay-result.schema";

export interface InfinitePayResultViewProps {
  status: InfinitePayResultStatus;
  sale: Sale | null;
  message: string | null;
  isLoading: boolean;
  hasSaleId: boolean;
  hasError: boolean;
  retrySaleFetch: () => void;
}
